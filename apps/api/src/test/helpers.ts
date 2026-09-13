import request from "supertest";
import type { Express } from "express";
import { createApp } from "../app.js";
import { loadEnv, resetEnvCache } from "../config/env.js";
import { prisma } from "../db/prisma.js";

export async function buildTestApp(): Promise<Express> {
  resetEnvCache();
  const env = loadEnv();
  return createApp({ ...env, NODE_ENV: "test" });
}

export function api(app: Express) {
  return request(app);
}

export async function cleanupTestUsers(emailPrefix: string) {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: emailPrefix } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;
  await prisma.enrollment.deleteMany({ where: { userId: { in: ids } } });
  await prisma.order.deleteMany({ where: { userId: { in: ids } } });
  await prisma.authToken.deleteMany({ where: { userId: { in: ids } } });
  await prisma.studentProfile.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

export async function cleanupCoursesBySlugPrefix(slugPrefix: string) {
  const courses = await prisma.course.findMany({
    where: { slug: { startsWith: slugPrefix } },
    select: { id: true },
  });
  const courseIds = courses.map((c) => c.id);
  if (courseIds.length === 0) return;

  const batches = await prisma.batch.findMany({
    where: { courseId: { in: courseIds } },
    select: { id: true },
  });
  const batchIds = batches.map((b) => b.id);
  if (batchIds.length > 0) {
    await prisma.liveSession.deleteMany({ where: { batchId: { in: batchIds } } });
    await prisma.batchMaterial.deleteMany({ where: { batchId: { in: batchIds } } });
    await prisma.batchAnnouncement.deleteMany({
      where: { batchId: { in: batchIds } },
    });
  }

  await prisma.enrollment.deleteMany({ where: { courseId: { in: courseIds } } });
  await prisma.order.deleteMany({ where: { courseId: { in: courseIds } } });
  await prisma.batch.deleteMany({ where: { courseId: { in: courseIds } } });
  await prisma.course.deleteMany({ where: { id: { in: courseIds } } });
}

export async function setEmailVerificationRequired(value: boolean) {
  await prisma.websiteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", emailVerificationRequired: value },
    update: { emailVerificationRequired: value },
  });
}

export function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}
