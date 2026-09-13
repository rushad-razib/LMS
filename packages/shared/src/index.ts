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

export const LAUNCH_COURSES = [
  "Basic Computer",
  "Artificial Intelligence",
  "Web Development",
  "Graphic Design",
  "IELTS",
  "Freelancing",
] as const;

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

export const AdminDeleteUserInputSchema = z.preprocess(
  (val) => (val && typeof val === "object" ? val : {}),
  z.object({
    reassignTeacherId: z.string().min(1).optional().nullable(),
  }),
);
export type AdminDeleteUserInput = z.infer<typeof AdminDeleteUserInputSchema>;

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

export const CourseStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export type CourseStatus = z.infer<typeof CourseStatusSchema>;

export const BatchStatusSchema = z.enum(["UPCOMING", "ONGOING", "CLOSED"]);
export type BatchStatus = z.infer<typeof BatchStatusSchema>;

export const CreateCourseInputSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
    .optional(),
  overview: z.string().trim().min(10),
  duration: z.string().trim().min(1).max(120),
  priceBdt: z.number().int().min(0),
  outlineText: z.string().trim().optional().nullable(),
  faqText: z.string().trim().optional().nullable(),
  status: CourseStatusSchema.optional(),
});
export type CreateCourseInput = z.infer<typeof CreateCourseInputSchema>;

export const UpdateCourseInputSchema = CreateCourseInputSchema.partial();
export type UpdateCourseInput = z.infer<typeof UpdateCourseInputSchema>;

export const CreateBatchInputSchema = z.object({
  courseId: z.string().min(1),
  name: z.string().trim().min(2).max(200),
  scheduleSummary: z.string().trim().optional().nullable(),
  status: BatchStatusSchema.optional(),
  teacherId: z.string().min(1).optional().nullable(),
});
export type CreateBatchInput = z.infer<typeof CreateBatchInputSchema>;

export const UpdateBatchInputSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  scheduleSummary: z.string().trim().optional().nullable(),
  status: BatchStatusSchema.optional(),
  teacherId: z.string().min(1).optional().nullable(),
});
export type UpdateBatchInput = z.infer<typeof UpdateBatchInputSchema>;

export const AssignBatchTeacherInputSchema = z.object({
  teacherId: z.string().min(1).nullable(),
});

export const AdminPaymentMethodSchema = z.enum([
  "CASH",
  "CARD",
  "SSLCOMMERZ_OFFLINE",
  "OTHER",
]);
export type AdminPaymentMethod = z.infer<typeof AdminPaymentMethodSchema>;

export const OrderChannelSchema = z.enum(["ONLINE", "ADMIN"]);
export type OrderChannel = z.infer<typeof OrderChannelSchema>;

export const OrderStatusSchema = z.enum(["PENDING", "PAID", "FAILED", "CANCELLED"]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const EnrollmentStatusSchema = z.enum(["ACTIVE", "CANCELLED"]);
export type EnrollmentStatus = z.infer<typeof EnrollmentStatusSchema>;

export const CheckoutInputSchema = z.object({
  courseId: z.string().min(1),
});
export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;

export const AdminEnrollInputSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  paymentMethod: AdminPaymentMethodSchema,
  batchId: z.string().min(1).optional().nullable(),
});
export type AdminEnrollInput = z.infer<typeof AdminEnrollInputSchema>;

export const AssignEnrollmentBatchInputSchema = z.object({
  batchId: z.string().min(1).nullable(),
});
export type AssignEnrollmentBatchInput = z.infer<typeof AssignEnrollmentBatchInputSchema>;

export const UpdateStudentProfileInputSchema = z.object({
  phone: z.string().trim().max(40).nullable().optional(),
});
export type UpdateStudentProfileInput = z.infer<typeof UpdateStudentProfileInputSchema>;

export const UpdateTeacherProfileInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
});
export type UpdateTeacherProfileInput = z.infer<typeof UpdateTeacherProfileInputSchema>;

export const CreateLiveSessionInputSchema = z.object({
  title: z.string().trim().min(2).max(200),
  startsAt: z.string().trim().min(1),
  endsAt: z.string().trim().min(1).optional().nullable(),
  meetingUrl: z.string().trim().min(8).max(2000),
  notes: z.string().trim().max(8000).optional().nullable(),
});
export type CreateLiveSessionInput = z.infer<typeof CreateLiveSessionInputSchema>;

export const UpdateLiveSessionInputSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  startsAt: z.string().trim().min(1).optional(),
  endsAt: z.string().trim().min(1).optional().nullable(),
  meetingUrl: z.string().trim().min(8).max(2000).optional(),
  notes: z.string().trim().max(8000).optional().nullable(),
});
export type UpdateLiveSessionInput = z.infer<typeof UpdateLiveSessionInputSchema>;

export const CreateAnnouncementInputSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(1).max(20_000),
});
export type CreateAnnouncementInput = z.infer<typeof CreateAnnouncementInputSchema>;

export const UpdateAnnouncementInputSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  body: z.string().trim().min(1).max(20_000).optional(),
});
export type UpdateAnnouncementInput = z.infer<typeof UpdateAnnouncementInputSchema>;

export const UploadMaterialMetaSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
});
export type UploadMaterialMeta = z.infer<typeof UploadMaterialMetaSchema>;
