import { Router } from "express";
import type { Request } from "express";
import {
  CreateGlobalNoticeInputSchema,
  UpdateGlobalNoticeInputSchema,
} from "@arva/shared";
import { validateBody } from "../../common/middleware/validate.js";
import {
  requireAuth,
  requireRoles,
  requireVerifiedStudent,
} from "../../common/middleware/auth.js";
import * as noticesService from "./notices.service.js";

export const noticesRouter = Router();

function paramId(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0]! : value!;
}

noticesRouter.get(
  "/admin",
  requireAuth,
  requireRoles("ADMIN"),
  async (_req, res, next) => {
    try {
      const notices = await noticesService.adminListNotices();
      res.json({ notices });
    } catch (err) {
      next(err);
    }
  },
);

noticesRouter.post(
  "/admin",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(CreateGlobalNoticeInputSchema),
  async (req, res, next) => {
    try {
      const notice = await noticesService.createNotice(req.body);
      res.status(201).json({ notice });
    } catch (err) {
      next(err);
    }
  },
);

noticesRouter.patch(
  "/admin/:id",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(UpdateGlobalNoticeInputSchema),
  async (req, res, next) => {
    try {
      const notice = await noticesService.updateNotice(paramId(req, "id"), req.body);
      res.json({ notice });
    } catch (err) {
      next(err);
    }
  },
);

noticesRouter.delete(
  "/admin/:id",
  requireAuth,
  requireRoles("ADMIN"),
  async (req, res, next) => {
    try {
      const result = await noticesService.deleteNotice(paramId(req, "id"));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

noticesRouter.get(
  "/student",
  requireAuth,
  requireVerifiedStudent,
  async (_req, res, next) => {
    try {
      const notices = await noticesService.listPublishedNotices();
      res.json({ notices });
    } catch (err) {
      next(err);
    }
  },
);
