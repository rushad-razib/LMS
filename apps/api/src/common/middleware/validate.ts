import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";
import { AppError } from "../errors.js";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          new AppError(400, "Validation failed", "VALIDATION_ERROR", err.flatten()),
        );
        return;
      }
      next(err);
    }
  };
}
