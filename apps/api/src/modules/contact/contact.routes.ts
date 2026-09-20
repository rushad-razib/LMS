import { Router } from "express";
import type { Request } from "express";
import { ContactLeadInputSchema } from "@arva/shared";
import { validateBody } from "../../common/middleware/validate.js";
import { requireAuth, requireRoles } from "../../common/middleware/auth.js";
import { rateLimitByIp } from "../../common/middleware/rateLimit.js";
import * as contactService from "./contact.service.js";

export const contactRouter = Router();

function paramId(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0]! : value!;
}

contactRouter.post(
  "/",
  rateLimitByIp({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: "contact" }),
  validateBody(ContactLeadInputSchema),
  async (req, res, next) => {
    try {
      const result = await contactService.submitLead(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

contactRouter.get(
  "/admin",
  requireAuth,
  requireRoles("ADMIN"),
  async (_req, res, next) => {
    try {
      const leads = await contactService.adminListLeads();
      res.json({ leads });
    } catch (err) {
      next(err);
    }
  },
);

contactRouter.patch(
  "/admin/:id/read",
  requireAuth,
  requireRoles("ADMIN"),
  async (req, res, next) => {
    try {
      const lead = await contactService.markLeadRead(paramId(req, "id"));
      res.json({ lead });
    } catch (err) {
      next(err);
    }
  },
);
