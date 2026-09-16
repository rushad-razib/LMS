import type { Course, Batch, User } from "@prisma/client";
import type {
  CreateBatchInput,
  CreateCourseInput,
  UpdateBatchInput,
  UpdateCourseInput,
} from "@arva/shared";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/errors.js";
import {
  deleteStoredObject,
  getDownloadUrl,
  storeCourseCoverImage,
} from "../media/media.service.js";
import { parseDateInput } from "../purchases/installments.util.js";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

export type CourseDto = {
  id: string;
  title: string;
  slug: string;
  overview: string;
  duration: string;
  priceBdt: number;
  outlineText: string | null;
  faqText: string | null;
  coverImageKey: string | null;
  coverImageUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  batchCount?: number;
};

export type BatchDto = {
  id: string;
  courseId: string;
  name: string;
  scheduleSummary: string | null;
  status: string;
  deliveryMode: string;
  seatCapacity: number;
  seatsFilled?: number;
  startDate: string | null;
  endDate: string | null;
  teacherId: string | null;
  teacher: { id: string; fullName: string; email: string } | null;
  course?: { id: string; title: string; slug: string };
  createdAt: string;
  updatedAt: string;
};

export type BatchOverviewDto = BatchDto & {
  seatsFilled: number;
  students: {
    id: string;
    fullName: string;
    email: string;
    enrolledAt: string;
    enrollmentId: string;
  }[];
};

async function resolveCoverUrl(course: Course): Promise<string | null> {
  if (!course.coverImageKey) return course.coverImageUrl;
  try {
    return await getDownloadUrl(course.coverImageKey);
  } catch (err) {
    console.error("resolveCoverUrl failed", err);
    return course.coverImageUrl;
  }
}

async function toCourseDto(
  course: Course & { _count?: { batches: number } },
): Promise<CourseDto> {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    overview: course.overview,
    duration: course.duration,
    priceBdt: course.priceBdt,
    outlineText: course.outlineText,
    faqText: course.faqText,
    coverImageKey: course.coverImageKey,
    coverImageUrl: await resolveCoverUrl(course),
    status: course.status,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    batchCount: course._count?.batches,
  };
}

function toBatchDto(
  batch: Batch & {
    teacher?: Pick<User, "id" | "fullName" | "email"> | null;
    course?: Pick<Course, "id" | "title" | "slug">;
    _count?: { enrollments: number };
  },
): BatchDto {
  return {
    id: batch.id,
    courseId: batch.courseId,
    name: batch.name,
    scheduleSummary: batch.scheduleSummary,
    status: batch.status,
    deliveryMode: batch.deliveryMode,
    seatCapacity: batch.seatCapacity,
    seatsFilled: batch._count?.enrollments,
    startDate: batch.startDate?.toISOString() ?? null,
    endDate: batch.endDate?.toISOString() ?? null,
    teacherId: batch.teacherId,
    teacher: batch.teacher
      ? {
          id: batch.teacher.id,
          fullName: batch.teacher.fullName,
          email: batch.teacher.email,
        }
      : null,
    course: batch.course
      ? { id: batch.course.id, title: batch.course.title, slug: batch.course.slug }
      : undefined,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
  };
}

async function assertUniqueSlug(slug: string, excludeId?: string) {
  const existing = await prisma.course.findFirst({
    where: {
      slug,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
  if (existing) {
    throw new AppError(409, "Course slug already exists", "SLUG_TAKEN");
  }
}

async function assertTeacher(teacherId: string | null | undefined) {
  if (!teacherId) return;
  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!teacher || teacher.role !== "TEACHER" || teacher.status === "DISABLED") {
    throw new AppError(400, "Invalid teacher", "INVALID_TEACHER");
  }
}

function parseOptionalDate(value: string | null | undefined, field: string): Date | null {
  try {
    return parseDateInput(value);
  } catch {
    throw new AppError(400, `Invalid ${field}`, "VALIDATION_ERROR");
  }
}

export async function assertBatchHasSeat(batchId: string, excludeEnrollmentId?: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      _count: {
        select: {
          enrollments: {
            where: {
              status: "ACTIVE",
              ...(excludeEnrollmentId ? { NOT: { id: excludeEnrollmentId } } : {}),
            },
          },
        },
      },
    },
  });
  if (!batch) {
    throw new AppError(404, "Batch not found", "NOT_FOUND");
  }
  if (batch._count.enrollments >= batch.seatCapacity) {
    throw new AppError(409, "Batch is full", "BATCH_FULL");
  }
  return batch;
}

