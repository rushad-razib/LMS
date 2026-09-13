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

const PREFIX = "phase5.teachers";
const SLUG_PREFIX = "phase5-";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("Phase 5 — Teacher portal", () => {
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

  async function createTeacher(label = "Teacher") {
    const email = uniqueEmail(`${PREFIX}.${label.toLowerCase()}`);
    const created = await api(app)
      .post("/api/v1/auth/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        fullName: `Phase5 ${label}`,
        email,
        role: "TEACHER",
        password: "Teacher12345!",
      });
    expect(created.status).toBe(201);
    const login = await api(app).post("/api/v1/auth/login").send({
      email,
      password: "Teacher12345!",
    });
    expect(login.status).toBe(200);
    return {
      email,
      userId: created.body.user.id as string,
      token: login.body.accessToken as string,
    };
  }

  async function createStudent() {
    const email = uniqueEmail(`${PREFIX}.student`);
    const reg = await api(app).post("/api/v1/auth/register").send({
      fullName: "Phase5 Student",
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

  async function createCourseAndBatch(teacherId?: string) {
    const slug = `${SLUG_PREFIX}${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
    const courseRes = await api(app)
      .post("/api/v1/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Phase5 Course",
        slug,
        overview: "Phase 5 teacher portal course overview text.",
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
        name: "Phase5 Batch A",
        scheduleSummary: "Sat 7pm",
        status: "ONGOING",
        teacherId: teacherId ?? null,
      });
    expect(batchRes.status).toBe(201);
    return { courseId, slug, batchId: batchRes.body.batch.id as string };
  }

  it("returns 403 when a teacher accesses an unassigned batch", async () => {
    const teacher = await createTeacher();
    const other = await createTeacher("Other");
    const { batchId } = await createCourseAndBatch(other.userId);

    const res = await api(app)
      .get(`/api/v1/teachers/batches/${batchId}`)
      .set("Authorization", `Bearer ${teacher.token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("BATCH_NOT_ASSIGNED");
  });

  it("lists only assigned batches and creates ordered sessions", async () => {
    const teacher = await createTeacher();
    const assigned = await createCourseAndBatch(teacher.userId);
    await createCourseAndBatch();

    const list = await api(app)
      .get("/api/v1/teachers/batches")
      .set("Authorization", `Bearer ${teacher.token}`);
    expect(list.status).toBe(200);
    expect(list.body.batches).toHaveLength(1);
    expect(list.body.batches[0].id).toBe(assigned.batchId);

    const later = new Date(Date.now() + 2 * 86_400_000).toISOString();
    const sooner = new Date(Date.now() + 86_400_000).toISOString();

    const second = await api(app)
      .post(`/api/v1/teachers/batches/${assigned.batchId}/sessions`)
      .set("Authorization", `Bearer ${teacher.token}`)
      .send({
        title: "Later class",
        startsAt: later,
        meetingUrl: "meet.google.com/lookup/later",
      });
    expect(second.status).toBe(201);

    const first = await api(app)
      .post(`/api/v1/teachers/batches/${assigned.batchId}/sessions`)
      .set("Authorization", `Bearer ${teacher.token}`)
      .send({
        title: "Sooner class",
        startsAt: sooner,
        endsAt: new Date(Date.now() + 86_400_000 + 90 * 60_000).toISOString(),
        meetingUrl: "https://zoom.us/j/123456",
        notes: "Join early",
      });
    expect(first.status).toBe(201);

    const sessions = await api(app)
      .get(`/api/v1/teachers/batches/${assigned.batchId}/sessions`)
      .set("Authorization", `Bearer ${teacher.token}`);
    expect(sessions.status).toBe(200);
    expect(sessions.body.sessions.map((s: { title: string }) => s.title)).toEqual([
      "Sooner class",
      "Later class",
    ]);
    expect(sessions.body.sessions[0].meetingUrl).toContain("zoom.us");
  });

  it("lets assigned students see sessions posted by the teacher", async () => {
    const teacher = await createTeacher();
    const student = await createStudent();
    const { courseId, slug, batchId } = await createCourseAndBatch(teacher.userId);

    const enroll = await api(app)
      .post("/api/v1/purchases/admin/enroll")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        studentId: student.userId,
        courseId,
        paymentMethod: "CASH",
        batchId,
      });
    expect(enroll.status).toBe(201);

    await api(app)
      .post(`/api/v1/teachers/batches/${batchId}/sessions`)
      .set("Authorization", `Bearer ${teacher.token}`)
      .send({
        title: "Kickoff live",
        startsAt: new Date(Date.now() + 3_600_000).toISOString(),
        meetingUrl: "https://meet.google.com/lookup/kickoff",
      });

    const sessions = await api(app)
      .get(`/api/v1/students/courses/${slug}/sessions`)
      .set("Authorization", `Bearer ${student.token}`);
    expect(sessions.status).toBe(200);
    expect(sessions.body.sessions).toHaveLength(1);
    expect(sessions.body.sessions[0].title).toBe("Kickoff live");
    expect(sessions.body.sessions[0].meetingUrl).toContain("meet.google.com");
  });

  it("converts image uploads to webp and rejects unsupported types", async () => {
    const teacher = await createTeacher();
    const { batchId } = await createCourseAndBatch(teacher.userId);

    const uploaded = await api(app)
      .post(`/api/v1/teachers/batches/${batchId}/materials`)
      .set("Authorization", `Bearer ${teacher.token}`)
      .field("title", "Cover slide")
      .attach("file", PNG_1X1, { filename: "cover.png", contentType: "image/png" });
    expect(uploaded.status).toBe(201);
    expect(uploaded.body.material.mimeType).toBe("image/webp");
    expect(uploaded.body.material.fileName).toMatch(/\.webp$/);
    expect(uploaded.body.material.url).toContain("/api/v1/media/download");

    const rejected = await api(app)
      .post(`/api/v1/teachers/batches/${batchId}/materials`)
      .set("Authorization", `Bearer ${teacher.token}`)
      .attach("file", Buffer.from("MZ"), {
        filename: "tool.exe",
        contentType: "application/x-msdownload",
      });
    expect(rejected.status).toBe(400);
    expect(rejected.body.error.code).toBe("UNSUPPORTED_FILE_TYPE");
  });

  it("emails batch students when an announcement is created", async () => {
    const teacher = await createTeacher();
    const student = await createStudent();
    const { courseId, slug, batchId } = await createCourseAndBatch(teacher.userId);
    await api(app)
      .post("/api/v1/purchases/admin/enroll")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        studentId: student.userId,
        courseId,
        paymentMethod: "CASH",
        batchId,
      });

    const logs: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
      original(...args);
    };
    try {
      const created = await api(app)
        .post(`/api/v1/teachers/batches/${batchId}/announcements`)
        .set("Authorization", `Bearer ${teacher.token}`)
        .send({
          title: "Class moved",
          body: "Tomorrow's session starts 30 minutes later.",
        });
      expect(created.status).toBe(201);
    } finally {
      console.log = original;
    }

    const emailed = logs.join("\n");
    expect(emailed).toContain(student.email);
    expect(emailed).toContain("Class moved");

    const studentView = await api(app)
      .get(`/api/v1/students/courses/${slug}/announcements`)
      .set("Authorization", `Bearer ${student.token}`);
    expect(studentView.status).toBe(200);
    expect(studentView.body.announcements[0].title).toBe("Class moved");
  });

  it("updates the teacher profile name", async () => {
    const teacher = await createTeacher();
    const patch = await api(app)
      .patch("/api/v1/teachers/profile")
      .set("Authorization", `Bearer ${teacher.token}`)
      .send({ fullName: "Updated Teacher Name" });
    expect(patch.status).toBe(200);
    expect(patch.body.profile.fullName).toBe("Updated Teacher Name");
  });
});
