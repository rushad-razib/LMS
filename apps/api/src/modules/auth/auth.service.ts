import bcrypt from "bcryptjs";
import type { AuthTokenType, Role, User } from "@prisma/client";
import type {
  AdminCreateUserInput,
  LoginInput,
  PublicUser,
  RegisterInput,
} from "@arva/shared";
import { prisma } from "../../db/prisma.js";
import { AppError } from "../../common/errors.js";
import { getSettings } from "../settings/settings.service.js";
import { studentCanAccessPortal } from "./access.js";
import {
  createRawToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./token.service.js";
import {
  sendPasswordResetEmail,
  sendSetPasswordEmail,
  sendVerificationEmail,
} from "./email.service.js";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function toPublicUser(user: User): Promise<PublicUser> {
  const settings = await getSettings();
  const emailVerificationRequired = settings.emailVerificationRequired;
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    emailVerificationRequired,
    canAccessStudentPortal:
      user.role !== "STUDENT"
        ? false
        : studentCanAccessPortal({
            emailVerifiedAt: user.emailVerifiedAt,
            emailVerificationRequired,
          }),
  };
}

async function issueSession(user: User) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
  await prisma.authToken.create({
    data: {
      userId: user.id,
      type: "REFRESH",
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });
  return { accessToken, refreshToken, user: await toPublicUser(user) };
}

async function createOneTimeToken(userId: string, type: AuthTokenType, ttlMs: number) {
  const raw = createRawToken();
  await prisma.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + ttlMs),
    },
  });
  return raw;
}

export async function registerStudent(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) {
    throw new AppError(409, "Email already registered", "EMAIL_TAKEN");
  }

  const settings = await getSettings();
  const passwordHash = await bcrypt.hash(input.password, 12);
  const verifiedNow = !settings.emailVerificationRequired;

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      passwordHash,
      role: "STUDENT",
      status: verifiedNow ? "ACTIVE" : "PENDING_VERIFICATION",
      emailVerifiedAt: verifiedNow ? new Date() : null,
      studentProfile: { create: {} },
    },
  });

  if (settings.emailVerificationRequired) {
    const token = await createOneTimeToken(user.id, "EMAIL_VERIFY", VERIFY_TTL_MS);
    await sendVerificationEmail(user.email, token);
  }

  return issueSession(user);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  if (!user?.passwordHash) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }
  if (user.status === "DISABLED") {
    throw new AppError(403, "Account disabled", "ACCOUNT_DISABLED");
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  return issueSession(user);
}

export async function refreshSession(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid refresh token", "UNAUTHORIZED");
  }

  const stored = await prisma.authToken.findFirst({
    where: {
      userId: payload.sub,
      type: "REFRESH",
      tokenHash: hashToken(refreshToken),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!stored) {
    throw new AppError(401, "Invalid refresh token", "UNAUTHORIZED");
  }

  await prisma.authToken.update({
    where: { id: stored.id },
    data: { usedAt: new Date() },
  });

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status === "DISABLED") {
    throw new AppError(401, "Invalid refresh token", "UNAUTHORIZED");
  }

  return issueSession(user);
}

