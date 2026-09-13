import type {
  CreateAnnouncementInput,
  CreateLiveSessionInput,
  UpdateAnnouncementInput,
  UpdateLiveSessionInput,
  UpdateTeacherProfileInput,
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
  meetingUrl: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: session.id,
    title: session.title,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt?.toISOString() ?? null,
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

  const session = await prisma.liveSession.create({
    data: {
      batchId,
      title: input.title,
      startsAt,
      endsAt,
      meetingUrl: normalizeMeetingUrl(input.meetingUrl),
      notes: emptyToNull(input.notes) ?? null,
    },
  });
  return serializeSession(session);
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

  const session = await prisma.liveSession.update({
    where: { id: sessionId },
    data: {
      title: input.title ?? existing.title,
      startsAt,
      endsAt,
      meetingUrl: input.meetingUrl
        ? normalizeMeetingUrl(input.meetingUrl)
        : existing.meetingUrl,
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
  const user = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!user || user.role !== "TEACHER") {
    throw new AppError(403, "Teacher access only", "FORBIDDEN");
  }
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
  };
}

export async function updateTeacherProfile(
  teacherId: string,
  input: UpdateTeacherProfileInput,
) {
  const user = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!user || user.role !== "TEACHER") {
    throw new AppError(403, "Teacher access only", "FORBIDDEN");
  }
  const updated = await prisma.user.update({
    where: { id: teacherId },
    data: { fullName: input.fullName },
  });
  return {
    id: updated.id,
    email: updated.email,
    fullName: updated.fullName,
  };
}
