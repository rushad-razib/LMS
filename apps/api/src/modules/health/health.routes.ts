import { Router } from "express";
import type { HealthResponse } from "@arva/shared";
import { APP_NAME } from "@arva/shared";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const body: HealthResponse = {
    ok: true,
    service: APP_NAME,
    timestamp: new Date().toISOString(),
  };
  res.json(body);
});
