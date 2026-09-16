import { Router } from "express";
import type { Request } from "express";
import express from "express";
import {
  AdminEnrollInputSchema,
  AssignEnrollmentBatchInputSchema,
  CheckoutInputSchema,
  MarkInstallmentPaidInputSchema,
  SetEnrollmentAccessInputSchema,
} from "@arva/shared";
import { validateBody } from "../../common/middleware/validate.js";
import {
  requireAuth,
  requireRoles,
  requireVerifiedStudent,
} from "../../common/middleware/auth.js";
import * as purchasesService from "./purchases.service.js";

export const purchasesRouter = Router();

function paramId(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0]! : value!;
}

function asRecord(body: unknown): Record<string, unknown> {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }
  return {};
}

purchasesRouter.post(
  "/checkout",
  requireAuth,
  requireVerifiedStudent,
  validateBody(CheckoutInputSchema),
  async (req, res, next) => {
    try {
      const result = await purchasesService.checkoutCourse(req.user!.id, req.body);
      res.status(result.kind === "enrolled" ? 201 : 200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

purchasesRouter.get("/me", requireAuth, requireVerifiedStudent, async (req, res, next) => {
  try {
    const orders = await purchasesService.listStudentOrders(req.user!.id);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// SSLCommerz posts application/x-www-form-urlencoded
const formParser = express.urlencoded({ extended: false });

purchasesRouter.post("/ipn", formParser, async (req, res, next) => {
  try {
    const result = await purchasesService.handleSslcommerzIpn(asRecord(req.body));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

purchasesRouter.post("/success", formParser, async (req, res, next) => {
  try {
    const url = await purchasesService.handleSslcommerzBrowserReturn(
      "success",
      asRecord(req.body),
    );
    res.redirect(303, url);
  } catch (err) {
    next(err);
  }
});

purchasesRouter.get("/success", async (req, res, next) => {
  try {
    const url = await purchasesService.handleSslcommerzBrowserReturn(
      "success",
      asRecord(req.query),
    );
    res.redirect(303, url);
  } catch (err) {
    next(err);
  }
});

purchasesRouter.post("/fail", formParser, async (req, res, next) => {
  try {
    const url = await purchasesService.handleSslcommerzBrowserReturn(
      "fail",
      asRecord(req.body),
    );
    res.redirect(303, url);
  } catch (err) {
    next(err);
  }
});

purchasesRouter.get("/fail", async (req, res, next) => {
  try {
    const url = await purchasesService.handleSslcommerzBrowserReturn(
      "fail",
      asRecord(req.query),
    );
    res.redirect(303, url);
  } catch (err) {
    next(err);
  }
});

purchasesRouter.post("/cancel", formParser, async (req, res, next) => {
  try {
    const url = await purchasesService.handleSslcommerzBrowserReturn(
      "cancel",
      asRecord(req.body),
    );
    res.redirect(303, url);
  } catch (err) {
    next(err);
  }
});

purchasesRouter.get("/cancel", async (req, res, next) => {
  try {
    const url = await purchasesService.handleSslcommerzBrowserReturn(
      "cancel",
      asRecord(req.query),
    );
    res.redirect(303, url);
  } catch (err) {
    next(err);
  }
});

purchasesRouter.get(
  "/admin/orders",
  requireAuth,
  requireRoles("ADMIN"),
  async (_req, res, next) => {
    try {
      const orders = await purchasesService.adminListOrders();
      res.json({ orders });
    } catch (err) {
      next(err);
    }
  },
);

purchasesRouter.get(
  "/admin/enrollments",
  requireAuth,
  requireRoles("ADMIN"),
  async (req, res, next) => {
    try {
      const unassignedOnly = req.query.unassigned === "1" || req.query.unassigned === "true";
      const enrollments = await purchasesService.adminListEnrollments(unassignedOnly);
      res.json({ enrollments });
    } catch (err) {
      next(err);
    }
  },
);

purchasesRouter.get(
  "/admin/dashboard",
  requireAuth,
  requireRoles("ADMIN"),
  async (_req, res, next) => {
    try {
      const counts = await purchasesService.adminDashboardCounts();
      res.json(counts);
    } catch (err) {
      next(err);
    }
  },
);

purchasesRouter.get(
  "/admin/students/:userId",
  requireAuth,
  requireRoles("ADMIN"),
  async (req, res, next) => {
    try {
      const detail = await purchasesService.getAdminStudentDetail(paramId(req, "userId"));
      res.json(detail);
    } catch (err) {
      next(err);
    }
  },
);

purchasesRouter.post(
  "/admin/enroll",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(AdminEnrollInputSchema),
  async (req, res, next) => {
    try {
      const result = await purchasesService.adminEnroll(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

purchasesRouter.patch(
  "/admin/enrollments/:id/batch",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(AssignEnrollmentBatchInputSchema),
  async (req, res, next) => {
    try {
      const enrollment = await purchasesService.assignEnrollmentBatch(
        paramId(req, "id"),
        req.body,
      );
      res.json({ enrollment });
    } catch (err) {
      next(err);
    }
  },
);

purchasesRouter.patch(
  "/admin/enrollments/:id/access",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(SetEnrollmentAccessInputSchema),
  async (req, res, next) => {
    try {
      const enrollment = await purchasesService.setEnrollmentAccess(
        paramId(req, "id"),
        req.body,
      );
      res.json({ enrollment });
    } catch (err) {
      next(err);
    }
  },
);

purchasesRouter.post(
  "/admin/installments/:id/pay",
  requireAuth,
  requireRoles("ADMIN"),
  validateBody(MarkInstallmentPaidInputSchema),
  async (req, res, next) => {
    try {
      const result = await purchasesService.markInstallmentPaid(paramId(req, "id"), req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);
