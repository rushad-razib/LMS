import type { Course, Batch, User } from "@prisma/client";
import type {
  CreateBatchInput,
  CreateCourseInput,
  UpdateBatchInput,
  UpdateCourseInput,
} from "@arva/shared";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/errors.js";

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
  teacherId: string | null;
  teacher: { id: string; fullName: string; email: string } | null;
  course?: { id: string; title: string; slug: string };
  createdAt: string;
  updatedAt: string;
};

function toCourseDto(course: Course & { _count?: { batches: number } }): CourseDto {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    overview: course.overview,
    duration: course.duration,
    priceBdt: course.priceBdt,
    outlineText: course.outlineText,
    faqText: course.faqText,
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
  },
): BatchDto {
  return {
    id: batch.id,
    courseId: batch.courseId,
    name: batch.name,
    scheduleSummary: batch.scheduleSummary,
    status: batch.status,
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

export async function listPublishedCourses() {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { title: "asc" },
    include: { _count: { select: { batches: true } } },
  });
  return courses.map(toCourseDto);
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
  return courses.map(toCourseDto);
}

export async function adminGetCourse(id: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      _count: { select: { batches: true } },
      batches: {
        include: { teacher: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!course) {
    throw new AppError(404, "Course not found", "NOT_FOUND");
  }
  return {
    ...toCourseDto(course),
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
  await prisma.course.delete({ where: { id } });
  return { ok: true as const };
}

export async function adminListBatches(courseId?: string) {
  const batches = await prisma.batch.findMany({
    where: courseId ? { courseId } : undefined,
    include: {
      teacher: { select: { id: true, fullName: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return batches.map(toBatchDto);
}

export async function createBatch(input: CreateBatchInput) {
  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course) {
    throw new AppError(404, "Course not found", "NOT_FOUND");
  }
  await assertTeacher(input.teacherId);

  const batch = await prisma.batch.create({
    data: {
      courseId: input.courseId,
      name: input.name,
      scheduleSummary: input.scheduleSummary ?? null,
      status: input.status ?? "UPCOMING",
      teacherId: input.teacherId ?? null,
    },
    include: {
      teacher: { select: { id: true, fullName: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
    },
  });
  return toBatchDto(batch);
}

export async function updateBatch(id: string, input: UpdateBatchInput) {
  const existing = await prisma.batch.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Batch not found", "NOT_FOUND");
  }
  if (input.teacherId !== undefined) {
    await assertTeacher(input.teacherId);
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
    },
    include: {
      teacher: { select: { id: true, fullName: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
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
