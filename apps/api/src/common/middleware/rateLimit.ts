import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors.js";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimitByIp(options: {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown";
    const key = `${options.keyPrefix ?? "rl"}:${ip}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > options.max) {
      next(
        new AppError(429, "Too many requests. Please try again later.", "RATE_LIMITED"),
      );
      return;
    }
    next();
  };
}

/** Test helper */
export function resetRateLimitBuckets() {
  buckets.clear();
}
