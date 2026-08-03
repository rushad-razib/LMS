import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { API_PREFIX } from "@arva/shared";
import type { Env } from "./config/env.js";
import { errorHandler } from "./common/errors.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";

export function createApp(env: Env) {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
    }),
  );
  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  }
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/", (_req, res) => {
    res.json({ name: "ARVA API", docs: `${API_PREFIX}/health` });
  });

  app.use(`${API_PREFIX}/health`, healthRouter);
  app.use(`${API_PREFIX}/auth`, authRouter);

  app.use(errorHandler);
  return app;
}
