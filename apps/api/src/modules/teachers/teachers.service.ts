import {
  SessionType,
  Weekday,
  type CreateAnnouncementInput,
  type CreateLiveSessionInput,
  type SaveSessionAttendanceInput,
  type UpdateAnnouncementInput,
  type UpdateLiveSessionInput,
  type UpdateTeacherProfileInput,
  type Weekday as WeekdayValue,
} from "@arva/shared";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/errors.js";
import * as mediaService from "../media/media.service.js";
import { sendBatchAnnouncementEmail } from "./teachers.email.js";

function parseDate(value: string, field: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `Invalid ${field}`, "VALIDATION_ERROR");
  }
  return date;
}

function normalizeMeetingUrl(raw: string) {
  const trimmed = raw.trim();
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProto);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("bad protocol");
    }
    return url.toString();
  } catch {
    throw new AppError(400, "Invalid meeting URL", "VALIDATION_ERROR");
  }
}

const MAX_WEEKLY_CLASSES = 200;

const JS_DAY_TO_WEEKDAY = [
  Weekday.Sunday,
  Weekday.Monday,
  Weekday.Tuesday,
  Weekday.Wednesday,
  Weekday.Thursday,
  Weekday.Friday,
  Weekday.Saturday,
] as const;

function weekdayOf(date: Date): WeekdayValue {
  return JS_DAY_TO_WEEKDAY[date.getDay()] ?? Weekday.Sunday;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseUntilDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new AppError(400, "Invalid until", "VALIDATION_ERROR");
    }
    return date;
  }
  return startOfLocalDay(parseDate(value, "until"));
}

function weeklyStarts(startsAt: Date, until: Date, weekdays: WeekdayValue[]) {
  const selected = new Set(weekdays);
  const end = startOfLocalDay(until);
  const cursor = startOfLocalDay(startsAt);
  if (end.getTime() < cursor.getTime()) {
    throw new AppError(
      400,
      "Until date must be on or after the start date",
      "VALIDATION_ERROR",
    );
  }
  const dates: Date[] = [];
  for (let day = cursor; day.getTime() <= end.getTime(); day = addLocalDays(day, 1)) {
    if (!selected.has(weekdayOf(day))) continue;
    const at = new Date(day);
    at.setHours(startsAt.getHours(), startsAt.getMinutes(), 0, 0);
    dates.push(at);
    if (dates.length > MAX_WEEKLY_CLASSES) {
      throw new AppError(
        400,
        `Weekly repeat creates more than ${MAX_WEEKLY_CLASSES} classes. Choose a shorter range.`,
        "VALIDATION_ERROR",
      );
    }
  }
  if (dates.length === 0) {
    throw new AppError(
      400,
      "No classes fall on the selected weekdays in that range",
      "VALIDATION_ERROR",
    );
  }
  return dates;
}

function meetingUrlFor(sessionType: number, meetingUrl: string | null | undefined) {
  if (sessionType === SessionType.Offline) return null;
  const raw = meetingUrl?.trim() ?? "";
  if (!raw) {
    throw new AppError(400, "Meeting URL is required for online classes", "VALIDATION_ERROR");
  }
  return normalizeMeetingUrl(raw);
}

function emptyToNull(value: string | null | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

async function requireAssignedBatch(teacherId: string, batchId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      course: { select: { id: true, title: true, slug: true } },
    },
  });
  if (!batch) {
    throw new AppError(404, "Batch not found", "NOT_FOUND");
  }
  if (batch.teacherId !== teacherId) {
    throw new AppError(403, "You are not assigned to this batch", "BATCH_NOT_ASSIGNED");
  }
  return batch;
}