export async function listPublishedCourses() {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { title: "asc" },
    include: { _count: { select: { batches: true } } },
  });
  return Promise.all(courses.map(toCourseDto));
}

export async function getPublishedCourseBySlug(slug: string) {
  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { _count: { select: { batches: true } } },
  });
  if (!course) {
    throw new AppError(404, "Course not found", "NOT_FOUND");
  }
  return toCourseDto(course);
}

export async function adminListCourses() {
  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    include: { _count: { select: { batches: true } } },
  });
  return Promise.all(courses.map(toCourseDto));
}

export async function adminGetCourse(id: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      _count: { select: { batches: true } },
      batches: {
        include: {
          teacher: { select: { id: true, fullName: true, email: true } },
          _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!course) {
    throw new AppError(404, "Course not found", "NOT_FOUND");
  }
  return {
    ...(await toCourseDto(course)),
    batches: course.batches.map(toBatchDto),
  };
}

export async function createCourse(input: CreateCourseInput) {
  const slug = input.slug?.trim() || slugify(input.title);
  await assertUniqueSlug(slug);

  const course = await prisma.course.create({
    data: {
      title: input.title,
      slug,
      overview: input.overview,
      duration: input.duration,
      priceBdt: input.priceBdt,
      outlineText: input.outlineText ?? null,
      faqText: input.faqText ?? null,
      status: input.status ?? "DRAFT",
      coverImageKey: input.coverImageKey ?? null,
      coverImageUrl: input.coverImageUrl ?? null,
    },
    include: { _count: { select: { batches: true } } },
  });
  return toCourseDto(course);
}

export async function updateCourse(id: string, input: UpdateCourseInput) {
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Course not found", "NOT_FOUND");
  }

  const slug =
    input.slug !== undefined
      ? input.slug.trim()
      : input.title
        ? slugify(input.title)
        : undefined;

  if (slug && slug !== existing.slug) {
    await assertUniqueSlug(slug, id);
  }

  if (input.coverImageKey === null && existing.coverImageKey) {
    await deleteStoredObject(existing.coverImageKey);
  }

  const course = await prisma.course.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(input.overview !== undefined ? { overview: input.overview } : {}),
      ...(input.duration !== undefined ? { duration: input.duration } : {}),
      ...(input.priceBdt !== undefined ? { priceBdt: input.priceBdt } : {}),
      ...(input.outlineText !== undefined ? { outlineText: input.outlineText } : {}),
      ...(input.faqText !== undefined ? { faqText: input.faqText } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.coverImageKey !== undefined
        ? { coverImageKey: input.coverImageKey }
        : {}),
      ...(input.coverImageUrl !== undefined
        ? { coverImageUrl: input.coverImageUrl }
        : {}),
    },
    include: { _count: { select: { batches: true } } },
  });
  return toCourseDto(course);
}

export async function uploadCourseCover(
  courseId: string,
  file: { originalname: string; mimetype: string; buffer: Buffer },
) {
  const existing = await prisma.course.findUnique({ where: { id: courseId } });
  if (!existing) {
    throw new AppError(404, "Course not found", "NOT_FOUND");
  }

  const stored = await storeCourseCoverImage({
    courseId,
    originalName: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer,
  });
  const url = await getDownloadUrl(stored.storageKey);

  if (existing.coverImageKey && existing.coverImageKey !== stored.storageKey) {
    await deleteStoredObject(existing.coverImageKey);
  }

  const course = await prisma.course.update({
    where: { id: courseId },
    data: {
      coverImageKey: stored.storageKey,
      coverImageUrl: url,
    },
    include: { _count: { select: { batches: true } } },
  });
  return toCourseDto(course);
}

