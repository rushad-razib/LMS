import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Express } from "express";
import { prisma } from "../../db/prisma.js";
import { createRawToken, hashToken } from "./token.service.js";
import {
  api,
  buildTestApp,
  cleanupTestUsers,
  setEmailVerificationRequired,
  uniqueEmail,
} from "../../test/helpers.js";

const PREFIX = "phase1.auth";

describe("Phase 1 — Auth", () => {
  let app: Express;

  beforeAll(async () => {
    app = await buildTestApp();
    await setEmailVerificationRequired(false);
  });

  beforeEach(async () => {
    await cleanupTestUsers(PREFIX);
    await setEmailVerificationRequired(false);
  });

  afterAll(async () => {
    await cleanupTestUsers(PREFIX);
    await prisma.$disconnect();
  });

  it("GET /api/v1/health returns ok", async () => {
    const res = await api(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("registers a student and returns access token", async () => {
    const email = uniqueEmail(PREFIX);
    const res = await api(app).post("/api/v1/auth/register").send({
      fullName: "Test Student",
      email,
      password: "Password#123",
    });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTypeOf("string");
    expect(res.body.user.role).toBe("STUDENT");
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.canAccessStudentPortal).toBe(true);
  });

  it("rejects duplicate registration", async () => {
    const email = uniqueEmail(PREFIX);
    await api(app).post("/api/v1/auth/register").send({
      fullName: "Test Student",
      email,
      password: "Password#123",
    });

    const res = await api(app).post("/api/v1/auth/register").send({
      fullName: "Test Student",
      email,
      password: "Password#123",
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("logs in with valid credentials", async () => {
    const email = uniqueEmail(PREFIX);
    await api(app).post("/api/v1/auth/register").send({
      fullName: "Test Student",
      email,
      password: "Password#123",
    });

    const res = await api(app).post("/api/v1/auth/login").send({
      email,
      password: "Password#123",
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf("string");
    expect(res.headers["set-cookie"]).toBeTruthy();
  });

  it("rejects invalid login with generic error", async () => {
    const res = await api(app).post("/api/v1/auth/login").send({
      email: uniqueEmail(PREFIX),
      password: "wrong-password",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns current user from /auth/me", async () => {
    const email = uniqueEmail(PREFIX);
    const registered = await api(app).post("/api/v1/auth/register").send({
      fullName: "Test Student",
      email,
      password: "Password#123",
    });

    const res = await api(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${registered.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it("blocks /auth/me without token", async () => {
    const res = await api(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("blocks student portal access when verification required and unverified", async () => {
    await setEmailVerificationRequired(true);
    const email = uniqueEmail(PREFIX);
    const res = await api(app).post("/api/v1/auth/register").send({
      fullName: "Unverified Student",
      email,
      password: "Password#123",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.canAccessStudentPortal).toBe(false);
    expect(res.body.user.emailVerifiedAt).toBeNull();
  });

  it("verifies email and unlocks student portal", async () => {
    await setEmailVerificationRequired(true);
    const email = uniqueEmail(PREFIX);
    const registered = await api(app).post("/api/v1/auth/register").send({
      fullName: "Verify Me",
      email,
      password: "Password#123",
    });

    const userId = registered.body.user.id as string;
    const raw = createRawToken();
    await prisma.authToken.create({
      data: {
        userId,
        type: "EMAIL_VERIFY",
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const verified = await api(app).post("/api/v1/auth/verify-email").send({ token: raw });
    expect(verified.status).toBe(200);
    expect(verified.body.user.emailVerifiedAt).toBeTruthy();

    const me = await api(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${registered.body.accessToken}`);

    expect(me.body.user.canAccessStudentPortal).toBe(true);
  });

  it("forbids students from admin settings", async () => {
    const email = uniqueEmail(PREFIX);
    const registered = await api(app).post("/api/v1/auth/register").send({
      fullName: "Student",
      email,
      password: "Password#123",
    });

    const res = await api(app)
      .get("/api/v1/auth/settings")
      .set("Authorization", `Bearer ${registered.body.accessToken}`);

    expect(res.status).toBe(403);
  });

  it("allows admin to read and update verification setting", async () => {
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env for this test");
    }

    const login = await api(app).post("/api/v1/auth/login").send({
      email: adminEmail,
      password: adminPassword,
    });
    expect(login.status).toBe(200);

    const token = login.body.accessToken as string;
    const get = await api(app)
      .get("/api/v1/auth/settings")
      .set("Authorization", `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(typeof get.body.emailVerificationRequired).toBe("boolean");

    const patch = await api(app)
      .patch("/api/v1/auth/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ emailVerificationRequired: false });

    expect(patch.status).toBe(200);
    expect(patch.body.emailVerificationRequired).toBe(false);
  });

  it("lets admin create a teacher user", async () => {
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env for this test");
    }

    const login = await api(app).post("/api/v1/auth/login").send({
      email: adminEmail,
      password: adminPassword,
    });

    const teacherEmail = uniqueEmail(`${PREFIX}.teacher`);
    const res = await api(app)
      .post("/api/v1/auth/admin/users")
      .set("Authorization", `Bearer ${login.body.accessToken}`)
      .send({
        fullName: "Test Teacher",
        email: teacherEmail,
        role: "TEACHER",
        password: "Password#123",
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("TEACHER");
    expect(res.body.user.email).toBe(teacherEmail);

    await cleanupTestUsers(`${PREFIX}.teacher`);
  });

  it("resets password with a valid token", async () => {
    const email = uniqueEmail(PREFIX);
    await api(app).post("/api/v1/auth/register").send({
      fullName: "Reset User",
      email,
      password: "Password#123",
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const raw = createRawToken();
    await prisma.authToken.create({
      data: {
        userId: user.id,
        type: "PASSWORD_RESET",
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const reset = await api(app).post("/api/v1/auth/reset-password").send({
      token: raw,
      password: "NewPassword#123",
    });
    expect(reset.status).toBe(200);

    const oldLogin = await api(app).post("/api/v1/auth/login").send({
      email,
      password: "Password#123",
    });
    expect(oldLogin.status).toBe(401);

    const newLogin = await api(app).post("/api/v1/auth/login").send({
      email,
      password: "NewPassword#123",
    });
    expect(newLogin.status).toBe(200);
  });

  it("logs out and rejects refresh afterward", async () => {
    const email = uniqueEmail(PREFIX);
    const registered = await api(app).post("/api/v1/auth/register").send({
      fullName: "Logout User",
      email,
      password: "Password#123",
    });

    const cookie = registered.headers["set-cookie"];
    const logout = await api(app).post("/api/v1/auth/logout").set("Cookie", cookie);
    expect(logout.status).toBe(200);

    const refresh = await api(app).post("/api/v1/auth/refresh").set("Cookie", cookie);
    expect(refresh.status).toBe(401);
  });
});