export async function logout(refreshToken?: string) {
  if (!refreshToken) return;
  await prisma.authToken.updateMany({
    where: {
      type: "REFRESH",
      tokenHash: hashToken(refreshToken),
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });
}

export async function verifyEmail(token: string) {
  const record = await prisma.authToken.findFirst({
    where: {
      type: "EMAIL_VERIFY",
      tokenHash: hashToken(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!record) {
    throw new AppError(400, "Invalid or expired verification token", "INVALID_TOKEN");
  }

  const user = await prisma.$transaction(async (tx) => {
    await tx.authToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return tx.user.update({
      where: { id: record.userId },
      data: {
        emailVerifiedAt: new Date(),
        status: "ACTIVE",
      },
    });
  });

  return toPublicUser(user);
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Always generic response
  if (!user || user.emailVerifiedAt) {
    return { ok: true as const };
  }

  const token = await createOneTimeToken(user.id, "EMAIL_VERIFY", VERIFY_TTL_MS);
  await sendVerificationEmail(user.email, token);
  return { ok: true as const };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (user?.passwordHash) {
    const token = await createOneTimeToken(user.id, "PASSWORD_RESET", RESET_TTL_MS);
    await sendPasswordResetEmail(user.email, token);
  }
  return { ok: true as const };
}

export async function resetPassword(token: string, password: string) {
  const record = await prisma.authToken.findFirst({
    where: {
      type: "PASSWORD_RESET",
      tokenHash: hashToken(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!record) {
    throw new AppError(400, "Invalid or expired reset token", "INVALID_TOKEN");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.authToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, status: "ACTIVE" },
    }),
    prisma.authToken.updateMany({
      where: { userId: record.userId, type: "REFRESH", usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true as const };
}

export async function setPassword(token: string, password: string) {
  const record = await prisma.authToken.findFirst({
    where: {
      type: "SET_PASSWORD",
      tokenHash: hashToken(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!record) {
    throw new AppError(400, "Invalid or expired set-password token", "INVALID_TOKEN");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const settings = await getSettings();

  await prisma.$transaction(async (tx) => {
    await tx.authToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    const user = await tx.user.findUniqueOrThrow({ where: { id: record.userId } });
    const shouldVerify =
      user.role === "STUDENT" && !settings.emailVerificationRequired
        ? true
        : Boolean(user.emailVerifiedAt);

    await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: shouldVerify || user.role !== "STUDENT" ? "ACTIVE" : user.status,
        emailVerifiedAt:
          user.role !== "STUDENT" || !settings.emailVerificationRequired
            ? user.emailVerifiedAt ?? new Date()
            : user.emailVerifiedAt,
      },
    });
  });

  return { ok: true as const };
}

export async function adminCreateUser(input: AdminCreateUserInput) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "Email already registered", "EMAIL_TAKEN");
  }

  const settings = await getSettings();
  const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : null;
  const isStudent = input.role === "STUDENT";

  const user = await prisma.user.create({
    data: {
      email,
      fullName: input.fullName,
      role: input.role as Role,
      passwordHash,
      status:
        isStudent && settings.emailVerificationRequired
          ? "PENDING_VERIFICATION"
          : "ACTIVE",
      emailVerifiedAt:
        !isStudent || !settings.emailVerificationRequired ? new Date() : null,
      studentProfile: isStudent ? { create: {} } : undefined,
    },
  });

  if (!passwordHash) {
    const token = await createOneTimeToken(user.id, "SET_PASSWORD", VERIFY_TTL_MS);
    await sendSetPasswordEmail(user.email, token);
  }

  if (isStudent && settings.emailVerificationRequired) {
    const token = await createOneTimeToken(user.id, "EMAIL_VERIFY", VERIFY_TTL_MS);
    await sendVerificationEmail(user.email, token);
  }

  return toPublicUser(user);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(401, "Authentication required", "UNAUTHORIZED");
  return toPublicUser(user);
}

export type AdminUserListItem = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  taughtBatchCount: number;
  taughtBatches: { id: string; name: string; courseTitle: string }[];
};

export async function adminListUsers(): Promise<AdminUserListItem[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
      createdAt: true,
      taughtBatches: {
        select: {
          id: true,
          name: true,
          course: { select: { title: true } },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    status: u.status,
    emailVerifiedAt: u.emailVerifiedAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    taughtBatchCount: u.taughtBatches.length,
    taughtBatches: u.taughtBatches.map((b) => ({
      id: b.id,
      name: b.name,
      courseTitle: b.course.title,
    })),
  }));
}

export async function adminDeleteUser(
  actorId: string,
  targetId: string,
  reassignTeacherId?: string | null,
) {
  if (actorId === targetId) {
    throw new AppError(403, "You cannot delete your own account", "CANNOT_DELETE_SELF");
  }

  const existing = await prisma.user.findUnique({ where: { id: targetId } });
  if (!existing) {
    throw new AppError(404, "User not found", "NOT_FOUND");
  }

  // TODO(Phase 3): if this is a STUDENT with Order/Enrollment rows, throw 409 ACCOUNT_HAS_ENROLLMENTS

  if (reassignTeacherId) {
    if (reassignTeacherId === targetId) {
      throw new AppError(400, "Invalid teacher", "INVALID_TEACHER");
    }
    const replacement = await prisma.user.findUnique({ where: { id: reassignTeacherId } });
    if (
      !replacement ||
      replacement.role !== "TEACHER" ||
      replacement.status === "DISABLED"
    ) {
      throw new AppError(400, "Invalid teacher", "INVALID_TEACHER");
    }
  }

  await prisma.$transaction(async (tx) => {
    if (reassignTeacherId) {
      await tx.batch.updateMany({
        where: { teacherId: targetId },
        data: { teacherId: reassignTeacherId },
      });
    }
    await tx.user.delete({ where: { id: targetId } });
  });

  return { ok: true as const };
}
