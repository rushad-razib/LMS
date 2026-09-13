import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Express } from "express";
import { prisma } from "../../db/prisma.js";
import {
  api,
  buildTestApp,
  cleanupCoursesBySlugPrefix,
  cleanupTestUsers,
  setEmailVerificationRequired,
  uniqueEmail,
} from "../../test/helpers.js";

const PREFIX = "phase4.students";
const SLUG_PREFIX = "phase4-";

describe("Phase 4 — Student portal gating", () => {
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
    await cleanupCoursesBySlugPrefix(SLUG_PREFIX);
  });

  afterAll(async () => {
    await cleanupTestUsers(PREFIX);
    await cleanupCoursesBySlugPrefix(SLUG_PREFIX);
    await prisma.$disconnect();
  });

  async function createStudent() {
    const email = uniqueEmail(PREFIX);
    const reg = await api(app).post("/api/v1/auth/register").send({
      fullName: "Phase4 Student",
      email,
      password: "Student12345!",
    });
    expect(reg.status).toBe(201);
    return {
      email,
      token: reg.body.accessToken as string,
      userId: reg.body.user.id as string,
    };
  }

  async function createCourseWithBatch() {
    const slug = `${SLUG_PREFIX}${Date.now()}`;
    const courseRes = await api(app)
      .post("/api/v1/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Phase4 Course",
        slug,
        overview: "Phase 4 gating course overview text.",
        duration: "1 month",
        priceBdt: 0,
        status: "PUBLISHED",
      });
    expect(courseRes.status).toBe(201);
    const courseId = courseRes.body.course.id as string;

    const batchRes = await api(app)
      .post("/api/v1/courses/batches")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        courseId,
        name: "Phase4 Batch A",
        scheduleSummary: "Sat 7pm",
        status: "ONGOING",
      });
    expect(batchRes.status).toBe(201);
    const batchId = batchRes.body.batch.id as string;

    await prisma.liveSession.create({
      data: {
        batchId,
        title: "Kickoff",
        startsAt: new Date(Date.now() + 86_400_000),
        meetingUrl: "https://meet.google.com/lookup/phase4",
      },
    });
    await prisma.batchMaterial.create({
      data: {
        batchId,
        title: "Syllabus PDF",
        fileName: "syllabus.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
        storageKey: `stubs/${batchId}/syllabus.pdf`,
        url: "https://example.com/syllabus.pdf",
      },
    });
    await prisma.batchAnnouncement.create({
      data: {
        batchId,
        title: "Hello batch",
        body: "Welcome to Phase 4.",
      },
    });

    return { courseId, slug, batchId };
  }

  async function enrollStudent(studentId: string, courseId: string, batchId?: string) {
    const res = await api(app)
      .post("/api/v1/purchases/admin/enroll")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        studentId,
        courseId,
        paymentMethod: "CASH",
        batchId: batchId ?? null,
      });
    expect(res.status).toBe(201);
    return res.body.enrollment as { id: string; batchId: string | null };
  }

  it("lists enrollments and marks awaiting-batch when unassigned", async () => {
    const student = await createStudent();
    const { courseId, slug } = await createCourseWithBatch();
    await enrollStudent(student.userId, courseId);

    const list = await api(app)
      .get("/api/v1/students/enrollments")
      .set("Authorization", `Bearer ${student.token}`);
    expect(list.status).toBe(200);
    expect(list.body.enrollments).toHaveLength(1);
    expect(list.body.enrollments[0].awaitingBatch).toBe(true);
    expect(list.body.enrollments[0].course.slug).toBe(slug);

    const hub = await api(app)
      .get(`/api/v1/students/courses/${slug}`)
      .set("Authorization", `Bearer ${student.token}`);
    expect(hub.status).toBe(200);
    expect(hub.body.enrollment.awaitingBatch).toBe(true);
  });

  it("blocks cohort content until batch is assigned", async () => {
    const student = await createStudent();
    const { courseId, slug } = await createCourseWithBatch();
    await enrollStudent(student.userId, courseId);

    for (const path of ["sessions", "materials", "announcements"] as const) {
      const res = await api(app)
        .get(`/api/v1/students/courses/${slug}/${path}`)
        .set("Authorization", `Bearer ${student.token}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("AWAITING_BATCH");
    }
  });

  it("allows assigned student to read sessions, materials, and announcements", async () => {
    const student = await createStudent();
    const { courseId, slug, batchId } = await createCourseWithBatch();
    await enrollStudent(student.userId, courseId, batchId);

    const sessions = await api(app)
      .get(`/api/v1/students/courses/${slug}/sessions`)
      .set("Authorization", `Bearer ${student.token}`);
    expect(sessions.status).toBe(200);
    expect(sessions.body.sessions).toHaveLength(1);
    expect(sessions.body.sessions[0].title).toBe("Kickoff");
    expect(sessions.body.sessions[0].meetingUrl).toContain("meet.google.com");

    const materials = await api(app)
      .get(`/api/v1/students/courses/${slug}/materials`)
      .set("Authorization", `Bearer ${student.token}`);
    expect(materials.status).toBe(200);
    expect(materials.body.materials).toHaveLength(1);
    expect(materials.body.materials[0].title).toBe("Syllabus PDF");

    const announcements = await api(app)
      .get(`/api/v1/students/courses/${slug}/announcements`)
      .set("Authorization", `Bearer ${student.token}`);
    expect(announcements.status).toBe(200);
    expect(announcements.body.announcements).toHaveLength(1);
    expect(announcements.body.announcements[0].title).toBe("Hello batch");
  });

  it("returns 404 for courses the student is not enrolled in", async () => {
    const student = await createStudent();
    const { slug } = await createCourseWithBatch();

    const hub = await api(app)
      .get(`/api/v1/students/courses/${slug}`)
      .set("Authorization", `Bearer ${student.token}`);
    expect(hub.status).toBe(404);
    expect(hub.body.error.code).toBe("NOT_ENROLLED");
  });

  it("updates student profile phone", async () => {
    const student = await createStudent();
    const patch = await api(app)
      .patch("/api/v1/students/profile")
      .set("Authorization", `Bearer ${student.token}`)
      .send({ phone: "+8801712345678" });
    expect(patch.status).toBe(200);
    expect(patch.body.profile.phone).toBe("+8801712345678");

    const get = await api(app)
      .get("/api/v1/students/profile")
      .set("Authorization", `Bearer ${student.token}`);
    expect(get.status).toBe(200);
    expect(get.body.profile.phone).toBe("+8801712345678");
  });
});
