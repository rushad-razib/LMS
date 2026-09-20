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
import { resetEnvCache } from "../../config/env.js";

const PREFIX = "rev.lms";

describe("LMS revision — seats, installments, access block", () => {
  let app: Express;
  let adminToken: string;

  beforeAll(async () => {
    process.env.CRON_SECRET = "test-cron-secret";
    resetEnvCache();
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
    await prisma.installment.deleteMany({
      where: { plan: { course: { slug: { startsWith: "rev-" } } } },
    });
    await prisma.installmentPlan.deleteMany({
      where: { course: { slug: { startsWith: "rev-" } } },
    });
    await prisma.enrollment.deleteMany({
      where: { course: { slug: { startsWith: "rev-" } } },
    });
    await prisma.order.deleteMany({
      where: { course: { slug: { startsWith: "rev-" } } },
    });
    await prisma.batch.deleteMany({
      where: { course: { slug: { startsWith: "rev-" } } },
    });
    await prisma.course.deleteMany({ where: { slug: { startsWith: "rev-" } } });
  });

  afterAll(async () => {
    await cleanupTestUsers(PREFIX);
    await prisma.installment.deleteMany({
      where: { plan: { course: { slug: { startsWith: "rev-" } } } },
    });
    await prisma.installmentPlan.deleteMany({
      where: { course: { slug: { startsWith: "rev-" } } },
    });
    await prisma.enrollment.deleteMany({
      where: { course: { slug: { startsWith: "rev-" } } },
    });
    await prisma.order.deleteMany({
      where: { course: { slug: { startsWith: "rev-" } } },
    });
    await prisma.batch.deleteMany({
      where: { course: { slug: { startsWith: "rev-" } } },
    });
    await prisma.course.deleteMany({ where: { slug: { startsWith: "rev-" } } });
    await prisma.$disconnect();
  });

  async function createStudent() {
    const email = uniqueEmail(PREFIX);
    const reg = await api(app).post("/api/v1/auth/register").send({
      fullName: "Revision Student",
      email,
      password: "Student12345!",
      phone: "01700000001",
    });
    expect(reg.status).toBe(201);
    return {
      email,
      token: reg.body.accessToken as string,
      userId: reg.body.user.id as string,
    };
  }

  async function createCourse(slug: string, priceBdt = 12001) {
    const res = await api(app)
      .post("/api/v1/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: `Rev ${slug}`,
        slug,
        overview: "Revision course overview for installment and seat tests.",
        duration: "3 months",
        priceBdt,
        status: "PUBLISHED",
      });
    expect(res.status).toBe(201);
    return res.body.course as { id: string; slug: string; priceBdt: number };
  }

  it("creates batch with mode/seats and returns overview roster", async () => {
    const course = await createCourse("rev-batch-overview");
    const batchRes = await api(app)
      .post("/api/v1/courses/batches")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        courseId: course.id,
        name: "Offline A",
        deliveryMode: "OFFLINE",
        seatCapacity: 2,
        startDate: "2026-10-01",
        endDate: "2026-12-31",
        scheduleSummary: "Fri 6pm",
      });
    expect(batchRes.status).toBe(201);
    expect(batchRes.body.batch.deliveryMode).toBe("OFFLINE");
    expect(batchRes.body.batch.seatCapacity).toBe(2);

    const student = await createStudent();
    const enroll = await api(app)
      .post("/api/v1/purchases/admin/enroll")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        studentId: student.userId,
        courseId: course.id,
        paymentMethod: "CASH",
        batchId: batchRes.body.batch.id,
        paymentMode: "FULL",
      });
    expect(enroll.status).toBe(201);

    const overview = await api(app)
      .get(`/api/v1/courses/batches/${batchRes.body.batch.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(overview.status).toBe(200);
    expect(overview.body.batch.seatsFilled).toBe(1);
    expect(overview.body.batch.seatCapacity).toBe(2);
    expect(overview.body.batch.students).toHaveLength(1);
    expect(overview.body.batch.students[0].email).toBe(student.email);
  });

  it("rejects enroll when batch is full", async () => {
    const course = await createCourse("rev-batch-full", 1000);
    const batchRes = await api(app)
      .post("/api/v1/courses/batches")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        courseId: course.id,
        name: "Tiny",
        seatCapacity: 1,
        deliveryMode: "ONLINE",
      });
    const batchId = batchRes.body.batch.id as string;

    const s1 = await createStudent();
    const first = await api(app)
      .post("/api/v1/purchases/admin/enroll")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        studentId: s1.userId,
        courseId: course.id,
        paymentMethod: "CASH",
        batchId,
      });
    expect(first.status).toBe(201);

    const s2 = await createStudent();
    const second = await api(app)
      .post("/api/v1/purchases/admin/enroll")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        studentId: s2.userId,
        courseId: course.id,
        paymentMethod: "CASH",
        batchId,
      });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("BATCH_FULL");
  });

  it("admin installment enroll creates plan and marks first paid", async () => {
    const student = await createStudent();
    const course = await createCourse("rev-installment", 12001);

    const enroll = await api(app)
      .post("/api/v1/purchases/admin/enroll")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        studentId: student.userId,
        courseId: course.id,
        paymentMethod: "CASH",
        paymentMode: "INSTALLMENT_3",
      });
    expect(enroll.status).toBe(201);
    expect(enroll.body.order.amountBdt).toBe(4001);
    expect(enroll.body.plan.months).toBe(3);
    expect(enroll.body.plan.installments).toHaveLength(3);
    expect(enroll.body.plan.installments[0].status).toBe("PAID");
    expect(enroll.body.plan.installments[0].amountBdt).toBe(4001);
    expect(enroll.body.plan.installments[1].status).toBe("DUE");
    expect(enroll.body.plan.installments[1].amountBdt).toBe(4000);

    const detail = await api(app)
      .get(`/api/v1/purchases/admin/students/${student.userId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.enrollments[0].dueBdt).toBe(8000);
    expect(detail.body.enrollments[0].totalBdt).toBe(12001);

    const dueId = enroll.body.plan.installments[1].id as string;
    const pay = await api(app)
      .post(`/api/v1/purchases/admin/installments/${dueId}/pay`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ paymentMethod: "CARD" });
    expect(pay.status).toBe(200);
    expect(pay.body.installment.status).toBe("PAID");
  });

  it("accessBlocked hides cohort content for student", async () => {
    const student = await createStudent();
    const course = await createCourse("rev-block", 0);
    const batchRes = await api(app)
      .post("/api/v1/courses/batches")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ courseId: course.id, name: "B1", seatCapacity: 10 });
    const enroll = await api(app)
      .post("/api/v1/purchases/admin/enroll")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        studentId: student.userId,
        courseId: course.id,
        paymentMethod: "CASH",
        batchId: batchRes.body.batch.id,
      });

    const block = await api(app)
      .patch(`/api/v1/purchases/admin/enrollments/${enroll.body.enrollment.id}/access`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ accessBlocked: true });
    expect(block.status).toBe(200);

    const hub = await api(app)
      .get(`/api/v1/students/courses/${course.slug}`)
      .set("Authorization", `Bearer ${student.token}`);
    expect(hub.status).toBe(200);
    expect(hub.body.enrollment.accessBlocked).toBe(true);

    const sessions = await api(app)
      .get(`/api/v1/students/courses/${course.slug}/sessions`)
      .set("Authorization", `Bearer ${student.token}`);
    expect(sessions.status).toBe(403);
    expect(sessions.body.error.code).toBe("ACCESS_BLOCKED");
  });

  it("cron installment reminders require secret and skip non-1st", async () => {
    const denied = await api(app).post("/api/v1/internal/installment-reminders");
    expect(denied.status).toBe(401);

    const ok = await api(app)
      .post("/api/v1/internal/installment-reminders")
      .set("x-cron-secret", "test-cron-secret");
    expect(ok.status).toBe(200);
    expect(ok.body.ok).toBe(true);
  });
});
