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
import { resetRateLimitBuckets } from "../../common/middleware/rateLimit.js";

const PREFIX = "phase6.cms";
const SLUG_PREFIX = "phase6-";

describe("Phase 6 — Admin CMS & contact", () => {
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
    await prisma.blogPost.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
    await prisma.globalNotice.deleteMany({
      where: { title: { startsWith: "Phase6" } },
    });
    await prisma.lead.deleteMany({ where: { email: { startsWith: PREFIX } } });
    resetRateLimitBuckets();
  });

  afterAll(async () => {
    await cleanupTestUsers(PREFIX);
    await prisma.blogPost.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
    await prisma.globalNotice.deleteMany({
      where: { title: { startsWith: "Phase6" } },
    });
    await prisma.lead.deleteMany({ where: { email: { startsWith: PREFIX } } });
    await prisma.$disconnect();
  });

  it("lets admin create another ADMIN user", async () => {
    const email = uniqueEmail(`${PREFIX}.admin`);
    const created = await api(app)
      .post("/api/v1/auth/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        fullName: "Phase6 Extra Admin",
        email,
        role: "ADMIN",
        password: "Admin12345!",
      });
    expect(created.status).toBe(201);
    expect(created.body.user.role).toBe("ADMIN");

    const login = await api(app).post("/api/v1/auth/login").send({
      email,
      password: "Admin12345!",
    });
    expect(login.status).toBe(200);
  });

  it("publishes blog posts publicly and hides drafts", async () => {
    const draft = await api(app)
      .post("/api/v1/content/admin/blog")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Phase6 Draft",
        slug: `${SLUG_PREFIX}draft`,
        excerpt: "Draft excerpt",
        bodyHtml: "<p>Secret draft</p>",
        published: false,
      });
    expect(draft.status).toBe(201);

    const published = await api(app)
      .post("/api/v1/content/admin/blog")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Phase6 Live",
        slug: `${SLUG_PREFIX}live`,
        excerpt: "Live excerpt",
        bodyHtml: "<p>Hello <strong>world</strong><script>alert(1)</script></p>",
        published: true,
      });
    expect(published.status).toBe(201);
    expect(published.body.post.bodyHtml).not.toContain("script");
    expect(published.body.post.bodyHtml).toContain("<strong>world</strong>");

    const list = await api(app).get("/api/v1/content/public/blog");
    expect(list.status).toBe(200);
    const slugs = list.body.posts.map((p: { slug: string }) => p.slug);
    expect(slugs).toContain(`${SLUG_PREFIX}live`);
    expect(slugs).not.toContain(`${SLUG_PREFIX}draft`);

    const detail = await api(app).get(`/api/v1/content/public/blog/${SLUG_PREFIX}live`);
    expect(detail.status).toBe(200);
    expect(detail.body.post.title).toBe("Phase6 Live");

    const hidden = await api(app).get(`/api/v1/content/public/blog/${SLUG_PREFIX}draft`);
    expect(hidden.status).toBe(404);
  });

  it("round-trips extended settings and rejects secrets in body", async () => {
    const updated = await api(app)
      .patch("/api/v1/auth/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        emailVerificationRequired: false,
        contactEmail: "office@example.com",
        contactPhone: "01700000000",
        announcementBar: "Phase6 bar",
        whatsappNumber: "8801700000000",
        RESEND_API_KEY: "should-be-ignored",
        SSLCOMMERZ_STORE_ID: "nope",
      });
    expect(updated.status).toBe(200);
    expect(updated.body.contactEmail).toBe("office@example.com");
    expect(updated.body.announcementBar).toBe("Phase6 bar");
    expect(updated.body.RESEND_API_KEY).toBeUndefined();
    expect(updated.body.SSLCOMMERZ_STORE_ID).toBeUndefined();

    const publicSettings = await api(app).get("/api/v1/content/public/settings");
    expect(publicSettings.status).toBe(200);
    expect(publicSettings.body.settings.announcementBar).toBe("Phase6 bar");
    expect(publicSettings.body.settings.emailVerificationRequired).toBeUndefined();
  });

  it("creates a lead, emails admin, and lists for admin", async () => {
    const email = uniqueEmail(PREFIX);
    const logs: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
      original(...args);
    };
    try {
      const submitted = await api(app).post("/api/v1/contact").send({
        name: "Phase6 Lead",
        email,
        phone: "01711111111",
        subject: "Phase6 hello",
        message: "I want to know more about Web Development.",
      });
      expect(submitted.status).toBe(201);
      expect(submitted.body.ok).toBe(true);
    } finally {
      console.log = original;
    }

    const emailed = logs.join("\n");
    expect(emailed).toContain(email);
    expect(emailed).toContain("Phase6 hello");

    const list = await api(app)
      .get("/api/v1/contact/admin")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    const lead = list.body.leads.find((l: { email: string }) => l.email === email);
    expect(lead).toBeTruthy();
    expect(lead.readAt).toBeNull();

    const marked = await api(app)
      .patch(`/api/v1/contact/admin/${lead.id}/read`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(marked.status).toBe(200);
    expect(marked.body.lead.readAt).toBeTruthy();
  });

  it("rate limits contact submissions", async () => {
    for (let i = 0; i < 5; i += 1) {
      const res = await api(app)
        .post("/api/v1/contact")
        .send({
          name: "Burst",
          email: uniqueEmail(`${PREFIX}.burst`),
          subject: "Burst subject",
          message: "This is a long enough message for validation.",
        });
      expect(res.status).toBe(201);
    }
    const blocked = await api(app)
      .post("/api/v1/contact")
      .send({
        name: "Burst",
        email: uniqueEmail(`${PREFIX}.burst`),
        subject: "Burst subject",
        message: "This is a long enough message for validation.",
      });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
  });

  it("shows published notices to verified students", async () => {
    const notice = await api(app)
      .post("/api/v1/notices/admin")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Phase6 Notice",
        body: "Campus closed Friday.",
        published: true,
      });
    expect(notice.status).toBe(201);

    const studentEmail = uniqueEmail(`${PREFIX}.student`);
    const reg = await api(app).post("/api/v1/auth/register").send({
      fullName: "Phase6 Student",
      email: studentEmail,
      password: "Student12345!",
      phone: "01700000001",
    });
    expect(reg.status).toBe(201);
    const login = await api(app).post("/api/v1/auth/login").send({
      email: studentEmail,
      password: "Student12345!",
    });
    expect(login.status).toBe(200);

    const list = await api(app)
      .get("/api/v1/notices/student")
      .set("Authorization", `Bearer ${login.body.accessToken}`);
    expect(list.status).toBe(200);
    expect(
      list.body.notices.some((n: { title: string }) => n.title === "Phase6 Notice"),
    ).toBe(true);
  });
});
