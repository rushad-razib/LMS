import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { loadEnv } from "../../config/env.js";

export type AccessPayload = {
  sub: string;
  role: string;
};

export function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function createRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function signAccessToken(payload: AccessPayload) {
  const env = loadEnv();
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  const env = loadEnv();
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
  return decoded;
}

export function signRefreshToken(payload: AccessPayload) {
  const env = loadEnv();
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string): AccessPayload {
  const env = loadEnv();
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessPayload;
}

export function refreshCookieOptions() {
  const env = loadEnv();
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/v1/auth",
    maxAge: maxAgeMs,
  };
}
