import { z } from "zod";

export const UserRoleSchema = z.enum(["STUDENT", "TEACHER", "ADMIN"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const HealthResponseSchema = z.object({
  ok: z.literal(true),
  service: z.string(),
  timestamp: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const APP_NAME = "AR Visionary Academy";
export const API_PREFIX = "/api/v1";
