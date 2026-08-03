import { Router } from "express";
import {
  AdminCreateUserInputSchema,
  ForgotPasswordInputSchema,
  LoginInputSchema,
  RegisterInputSchema,
  ResendVerificationInputSchema,
  ResetPasswordInputSchema,
  SetPasswordInputSchema,
  UpdateSettingsInputSchema,
  VerifyEmailInputSchema,
} from "@arva/shared";
import { validateBody } from "../../common/middleware/validate.js";
import { requireAuth, requireRoles } from "../../common/middleware/auth.js";
import { refreshCookieOptions } from "./token.service.js";
import * as authService from "./auth.service.js";
import { getSettings, updateSettings } from "../settings/settings.service.js";

export const authRouter = Router();

function setRefreshCookie(res: import("express").Response, token: string) {
  res.cookie("refreshToken", token, refreshCookieOptions());
}

function clearRefreshCookie(res: import("express").Response) {
  res.clearCookie("refreshToken", refreshCookieOptions());
}

authRouter.post("/register", validateBody(RegisterInputSchema), async (req, res, next) => {
  try {
    const result = await authService.registerStudent(req.body);
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", validateBody(LoginInputSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    setRefreshCookie(res, result.refreshToken);
    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) {
      res.status(401).json({ error: { message: "No refresh token", code: "UNAUTHORIZED" } });
      return;
    }
    const result = await authService.refreshSession(token);
    setRefreshCookie(res, result.refreshToken);
    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    clearRefreshCookie(res);
    next(err);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    await authService.logout(token);
    clearRefreshCookie(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.post(
  "/verify-email",
  validateBody(VerifyEmailInputSchema),
  async (req, res, next) => {
    try {
      const user = await authService.verifyEmail(req.body.token);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post(
  "/resend-verification",
  validateBody(ResendVerificationInputSchema),
  async (req, res, next) => {
    try {
      const result = await authService.resendVerification(req.body.email);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post(
  "/forgot-password",
  validateBody(ForgotPasswordInputSchema),
  async (req, res, next) => {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post(
  "/reset-password",
  validateBody(ResetPasswordInputSchema),
  async (req, res, next) => {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post(
  "/set-password",
  validateBody(SetPasswordInputSchema),
  async (req, res, next) => {
    try {
      const result = await authService.setPassword(req.body.token, req.body.password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

authRouter.get(
  "/settings",
  requireAuth,
  requireRoles("ADMIN"),
  async (_req, res, next) => {
    try {
      const settings = await getSettings();
      res.json({
        emailVerificationRequired: settings.emailVerificationRequired,
      });
    } catch (err) {
      next(err);
    }
  },
);

authRouter.patch(
  "/settings",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(UpdateSettingsInputSchema),
  async (req, res, next) => {
    try {
      const settings = await updateSettings(req.body);
      res.json({
        emailVerificationRequired: settings.emailVerificationRequired,
      });
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post(
  "/admin/users",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(AdminCreateUserInputSchema),
  async (req, res, next) => {
    try {
      const user = await authService.adminCreateUser(req.body);
      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  },
);