export async function deleteCourse(id: string) {
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Course not found", "NOT_FOUND");
  }
  if (existing.coverImageKey) {
    await deleteStoredObject(existing.coverImageKey);
  }
  await prisma.course.delete({ where: { id } });
  return { ok: true as const };
}

export async function adminListBatches(courseId?: string) {
  const batches = await prisma.batch.findMany({
    where: courseId ? { courseId } : undefined,
    include: {
      teacher: { select: { id: true, fullName: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return batches.map(toBatchDto);
}

export async function adminGetBatch(id: string): Promise<BatchOverviewDto> {
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      teacher: { select: { id: true, fullName: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });
  if (!batch) {
    throw new AppError(404, "Batch not found", "NOT_FOUND");
  }

  return {
    ...toBatchDto({
      ...batch,
      _count: { enrollments: batch.enrollments.length },
    }),
    seatsFilled: batch.enrollments.length,
    students: batch.enrollments.map((e) => ({
      id: e.user.id,
      fullName: e.user.fullName,
      email: e.user.email,
      enrolledAt: e.createdAt.toISOString(),
      enrollmentId: e.id,
    })),
  };
}

export async function createBatch(input: CreateBatchInput) {
  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course) {
    throw new AppError(404, "Course not found", "NOT_FOUND");
  }
  await assertTeacher(input.teacherId);

  const startDate =
    input.startDate !== undefined
      ? parseOptionalDate(input.startDate, "startDate")
      : null;
  const endDate =
    input.endDate !== undefined ? parseOptionalDate(input.endDate, "endDate") : null;

  const batch = await prisma.batch.create({
    data: {
      courseId: input.courseId,
      name: input.name,
      scheduleSummary: input.scheduleSummary ?? null,
      status: input.status ?? "UPCOMING",
      teacherId: input.teacherId ?? null,
      deliveryMode: input.deliveryMode ?? "ONLINE",
      seatCapacity: input.seatCapacity ?? 30,
      startDate,
      endDate,
    },
    include: {
      teacher: { select: { id: true, fullName: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
  });
  return toBatchDto(batch);
}

export async function updateBatch(id: string, input: UpdateBatchInput) {
  const existing = await prisma.batch.findUnique({
    where: { id },
    include: { _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
  });
  if (!existing) {
    throw new AppError(404, "Batch not found", "NOT_FOUND");
  }
  if (input.teacherId !== undefined) {
    await assertTeacher(input.teacherId);
  }
  if (
    input.seatCapacity !== undefined &&
    input.seatCapacity < existing._count.enrollments
  ) {
    throw new AppError(
      400,
      "Seat capacity cannot be below current enrollment count",
      "SEAT_CAPACITY_TOO_LOW",
    );
  }

  const batch = await prisma.batch.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.scheduleSummary !== undefined
        ? { scheduleSummary: input.scheduleSummary }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.teacherId !== undefined ? { teacherId: input.teacherId } : {}),
      ...(input.deliveryMode !== undefined
        ? { deliveryMode: input.deliveryMode }
        : {}),
      ...(input.seatCapacity !== undefined
        ? { seatCapacity: input.seatCapacity }
        : {}),
      ...(input.startDate !== undefined
        ? { startDate: parseOptionalDate(input.startDate, "startDate") }
        : {}),
      ...(input.endDate !== undefined
        ? { endDate: parseOptionalDate(input.endDate, "endDate") }
        : {}),
    },
    include: {
      teacher: { select: { id: true, fullName: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
  });
  return toBatchDto(batch);
}

export async function assignBatchTeacher(id: string, teacherId: string | null) {
  return updateBatch(id, { teacherId });
}

export async function deleteBatch(id: string) {
  const existing = await prisma.batch.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Batch not found", "NOT_FOUND");
  }
  await prisma.batch.delete({ where: { id } });
  return { ok: true as const };
}

export async function listTeachers() {
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", status: { not: "DISABLED" } },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, email: true },
  });
  return teachers;
}
