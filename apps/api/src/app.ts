import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
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
import { coursesRouter } from "./modules/courses/courses.routes.js";
import { purchasesRouter } from "./modules/purchases/purchases.routes.js";
import { studentsRouter } from "./modules/students/students.routes.js";
import { teachersRouter } from "./modules/teachers/teachers.routes.js";
import { mediaRouter } from "./modules/media/media.routes.js";
import { internalRouter } from "./modules/internal/internal.routes.js";
import { contentRouter } from "./modules/content/content.routes.js";
import { noticesRouter } from "./modules/notices/notices.routes.js";
import { contactRouter } from "./modules/contact/contact.routes.js";
import { buildSitemapXml } from "./modules/seo/sitemap.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(env: Env) {
  const app = express();

  app.use(
    helmet({
      // SPA assets from Vite; default CSP is too strict for the built index.html
      contentSecurityPolicy: env.NODE_ENV === "production" ? false : undefined,
    }),
  );
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

  app.get("/sitemap.xml", async (_req, res, next) => {
    try {
      const xml = await buildSitemapXml(env);
      res
        .status(200)
        .type("application/xml")
        .set("Cache-Control", "public, max-age=300")
        .send(xml);
    } catch (err) {
      next(err);
    }
  });

  app.use(`${API_PREFIX}/health`, healthRouter);
  app.use(`${API_PREFIX}/auth`, authRouter);
  app.use(`${API_PREFIX}/courses`, coursesRouter);
  app.use(`${API_PREFIX}/purchases`, purchasesRouter);
  app.use(`${API_PREFIX}/students`, studentsRouter);
  app.use(`${API_PREFIX}/teachers`, teachersRouter);
  app.use(`${API_PREFIX}/media`, mediaRouter);
  app.use(`${API_PREFIX}/internal`, internalRouter);
  app.use(`${API_PREFIX}/content`, contentRouter);
  app.use(`${API_PREFIX}/notices`, noticesRouter);
  app.use(`${API_PREFIX}/contact`, contactRouter);

  app.use(API_PREFIX, (_req, res) => {
    res.status(404).json({
      error: { message: "Not found", code: "NOT_FOUND" },
    });
  });

  if (env.NODE_ENV === "production") {
    const webDist = path.resolve(__dirname, "../../../apps/web/dist");
    if (fs.existsSync(webDist)) {
      app.use(express.static(webDist, { index: "index.html", maxAge: "1h" }));
      app.use((req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") {
          next();
          return;
        }
        if (req.path.startsWith("/api") || req.path === "/sitemap.xml") {
          next();
          return;
        }
        // Prefer prerendered route folder (e.g. /about → about/index.html) then SPA shell
        const prerendered = path.join(webDist, req.path, "index.html");
        if (req.path !== "/" && fs.existsSync(prerendered)) {
          res.sendFile(prerendered, (err) => {
            if (err) next(err);
          });
          return;
        }
        res.sendFile(path.join(webDist, "index.html"), (err) => {
          if (err) next(err);
        });
      });
    }
  } else {
    app.get("/", (_req, res) => {
      res.json({ name: "ARVA API", docs: `${API_PREFIX}/health` });
    });
  }

  app.use(errorHandler);
  return app;
}
