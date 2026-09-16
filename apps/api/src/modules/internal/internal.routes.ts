import { Router } from "express";
import { loadEnv } from "../../config/env.js";
import { AppError } from "../../common/errors.js";
import * as purchasesService from "../purchases/purchases.service.js";

export const internalRouter = Router();

function assertCronSecret(req: { header: (name: string) => string | undefined }) {
  const env = loadEnv();
  const expected = env.CRON_SECRET;
  if (!expected) {
    throw new AppError(503, "Cron secret not configured", "CRON_NOT_CONFIGURED");
  }
  const provided =
    req.header("x-cron-secret") ||
    req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!provided || provided !== expected) {
    throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  }
}

internalRouter.post("/installment-reminders", async (req, res, next) => {
  try {
    assertCronSecret(req);
    const result = await purchasesService.sendInstallmentDueReminders();
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});
