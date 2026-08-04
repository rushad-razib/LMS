import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Express } from "express";
import { prisma } from "../../db/prisma.js";
import {
  api,
  buildTestApp,
  cleanupTestUsers,
  uniqueEmail,
} from "../../test/helpers.js";

const PREFIX = "phase2.courses";

describe("Phase 2 — Courses & batches", () => {
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
  });

  beforeEach(async () => {
    await cleanupTestUsers(PREFIX);
    await prisma.batch.deleteMany({
      where: { course: { slug: { startsWith: "phase2-" } } },
    });
    await prisma.course.deleteMany({ where: { slug: { startsWith: "phase2-" } } });
  });

  afterAll(async () => {
    await cleanupTestUsers(PREFIX);
    await prisma.batch.deleteMany({
      where: { course: { slug: { startsWith: "phase2-" } } },
    });
    await prisma.course.deleteMany({ where: { slug: { startsWith: "phase2-" } } });
    await prisma.$disconnect();
  });

  it("lists only published courses publicly", async () => {
    await api(app)
      .post("/api/v1/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Phase2 Draft Course",
        slug: "phase2-draft-course",
        overview: "Draft overview text for testing courses module.",
        duration: "1 month",
        priceBdt: 5000,
        status: "DRAFT",
      });

    await api(app)
      .post("/api/v1/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Phase2 Published Course",
        slug: "phase2-published-course",
        overview: "Published overview text for testing courses module.",
        duration: "2 months",
        priceBdt: 9000,
        status: "PUBLISHED",
      });

    const res = await api(app).get("/api/v1/courses/public");
    expect(res.status).toBe(200);
    const slugs = res.body.courses.map((c: { slug: string }) => c.slug);
    expect(slugs).toContain("phase2-published-course");
    expect(slugs).not.toContain("phase2-draft-course");
  });

  it("returns published course by slug", async () => {
    await api(app)
      .post("/api/v1/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Phase2 Detail Course",
        slug: "phase2-detail-course",
        overview: "Detail overview text for testing course detail endpoint.",
        duration: "3 months",
        priceBdt: 12000,
        outlineText: "- Topic A\n- Topic B",
        status: "PUBLISHED",
      });

    const res = await api(app).get("/api/v1/courses/public/phase2-detail-course");
    expect(res.status).toBe(200);
    expect(res.body.course.priceBdt).toBe(12000);
    expect(res.body.course.outlineText).toContain("Topic A");
  });

  it("forbids students from creating courses", async () => {
    const email = uniqueEmail(PREFIX);
    const registered = await api(app).post("/api/v1/auth/register").send({
      fullName: "Student",
      email,
      password: "Password#123",
    });

    const res = await api(app)
      .post("/api/v1/courses")
      .set("Authorization", `Bearer ${registered.body.accessToken}`)
      .send({
        title: "Nope",
        overview: "Students cannot create courses in admin API.",
        duration: "1 month",
        priceBdt: 1000,
      });

    expect(res.status).toBe(403);
  });

  it("creates a batch and assigns/reassigns a teacher", async () => {
    const teacherEmail = uniqueEmail(`${PREFIX}.teacher`);
    const teacherRes = await api(app)
      .post("/api/v1/auth/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        fullName: "Phase2 Teacher",
        email: teacherEmail,
        role: "TEACHER",
        password: "Password#123",
      });
    expect(teacherRes.status).toBe(201);
    const teacherId = teacherRes.body.user.id as string;

    const courseRes = await api(app)
      .post("/api/v1/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Phase2 Batch Course",
        slug: "phase2-batch-course",
        overview: "Course used to test batch teacher assignment flows.",
        duration: "2 months",
        priceBdt: 11000,
        status: "PUBLISHED",
      });
    const courseId = courseRes.body.course.id as string;

    const batchRes = await api(app)
      .post("/api/v1/courses/batches")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        courseId,
        name: "Evening A",
        scheduleSummary: "Sun/Tue 7pm",
        teacherId,
      });
    expect(batchRes.status).toBe(201);
    expect(batchRes.body.batch.teacherId).toBe(teacherId);

    const teacher2Email = uniqueEmail(`${PREFIX}.teacher2`);
    const teacher2 = await api(app)
      .post("/api/v1/auth/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        fullName: "Phase2 Teacher 2",
        email: teacher2Email,
        role: "TEACHER",
        password: "Password#123",
      });

    const reassign = await api(app)
      .patch(`/api/v1/courses/batches/${batchRes.body.batch.id}/teacher`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ teacherId: teacher2.body.user.id });

    expect(reassign.status).toBe(200);
    expect(reassign.body.batch.teacherId).toBe(teacher2.body.user.id);
  });

  it("rejects assigning a non-teacher as batch teacher", async () => {
    const studentEmail = uniqueEmail(PREFIX);
    const student = await api(app).post("/api/v1/auth/register").send({
      fullName: "Not Teacher",
      email: studentEmail,
      password: "Password#123",
    });

    const courseRes = await api(app)
      .post("/api/v1/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Phase2 Invalid Teacher Course",
        slug: "phase2-invalid-teacher-course",
        overview: "Course used to validate teacher role checks on batches.",
        duration: "1 month",
        priceBdt: 4000,
        status: "DRAFT",
      });

    const res = await api(app)
      .post("/api/v1/courses/batches")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        courseId: courseRes.body.course.id,
        name: "Bad Assign",
        teacherId: student.body.user.id,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_TEACHER");
  });
});
