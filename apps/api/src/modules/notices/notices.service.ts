import type {
  CreateGlobalNoticeInput,
  UpdateGlobalNoticeInput,
} from "@arva/shared";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/errors.js";

function serialize(notice: {
  id: string;
  title: string;
  body: string;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...notice,
    publishedAt: notice.publishedAt?.toISOString() ?? null,
    createdAt: notice.createdAt.toISOString(),
    updatedAt: notice.updatedAt.toISOString(),
  };
}

export async function adminListNotices() {
  const rows = await prisma.globalNotice.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(serialize);
}

export async function listPublishedNotices() {
  const rows = await prisma.globalNotice.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(serialize);
}

export async function createNotice(input: CreateGlobalNoticeInput) {
  const published = input.published ?? false;
  const row = await prisma.globalNotice.create({
    data: {
      title: input.title,
      body: input.body,
      published,
      publishedAt: published ? new Date() : null,
    },
  });
  return serialize(row);
}

export async function updateNotice(id: string, input: UpdateGlobalNoticeInput) {
  const existing = await prisma.globalNotice.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Notice not found", "NOT_FOUND");

  const published = input.published ?? existing.published;
  let publishedAt = existing.publishedAt;
  if (published && !existing.published) publishedAt = new Date();
  if (!published) publishedAt = null;

  const row = await prisma.globalNotice.update({
    where: { id },
    data: {
      title: input.title ?? undefined,
      body: input.body ?? undefined,
      published,
      publishedAt,
    },
  });
  return serialize(row);
}

export async function deleteNotice(id: string) {
  const existing = await prisma.globalNotice.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Notice not found", "NOT_FOUND");
  await prisma.globalNotice.delete({ where: { id } });
  return { ok: true as const };
}
