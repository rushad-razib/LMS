import type {
  CreateBlogPostInput,
  CreateGalleryItemInput,
  CreateMarketingTrainerInput,
  UpdateBlogPostInput,
  UpdateGalleryItemInput,
  UpdateMarketingTrainerInput,
} from "@arva/shared";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/errors.js";
import {
  deleteStoredObject,
  getDownloadUrl,
  storeCmsImage,
} from "../media/media.service.js";
import { sanitizeBlogHtml, slugify } from "./html.js";

async function uniqueBlogSlug(base: string, excludeId?: string) {
  let slug = base || "post";
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const existing = await prisma.blogPost.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    n += 1;
  }
}

function serializeBlog(post: {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  bodyHtml: string;
  coverImageKey: string | null;
  coverImageUrl: string | null;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...post,
    bodyHtml: sanitizeBlogHtml(post.bodyHtml),
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export async function adminListBlogPosts() {
  const posts = await prisma.blogPost.findMany({ orderBy: { updatedAt: "desc" } });
  return posts.map(serializeBlog);
}

export async function listPublishedBlogPosts() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return posts.map(serializeBlog);
}

export async function getPublishedBlogBySlug(slug: string) {
  const post = await prisma.blogPost.findFirst({
    where: { slug, published: true },
  });
  if (!post) throw new AppError(404, "Post not found", "NOT_FOUND");
  return serializeBlog(post);
}

export async function createBlogPost(input: CreateBlogPostInput) {
  const base = input.slug?.trim() || slugify(input.title);
  const slug = await uniqueBlogSlug(base);
  const published = input.published ?? false;
  const post = await prisma.blogPost.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      bodyHtml: sanitizeBlogHtml(input.bodyHtml),
      published,
      publishedAt: published ? new Date() : null,
    },
  });
  return serializeBlog(post);
}

export async function updateBlogPost(id: string, input: UpdateBlogPostInput) {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Post not found", "NOT_FOUND");

  let slug = existing.slug;
  if (input.slug !== undefined || input.title !== undefined) {
    const base = (input.slug?.trim() || slugify(input.title ?? existing.title))!;
    slug = await uniqueBlogSlug(base, id);
  }

  const published = input.published ?? existing.published;
  let publishedAt = existing.publishedAt;
  if (published && !existing.published) publishedAt = new Date();
  if (!published) publishedAt = null;

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title: input.title ?? undefined,
      slug,
      excerpt: input.excerpt ?? undefined,
      bodyHtml:
        input.bodyHtml !== undefined ? sanitizeBlogHtml(input.bodyHtml) : undefined,
      published,
      publishedAt,
    },
  });
  return serializeBlog(post);
}

export async function deleteBlogPost(id: string) {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Post not found", "NOT_FOUND");
  if (existing.coverImageKey) await deleteStoredObject(existing.coverImageKey);
  await prisma.blogPost.delete({ where: { id } });
  return { ok: true as const };
}

export async function uploadBlogCover(
  id: string,
  file: Express.Multer.File,
) {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Post not found", "NOT_FOUND");
  const stored = await storeCmsImage({
    kind: "blog",
    entityId: id,
    originalName: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer,
  });
  const url = await getDownloadUrl(stored.storageKey);
  if (existing.coverImageKey) await deleteStoredObject(existing.coverImageKey);
  const post = await prisma.blogPost.update({
    where: { id },
    data: { coverImageKey: stored.storageKey, coverImageUrl: url },
  });
  return serializeBlog(post);
}

function serializeGallery(item: {
  id: string;
  title: string | null;
  imageKey: string;
  imageUrl: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function adminListGallery() {
  const items = await prisma.galleryItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return items.map(serializeGallery);
}

export async function listPublicGallery() {
  return adminListGallery();
}

export async function createGalleryItem(
  input: CreateGalleryItemInput,
  file: Express.Multer.File,
) {
  const tempId = `tmp-${Date.now()}`;
  const stored = await storeCmsImage({
    kind: "gallery",
    entityId: tempId,
    originalName: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer,
  });
  const url = await getDownloadUrl(stored.storageKey);
  const item = await prisma.galleryItem.create({
    data: {
      title: input.title ?? null,
      sortOrder: input.sortOrder ?? 0,
      imageKey: stored.storageKey,
      imageUrl: url,
    },
  });
  return serializeGallery(item);
}

export async function updateGalleryItem(id: string, input: UpdateGalleryItemInput) {
  const existing = await prisma.galleryItem.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Gallery item not found", "NOT_FOUND");
  const item = await prisma.galleryItem.update({
    where: { id },
    data: {
      title: input.title === undefined ? undefined : input.title,
      sortOrder: input.sortOrder ?? undefined,
    },
  });
  return serializeGallery(item);
}

export async function deleteGalleryItem(id: string) {
  const existing = await prisma.galleryItem.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Gallery item not found", "NOT_FOUND");
  await deleteStoredObject(existing.imageKey);
  await prisma.galleryItem.delete({ where: { id } });
  return { ok: true as const };
}

function serializeTrainer(row: {
  id: string;
  fullName: string;
  title: string | null;
  bio: string | null;
  photoKey: string | null;
  photoUrl: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function adminListTrainers() {
  const rows = await prisma.marketingTrainer.findMany({
    orderBy: [{ sortOrder: "asc" }, { fullName: "asc" }],
  });
  return rows.map(serializeTrainer);
}

export async function listPublishedTrainers() {
  const rows = await prisma.marketingTrainer.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { fullName: "asc" }],
  });
  return rows.map(serializeTrainer);
}

export async function createTrainer(input: CreateMarketingTrainerInput) {
  const row = await prisma.marketingTrainer.create({
    data: {
      fullName: input.fullName,
      title: input.title ?? null,
      bio: input.bio ?? null,
      sortOrder: input.sortOrder ?? 0,
      published: input.published ?? true,
    },
  });
  return serializeTrainer(row);
}

export async function updateTrainer(id: string, input: UpdateMarketingTrainerInput) {
  const existing = await prisma.marketingTrainer.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Trainer not found", "NOT_FOUND");
  const row = await prisma.marketingTrainer.update({
    where: { id },
    data: {
      fullName: input.fullName ?? undefined,
      title: input.title === undefined ? undefined : input.title,
      bio: input.bio === undefined ? undefined : input.bio,
      sortOrder: input.sortOrder ?? undefined,
      published: input.published ?? undefined,
    },
  });
  return serializeTrainer(row);
}

export async function deleteTrainer(id: string) {
  const existing = await prisma.marketingTrainer.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Trainer not found", "NOT_FOUND");
  if (existing.photoKey) await deleteStoredObject(existing.photoKey);
  await prisma.marketingTrainer.delete({ where: { id } });
  return { ok: true as const };
}

export async function uploadTrainerPhoto(id: string, file: Express.Multer.File) {
  const existing = await prisma.marketingTrainer.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Trainer not found", "NOT_FOUND");
  const stored = await storeCmsImage({
    kind: "trainer",
    entityId: id,
    originalName: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer,
  });
  const url = await getDownloadUrl(stored.storageKey);
  if (existing.photoKey) await deleteStoredObject(existing.photoKey);
  const row = await prisma.marketingTrainer.update({
    where: { id },
    data: { photoKey: stored.storageKey, photoUrl: url },
  });
  return serializeTrainer(row);
}
