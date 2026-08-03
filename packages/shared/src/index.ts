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

export const RegisterInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const VerifyEmailInputSchema = z.object({
  token: z.string().min(10),
});

export const ResendVerificationInputSchema = z.object({
  email: z.string().trim().email(),
});

export const ForgotPasswordInputSchema = z.object({
  email: z.string().trim().email(),
});

export const ResetPasswordInputSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export const SetPasswordInputSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export const AdminCreateUserInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  role: UserRoleSchema,
  password: z.string().min(8).max(128).optional(),
});
export type AdminCreateUserInput = z.infer<typeof AdminCreateUserInputSchema>;

export const UpdateSettingsInputSchema = z.object({
  emailVerificationRequired: z.boolean(),
});

export const PublicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  role: UserRoleSchema,
  status: z.enum(["PENDING_VERIFICATION", "ACTIVE", "DISABLED"]),
  emailVerifiedAt: z.string().nullable(),
  emailVerificationRequired: z.boolean(),
  canAccessStudentPortal: z.boolean(),
});
export type PublicUser = z.infer<typeof PublicUserSchema>;
