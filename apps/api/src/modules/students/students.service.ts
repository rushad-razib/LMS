import type { UpdateStudentProfileInput } from "@arva/shared";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/errors.js";
import { resolveMaterialUrl } from "../media/media.service.js";

async function getActiveEnrollmentBySlug(userId: string, slug: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      course: { slug },
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          overview: true,
          duration: true,
          priceBdt: true,
        },
      },
      batch: {
        select: {
          id: true,
          name: true,
          scheduleSummary: true,
          status: true,
          teacher: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  if (!enrollment) {
    throw new AppError(404, "Enrollment not found", "NOT_ENROLLED");
  }

  return enrollment;
}

async function requireAssignedBatch(userId: string, slug: string) {
  const enrollment = await getActiveEnrollmentBySlug(userId, slug);
  if (!enrollment.batchId || !enrollment.batch) {
    throw new AppError(
      403,
      "Batch assignment required before viewing cohort content",
      "AWAITING_BATCH",
    );
  }
  return enrollment;
}

function serializeEnrollment(
  enrollment: Awaited<ReturnType<typeof getActiveEnrollmentBySlug>>,
) {
  return {
    id: enrollment.id,
    status: enrollment.status,
    batchId: enrollment.batchId,
    awaitingBatch: !enrollment.batchId,
    createdAt: enrollment.createdAt.toISOString(),
    course: enrollment.course,
    batch: enrollment.batch
      ? {
          id: enrollment.batch.id,
          name: enrollment.batch.name,
          scheduleSummary: enrollment.batch.scheduleSummary,
          status: enrollment.batch.status,
          teacher: enrollment.batch.teacher,
        }
      : null,
  };
}

export async function listMyEnrollments(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          overview: true,
          duration: true,
          priceBdt: true,
        },
      },
      batch: {
        select: {
          id: true,
          name: true,
          scheduleSummary: true,
          status: true,
          teacher: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  return enrollments.map(serializeEnrollment);
}

export async function getCourseHub(userId: string, slug: string) {
  const enrollment = await getActiveEnrollmentBySlug(userId, slug);
  return serializeEnrollment(enrollment);
}

export async function listCourseSessions(userId: string, slug: string) {
  const enrollment = await requireAssignedBatch(userId, slug);
  const sessions = await prisma.liveSession.findMany({
    where: { batchId: enrollment.batchId! },
    orderBy: { startsAt: "asc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    title: s.title,
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt?.toISOString() ?? null,
    meetingUrl: s.meetingUrl,
    notes: s.notes,
  }));
}

export async function listCourseMaterials(userId: string, slug: string) {
  const enrollment = await requireAssignedBatch(userId, slug);
  const materials = await prisma.batchMaterial.findMany({
    where: { batchId: enrollment.batchId! },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    materials.map(async (m) => ({
      id: m.id,
      title: m.title,
      fileName: m.fileName,
      mimeType: m.mimeType,
      sizeBytes: m.sizeBytes,
      url: await resolveMaterialUrl(m),
      createdAt: m.createdAt.toISOString(),
    })),
  );
}

export async function listCourseAnnouncements(userId: string, slug: string) {
  const enrollment = await requireAssignedBatch(userId, slug);
  const announcements = await prisma.batchAnnouncement.findMany({
    where: { batchId: enrollment.batchId! },
    orderBy: { createdAt: "desc" },
  });

  return announcements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function getStudentProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true },
  });
  if (!user || user.role !== "STUDENT") {
    throw new AppError(403, "Student access only", "FORBIDDEN");
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.studentProfile?.phone ?? null,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
  };
}

export async function updateStudentProfile(
  userId: string,
  input: UpdateStudentProfileInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true },
  });
  if (!user || user.role !== "STUDENT") {
    throw new AppError(403, "Student access only", "FORBIDDEN");
  }

  if (input.phone !== undefined) {
    const phone = input.phone === "" ? null : input.phone;
    await prisma.studentProfile.upsert({
      where: { userId },
      create: { userId, phone },
      update: { phone },
    });
  }

  return getStudentProfile(userId);
}
