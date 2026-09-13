import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Express } from "express";
import { prisma } from "../../db/prisma.js";
import {
  api,
  buildTestApp,
  cleanupTestUsers,
  setEmailVerificationRequired,
  uniqueEmail,
} from "../../test/helpers.js";
import * as purchasesService from "./purchases.service.js";

const PREFIX = "phase3.purchases";

describe("Phase 3 — Purchases & enrollments", () => {
  let app: Express;
  let adminToken: string;

  beforeAll(async () => {
    app = await buildTestApp();
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD required");
    }
    const login = await api(app).post("/api/v1/auth/login").send({
      email: adminEmail,
      password: adminPassword,
    });
    expect(login.status).toBe(200);
    adminToken = login.body.accessToken;
    await setEmailVerificationRequired(false);
  });

  beforeEach(async () => {
    await cleanupTestUsers(PREFIX);
    await prisma.enrollment.deleteMany({
      where: { course: { slug: { startsWith: "phase3-" } } },
    });
    await prisma.order.deleteMany({
      where: { course: { slug: { startsWith: "phase3-" } } },
    });
    await prisma.batch.deleteMany({
      where: { course: { slug: { startsWith: "phase3-" } } },
    });
    await prisma.course.deleteMany({ where: { slug: { startsWith: "phase3-" } } });
  });

  afterAll(async () => {
    await cleanupTestUsers(PREFIX);
    await prisma.enrollment.deleteMany({
      where: { course: { slug: { startsWith: "phase3-" } } },
    });
    await prisma.order.deleteMany({
      where: { course: { slug: { startsWith: "phase3-" } } },
    });
    await prisma.batch.deleteMany({
      where: { course: { slug: { startsWith: "phase3-" } } },
    });
    await prisma.course.deleteMany({ where: { slug: { startsWith: "phase3-" } } });
    await prisma.$disconnect();
  });

  async function createStudent() {
    const email = uniqueEmail(PREFIX);
    const reg = await api(app).post("/api/v1/auth/register").send({
      fullName: "Phase3 Student",
      email,
      password: "Student12345!",
    });
    expect(reg.status).toBe(201);
    return { email, token: reg.body.accessToken as string, userId: reg.body.user.id as string };
  }

  async function createCourse(opts: {
    slug: string;
    priceBdt: number;
    status?: "PUBLISHED" | "DRAFT";
  }) {
    const res = await api(app)
      .post("/api/v1/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: `Phase3 ${opts.slug}`,
        slug: opts.slug,
        overview: "Phase 3 course overview text for purchases tests.",
        duration: "1 month",
        priceBdt: opts.priceBdt,
        status: opts.status ?? "PUBLISHED",
      });
    expect(res.status).toBe(201);
    return res.body.course as { id: string; slug: string; priceBdt: number };
  }

  it("enrolls free course online without gateway", async () => {
    const student = await createStudent();
    const course = await createCourse({ slug: "phase3-free", priceBdt: 0 });

    const res = await api(app)
      .post("/api/v1/purchases/checkout")
      .set("Authorization", `Bearer ${student.token}`)
      .send({ courseId: course.id });

    expect(res.status).toBe(201);
    expect(res.body.kind).toBe("enrolled");
    expect(res.body.order.status).toBe("PAID");
    expect(res.body.enrollment.batchId).toBeNull();
    expect(res.body.enrollment.status).toBe("ACTIVE");
  });

  it("rejects duplicate enrollment", async () => {
    const student = await createStudent();
    const course = await createCourse({ slug: "phase3-dup", priceBdt: 0 });

    await api(app)
      .post("/api/v1/purchases/checkout")
      .set("Authorization", `Bearer ${student.token}`)
      .send({ courseId: course.id });

    const res = await api(app)
      .post("/api/v1/purchases/checkout")
      .set("Authorization", `Bearer ${student.token}`)
      .send({ courseId: course.id });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ALREADY_ENROLLED");
  });

  it("admin office enroll + batch assign", async () => {
    const student = await createStudent();
    const course = await createCourse({ slug: "phase3-office", priceBdt: 5000 });

    const batchRes = await api(app)
      .post("/api/v1/courses/batches")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        courseId: course.id,
        name: "Phase3 Batch A",
        status: "UPCOMING",
      });
    expect(batchRes.status).toBe(201);
    const batchId = batchRes.body.batch.id as string;

    const enroll = await api(app)
      .post("/api/v1/purchases/admin/enroll")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        studentId: student.userId,
        courseId: course.id,
        paymentMethod: "CASH",
      });
    expect(enroll.status).toBe(201);
    expect(enroll.body.order.channel).toBe("ADMIN");
    expect(enroll.body.order.status).toBe("PAID");
    expect(enroll.body.enrollment.batchId).toBeNull();

    const assign = await api(app)
      .patch(`/api/v1/purchases/admin/enrollments/${enroll.body.enrollment.id}/batch`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ batchId });
    expect(assign.status).toBe(200);
    expect(assign.body.enrollment.batchId).toBe(batchId);
    expect(assign.body.enrollment.batch.name).toBe("Phase3 Batch A");
  });

  it("blocks student delete when enrollments exist", async () => {
    const student = await createStudent();
    const course = await createCourse({ slug: "phase3-delete", priceBdt: 0 });

    await api(app)
      .post("/api/v1/purchases/checkout")
      .set("Authorization", `Bearer ${student.token}`)
      .send({ courseId: course.id });

    const del = await api(app)
      .delete(`/api/v1/auth/admin/users/${student.userId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(del.status).toBe(409);
    expect(del.body.error.code).toBe("ACCOUNT_HAS_ENROLLMENTS");
  });

  it("fulfillOnlineOrder is idempotent", async () => {
    const student = await createStudent();
    const course = await createCourse({ slug: "phase3-ipn", priceBdt: 3000 });

    const order = await prisma.order.create({
      data: {
        userId: student.userId,
        courseId: course.id,
        amountBdt: 3000,
        channel: "ONLINE",
        status: "PENDING",
        provider: "SSLCOMMERZ",
        tranId: `ARVA-phase3-ipn-${Date.now()}`,
      },
    });

    const first = await purchasesService.fulfillOnlineOrder({
      tranId: order.tranId,
      providerRef: "val-test-1",
      amountBdt: 3000,
    });
    expect(first.created).toBe(true);
    expect(first.order.status).toBe("PAID");
    expect(first.enrollment.status).toBe("ACTIVE");

    const second = await purchasesService.fulfillOnlineOrder({
      tranId: order.tranId,
      providerRef: "val-test-1",
      amountBdt: 3000,
    });
    expect(second.created).toBe(false);

    const count = await prisma.enrollment.count({
      where: { userId: student.userId, courseId: course.id },
    });
    expect(count).toBe(1);
  });

  it("paid checkout without SSLCommerz config returns 503", async () => {
    const prevId = process.env.SSLCOMMERZ_STORE_ID;
    const prevPass = process.env.SSLCOMMERZ_STORE_PASSWORD;
    process.env.SSLCOMMERZ_STORE_ID = "";
    process.env.SSLCOMMERZ_STORE_PASSWORD = "";
    // reset env cache so loadEnv picks up empty credentials
    const { resetEnvCache } = await import("../../config/env.js");
    resetEnvCache();
    app = await buildTestApp();

    const student = await createStudent();
    const course = await createCourse({ slug: "phase3-paid", priceBdt: 9000 });

    const res = await api(app)
      .post("/api/v1/purchases/checkout")
      .set("Authorization", `Bearer ${student.token}`)
      .send({ courseId: course.id });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("PAYMENT_NOT_CONFIGURED");

    process.env.SSLCOMMERZ_STORE_ID = prevId ?? "";
    process.env.SSLCOMMERZ_STORE_PASSWORD = prevPass ?? "";
    resetEnvCache();
    app = await buildTestApp();
    const login = await api(app).post("/api/v1/auth/login").send({
      email: process.env.ADMIN_EMAIL!.toLowerCase(),
      password: process.env.ADMIN_PASSWORD!,
    });
    adminToken = login.body.accessToken;
  });
});
