import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { AppError } from "../errors.js";
import { verifyAccessToken } from "../../modules/auth/token.service.js";
import { prisma } from "../../db/prisma.js";
import { getSettings } from "../../modules/settings/settings.service.js";
import { studentCanAccessPortal } from "../../modules/auth/access.js";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: string;
  emailVerifiedAt: Date | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!bearer) {
      throw new AppError(401, "Authentication required", "UNAUTHORIZED");
    }

    const payload = verifyAccessToken(bearer);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status === "DISABLED") {
      throw new AppError(401, "Authentication required", "UNAUTHORIZED");
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
    };
    next();
  } catch (err) {
    next(err instanceof AppError ? err : new AppError(401, "Invalid token", "UNAUTHORIZED"));
  }
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError(403, "Forbidden", "FORBIDDEN"));
      return;
    }
    next();
  };
}

export async function requireVerifiedStudent(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user || req.user.role !== "STUDENT") {
      throw new AppError(403, "Student access only", "FORBIDDEN");
    }
    const settings = await getSettings();
    if (
      !studentCanAccessPortal({
        emailVerifiedAt: req.user.emailVerifiedAt,
        emailVerificationRequired: settings.emailVerificationRequired,
      })
    ) {
      throw new AppError(
        403,
        "Email verification required",
        "EMAIL_NOT_VERIFIED",
      );
    }
    next();
  } catch (err) {
    next(err);
  }
}