function serializeSession(session: {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  sessionType: number;
  meetingUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: session.id,
    title: session.title,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt?.toISOString() ?? null,
    sessionType: session.sessionType,
    meetingUrl: session.meetingUrl,
    notes: session.notes,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

function serializeAnnouncement(row: {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function serializeMaterial(row: {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  url: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    title: row.title,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    url: await mediaService.resolveMaterialUrl(row),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listMyBatches(teacherId: string) {
  const batches = await prisma.batch.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      _count: {
        select: {
          enrollments: { where: { status: "ACTIVE" } },
          liveSessions: true,
          materials: true,
          announcements: true,
        },
      },
    },
  });

  return batches.map((batch) => ({
    id: batch.id,
    name: batch.name,
    scheduleSummary: batch.scheduleSummary,
    status: batch.status,
    course: batch.course,
    studentCount: batch._count.enrollments,
    sessionCount: batch._count.liveSessions,
    materialCount: batch._count.materials,
    announcementCount: batch._count.announcements,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
  }));
}

export async function getBatchHub(teacherId: string, batchId: string) {
  const batch = await requireAssignedBatch(teacherId, batchId);
  const [studentCount, upcomingSession, latestAnnouncement] = await Promise.all([
    prisma.enrollment.count({
      where: { batchId: batch.id, status: "ACTIVE" },
    }),
    prisma.liveSession.findFirst({
      where: { batchId: batch.id, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.batchAnnouncement.findFirst({
      where: { batchId: batch.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    id: batch.id,
    name: batch.name,
    scheduleSummary: batch.scheduleSummary,
    status: batch.status,
    course: batch.course,
    studentCount,
    upcomingSession: upcomingSession ? serializeSession(upcomingSession) : null,
    latestAnnouncement: latestAnnouncement
      ? serializeAnnouncement(latestAnnouncement)
      : null,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
  };
}

export async function listSessions(teacherId: string, batchId: string) {
  await requireAssignedBatch(teacherId, batchId);
  const sessions = await prisma.liveSession.findMany({
    where: { batchId },
    orderBy: { startsAt: "asc" },
  });
  return sessions.map(serializeSession);
}

export async function createSession(
  teacherId: string,
  batchId: string,
  input: CreateLiveSessionInput,
) {
  await requireAssignedBatch(teacherId, batchId);
  const startsAt = parseDate(input.startsAt, "startsAt");
  const endsAt = input.endsAt ? parseDate(input.endsAt, "endsAt") : null;
  if (endsAt && endsAt.getTime() < startsAt.getTime()) {
    throw new AppError(400, "End time must be after start time", "VALIDATION_ERROR");
  }

  const meetingUrl = meetingUrlFor(input.sessionType, input.meetingUrl);
  const notes = emptyToNull(input.notes) ?? null;
  const durationMs = endsAt ? endsAt.getTime() - startsAt.getTime() : null;
  const starts = input.weekly
    ? weeklyStarts(startsAt, parseUntilDate(input.weekly.until), input.weekly.weekdays)
    : [startsAt];

  const created = await prisma.$transaction(
    starts.map((start) =>
      prisma.liveSession.create({
        data: {
          batchId,
          title: input.title,
          startsAt: start,
          endsAt: durationMs === null ? null : new Date(start.getTime() + durationMs),
          sessionType: input.sessionType,
          meetingUrl,
          notes,
        },
      }),
    ),
  );
  const sessions = created.map(serializeSession);
  return { session: sessions[0]!, sessions };
}

export async function updateSession(
  teacherId: string,
  batchId: string,
  sessionId: string,
  input: UpdateLiveSessionInput,
) {
  await requireAssignedBatch(teacherId, batchId);
  const existing = await prisma.liveSession.findFirst({
    where: { id: sessionId, batchId },
  });
  if (!existing) {
    throw new AppError(404, "Session not found", "NOT_FOUND");
  }

  const startsAt = input.startsAt
    ? parseDate(input.startsAt, "startsAt")
    : existing.startsAt;
  const endsAt =
    input.endsAt === undefined
      ? existing.endsAt
      : input.endsAt
        ? parseDate(input.endsAt, "endsAt")
        : null;
  if (endsAt && endsAt.getTime() < startsAt.getTime()) {
    throw new AppError(400, "End time must be after start time", "VALIDATION_ERROR");
  }

  const sessionType = input.sessionType ?? existing.sessionType;
  const meetingUrl =
    sessionType === SessionType.Offline
      ? null
      : meetingUrlFor(
          sessionType,
          input.meetingUrl === undefined ? existing.meetingUrl : input.meetingUrl,
        );

  const session = await prisma.liveSession.update({
    where: { id: sessionId },
    data: {
      title: input.title ?? existing.title,
      startsAt,
      endsAt,
      sessionType,
      meetingUrl,
      notes:
        input.notes === undefined ? existing.notes : emptyToNull(input.notes) ?? null,
    },
  });
  return serializeSession(session);
}

export async function deleteSession(
  teacherId: string,
  batchId: string,
  sessionId: string,
) {
  await requireAssignedBatch(teacherId, batchId);
  const existing = await prisma.liveSession.findFirst({
    where: { id: sessionId, batchId },
  });
  if (!existing) {
    throw new AppError(404, "Session not found", "NOT_FOUND");
  }
  await prisma.liveSession.delete({ where: { id: sessionId } });
  return { ok: true as const };
}

async function participationPercents(batchId: string, userIds: string[]) {
  const held = await prisma.liveSession.findMany({
    where: { batchId, startsAt: { lte: new Date() } },
    select: { id: true },
  });
  if (held.length === 0) {
    return new Map(userIds.map((id) => [id, null as number | null]));
  }
  const present = await prisma.sessionAttendance.groupBy({
    by: ["userId"],
    where: {
      userId: { in: userIds },
      present: true,
      sessionId: { in: held.map((session) => session.id) },
    },
    _count: { _all: true },
  });
  const counts = new Map(present.map((row) => [row.userId, row._count._all]));
  return new Map(
    userIds.map((id) => {
      const markedPresent = counts.get(id) ?? 0;
      return [id, Math.round((markedPresent / held.length) * 100)] as const;
    }),
  );
}

async function activeBatchStudents(batchId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { batchId, status: "ACTIVE" },
    include: { user: { select: { id: true, fullName: true, email: true } } },
    orderBy: { user: { fullName: "asc" } },
  });
  const ratings = await participationPercents(
    batchId,
    enrollments.map((enrollment) => enrollment.userId),
  );
  return enrollments.map((enrollment) => ({
    userId: enrollment.user.id,
    fullName: enrollment.user.fullName,
    email: enrollment.user.email,
    participationPercent: ratings.get(enrollment.userId) ?? null,
  }));
}

export async function listBatchStudents(teacherId: string, batchId: string) {
  await requireAssignedBatch(teacherId, batchId);
  const students = await activeBatchStudents(batchId);
  return students;
}

export async function getSessionAttendance(
  teacherId: string,
  batchId: string,
  sessionId: string,
) {
  await requireAssignedBatch(teacherId, batchId);
  const session = await prisma.liveSession.findFirst({
    where: { id: sessionId, batchId },
  });
  if (!session) {
    throw new AppError(404, "Session not found", "NOT_FOUND");
  }
  const [students, marks] = await Promise.all([
    activeBatchStudents(batchId),
    prisma.sessionAttendance.findMany({ where: { sessionId } }),
  ]);
  const presentByUser = new Map(marks.map((mark) => [mark.userId, mark.present]));
  return {
    session: serializeSession(session),
    students: students.map((student) => ({
      ...student,
      present: presentByUser.get(student.userId) ?? false,
    })),
  };
}

export async function saveSessionAttendance(
  teacherId: string,
  batchId: string,
  sessionId: string,
  input: SaveSessionAttendanceInput,
) {
  await requireAssignedBatch(teacherId, batchId);
  const session = await prisma.liveSession.findFirst({
    where: { id: sessionId, batchId },
    select: { id: true },
  });
  if (!session) {
    throw new AppError(404, "Session not found", "NOT_FOUND");
  }
  const enrolled = await prisma.enrollment.findMany({
    where: { batchId, status: "ACTIVE" },
    select: { userId: true },
  });
  const allowed = new Set(enrolled.map((row) => row.userId));
  for (const mark of input.marks) {
    if (!allowed.has(mark.userId)) {
      throw new AppError(400, "Student is not enrolled in this batch", "VALIDATION_ERROR");
    }
  }

  await prisma.$transaction(
    input.marks.map((mark) =>
      prisma.sessionAttendance.upsert({
        where: { sessionId_userId: { sessionId, userId: mark.userId } },
        create: { sessionId, userId: mark.userId, present: mark.present },
        update: { present: mark.present },
      }),
    ),
  );
  return getSessionAttendance(teacherId, batchId, sessionId);
}

export async function listSchedule(teacherId: string, month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) {
    throw new AppError(400, "Month must be YYYY-MM", "VALIDATION_ERROR");
  }
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) {
    throw new AppError(400, "Month must be YYYY-MM", "VALIDATION_ERROR");
  }
  const from = new Date(year, monthIndex, 1);
  const to = new Date(year, monthIndex + 1, 1);
  const sessions = await prisma.liveSession.findMany({
    where: {
      startsAt: { gte: from, lt: to },
      batch: { teacherId },
    },
    include: { batch: { select: { id: true, name: true } } },
    orderBy: { startsAt: "asc" },
  });
  return sessions.map((session) => ({
    ...serializeSession(session),
    batch: session.batch,
  }));
}

export async function listMaterials(teacherId: string, batchId: string) {
  await requireAssignedBatch(teacherId, batchId);
  const materials = await prisma.batchMaterial.findMany({
    where: { batchId },
    orderBy: { createdAt: "desc" },
  });
  return Promise.all(materials.map(serializeMaterial));
}

export async function uploadMaterial(
  teacherId: string,
  batchId: string,
  input: {
    title?: string;
    originalName: string;
    mimeType: string;
    buffer: Buffer;
  },
) {
  await requireAssignedBatch(teacherId, batchId);
  const stored = await mediaService.storeMaterialFile({
    batchId,
    originalName: input.originalName,
    mimeType: input.mimeType,
    buffer: input.buffer,
  });
  const title =
    input.title?.trim() ||
    stored.fileName.replace(/\.[^.]+$/, "") ||
    "Material";
  const url = await mediaService.getDownloadUrl(stored.storageKey);
  const material = await prisma.batchMaterial.create({
    data: {
      batchId,
      title,
      fileName: stored.fileName,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      storageKey: stored.storageKey,
      url,
    },
  });
  return serializeMaterial(material);
}

export async function deleteMaterial(
  teacherId: string,
  batchId: string,
  materialId: string,
) {
  await requireAssignedBatch(teacherId, batchId);
  const existing = await prisma.batchMaterial.findFirst({
    where: { id: materialId, batchId },
  });
  if (!existing) {
    throw new AppError(404, "Material not found", "NOT_FOUND");
  }
  await mediaService.deleteStoredObject(existing.storageKey);
  await prisma.batchMaterial.delete({ where: { id: materialId } });
  return { ok: true as const };
}

export async function listAnnouncements(teacherId: string, batchId: string) {
  await requireAssignedBatch(teacherId, batchId);
  const rows = await prisma.batchAnnouncement.findMany({
    where: { batchId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeAnnouncement);
}

export async function createAnnouncement(
  teacherId: string,
  batchId: string,
  input: CreateAnnouncementInput,
) {
  const batch = await requireAssignedBatch(teacherId, batchId);
  const announcement = await prisma.batchAnnouncement.create({
    data: {
      batchId,
      title: input.title,
      body: input.body,
    },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { batchId, status: "ACTIVE" },
    include: { user: { select: { email: true, fullName: true } } },
  });
  await Promise.allSettled(
    enrollments.map((enrollment) =>
      sendBatchAnnouncementEmail(
        enrollment.user.email,
        enrollment.user.fullName,
        batch.course.title,
        batch.name,
        announcement.title,
        announcement.body,
      ),
    ),
  );

  return serializeAnnouncement(announcement);
}

export async function updateAnnouncement(
  teacherId: string,
  batchId: string,
  announcementId: string,
  input: UpdateAnnouncementInput,
) {
  await requireAssignedBatch(teacherId, batchId);
  const existing = await prisma.batchAnnouncement.findFirst({
    where: { id: announcementId, batchId },
  });
  if (!existing) {
    throw new AppError(404, "Announcement not found", "NOT_FOUND");
  }
  const row = await prisma.batchAnnouncement.update({
    where: { id: announcementId },
    data: {
      title: input.title ?? existing.title,
      body: input.body ?? existing.body,
    },
  });
  return serializeAnnouncement(row);
}

export async function deleteAnnouncement(
  teacherId: string,
  batchId: string,
  announcementId: string,
) {
  await requireAssignedBatch(teacherId, batchId);
  const existing = await prisma.batchAnnouncement.findFirst({
    where: { id: announcementId, batchId },
  });
  if (!existing) {
    throw new AppError(404, "Announcement not found", "NOT_FOUND");
  }
  await prisma.batchAnnouncement.delete({ where: { id: announcementId } });
  return { ok: true as const };
}

export async function getTeacherProfile(teacherId: string) {
  const user = await prisma.user.findUnique({
    where: { id: teacherId },
    include: { teacherProfile: true },
  });
  if (!user || user.role !== "TEACHER") {
    throw new AppError(404, "Teacher not found", "NOT_FOUND");
  }
  const p = user.teacherProfile;
  let cvUrl: string | null = null;
  if (p?.cvKey) {
    try {
      cvUrl = await mediaService.getDownloadUrl(p.cvKey);
    } catch (err) {
      console.error("teacher CV url failed", err);
    }
  }
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: p?.phone ?? null,
    title: p?.title ?? null,
    bio: p?.bio ?? null,
    photoUrl: p?.photoUrl ?? null,
    cvFileName: p?.cvFileName ?? null,
    cvUrl,
  };
}

export async function updateTeacherProfile(
  teacherId: string,
  input: UpdateTeacherProfileInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: teacherId },
    include: { teacherProfile: true },
  });
  if (!user || user.role !== "TEACHER") {
    throw new AppError(404, "Teacher not found", "NOT_FOUND");
  }
  const updated = await prisma.user.update({
    where: { id: teacherId },
    data: { fullName: input.fullName },
  });

  const profileData = {
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.bio !== undefined ? { bio: input.bio } : {}),
  };

  if (Object.keys(profileData).length > 0 || !user.teacherProfile) {
    await prisma.teacherProfile.upsert({
      where: { userId: teacherId },
      create: { userId: teacherId, ...profileData },
      update: profileData,
    });
  }

  return getTeacherProfile(updated.id);
}

export async function uploadTeacherPhoto(
  teacherId: string,
  file: Express.Multer.File,
) {
  const user = await prisma.user.findUnique({
    where: { id: teacherId },
    include: { teacherProfile: true },
  });
  if (!user || user.role !== "TEACHER") {
    throw new AppError(404, "Teacher not found", "NOT_FOUND");
  }

  let profile = user.teacherProfile;
  if (!profile) {
    profile = await prisma.teacherProfile.create({
      data: { userId: teacherId },
    });
  }

  const stored = await mediaService.storeCmsImage({
    kind: "teacher",
    entityId: teacherId,
    originalName: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer,
  });
  const url = await mediaService.getDownloadUrl(stored.storageKey);
  if (profile.photoKey) await mediaService.deleteStoredObject(profile.photoKey);
  await prisma.teacherProfile.update({
    where: { id: profile.id },
    data: { photoKey: stored.storageKey, photoUrl: url },
  });
  return getTeacherProfile(teacherId);
}

export async function uploadTeacherCv(
  teacherId: string,
  file: Express.Multer.File,
) {
  const user = await prisma.user.findUnique({
    where: { id: teacherId },
    include: { teacherProfile: true },
  });
  if (!user || user.role !== "TEACHER") {
    throw new AppError(404, "Teacher not found", "NOT_FOUND");
  }

  let profile = user.teacherProfile;
  if (!profile) {
    profile = await prisma.teacherProfile.create({
      data: { userId: teacherId },
    });
  }

  const stored = await mediaService.storeTeacherCv({
    teacherId,
    originalName: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer,
  });
  if (profile.cvKey) await mediaService.deleteStoredObject(profile.cvKey);
  await prisma.teacherProfile.update({
    where: { id: profile.id },
    data: { cvKey: stored.storageKey, cvFileName: stored.fileName },
  });
  return getTeacherProfile(teacherId);
}

export async function deleteTeacherCv(teacherId: string) {
  const user = await prisma.user.findUnique({
    where: { id: teacherId },
    include: { teacherProfile: true },
  });
  if (!user || user.role !== "TEACHER") {
    throw new AppError(404, "Teacher not found", "NOT_FOUND");
  }
  const profile = user.teacherProfile;
  if (!profile?.cvKey) {
    return getTeacherProfile(teacherId);
  }
  await mediaService.deleteStoredObject(profile.cvKey);
  await prisma.teacherProfile.update({
    where: { id: profile.id },
    data: { cvKey: null, cvFileName: null },
  });
  return getTeacherProfile(teacherId);
}
