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
  phone: z.string().trim().min(6).max(40),
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

export const AdminCreateUserInputSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(255),
    role: UserRoleSchema,
    password: z.string().min(8).max(128).optional(),
    phone: z.string().trim().min(6).max(40).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "STUDENT" && (!data.phone || data.phone.trim().length < 6)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone is required for students",
        path: ["phone"],
      });
    }
  });
export type AdminCreateUserInput = z.infer<typeof AdminCreateUserInputSchema>;

export const AdminDeleteUserInputSchema = z.preprocess(
  (val) => (val && typeof val === "object" ? val : {}),
  z.object({
    reassignTeacherId: z.string().min(1).optional().nullable(),
  }),
);
export type AdminDeleteUserInput = z.infer<typeof AdminDeleteUserInputSchema>;

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullable().optional(),
  );

const optionalEmail = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().trim().email().max(255).nullable().optional(),
);

const optionalHttpUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z
    .string()
    .trim()
    .max(2000)
    .refine((v) => /^https?:\/\//i.test(v), { message: "Must be a valid http(s) URL" })
    .nullable()
    .optional(),
);

export const UpdateSettingsInputSchema = z.object({
  emailVerificationRequired: z.boolean().optional(),
  contactPhone: optionalText(40),
  contactEmail: optionalEmail,
  address: optionalText(2000),
  businessHours: optionalText(2000),
  whatsappNumber: optionalText(40),
  facebookUrl: optionalHttpUrl,
  instagramUrl: optionalHttpUrl,
  youtubeUrl: optionalHttpUrl,
  mapEmbedHtml: optionalText(8000),
  announcementBar: optionalText(500),
});
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsInputSchema>;

export const CreateBlogPostInputSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
    .optional(),
  excerpt: z.string().trim().min(1).max(2000),
  bodyHtml: z.string().trim().min(1).max(200_000),
  published: z.boolean().optional(),
});
export type CreateBlogPostInput = z.infer<typeof CreateBlogPostInputSchema>;

export const UpdateBlogPostInputSchema = CreateBlogPostInputSchema.partial();
export type UpdateBlogPostInput = z.infer<typeof UpdateBlogPostInputSchema>;

export const CreateGalleryItemInputSchema = z.object({
  title: z.string().trim().max(200).optional().nullable(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});
export type CreateGalleryItemInput = z.infer<typeof CreateGalleryItemInputSchema>;

export const UpdateGalleryItemInputSchema = z.object({
  title: z.string().trim().max(200).optional().nullable(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});
export type UpdateGalleryItemInput = z.infer<typeof UpdateGalleryItemInputSchema>;

export const CreateGlobalNoticeInputSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(1).max(20_000),
  published: z.boolean().optional(),
});
export type CreateGlobalNoticeInput = z.infer<typeof CreateGlobalNoticeInputSchema>;

export const UpdateGlobalNoticeInputSchema = CreateGlobalNoticeInputSchema.partial();
export type UpdateGlobalNoticeInput = z.infer<typeof UpdateGlobalNoticeInputSchema>;

export const CreateMarketingTrainerInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  title: z.string().trim().max(200).optional().nullable(),
  bio: z.string().trim().max(8000).optional().nullable(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  published: z.boolean().optional(),
});
export type CreateMarketingTrainerInput = z.infer<
  typeof CreateMarketingTrainerInputSchema
>;

export const UpdateMarketingTrainerInputSchema =
  CreateMarketingTrainerInputSchema.partial();
export type UpdateMarketingTrainerInput = z.infer<
  typeof UpdateMarketingTrainerInputSchema
>;

export const ContactLeadInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().nullable(),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(10_000),
});
export type ContactLeadInput = z.infer<typeof ContactLeadInputSchema>;

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

export const BatchDeliveryModeSchema = z.enum(["ONLINE", "OFFLINE"]);
export type BatchDeliveryMode = z.infer<typeof BatchDeliveryModeSchema>;

export const InstallmentMonthsSchema = z.union([z.literal(3), z.literal(6)]);
export type InstallmentMonths = z.infer<typeof InstallmentMonthsSchema>;

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
  coverImageKey: z.string().min(1).optional().nullable(),
  coverImageUrl: z.string().min(1).optional().nullable(),
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
  deliveryMode: BatchDeliveryModeSchema.optional(),
  seatCapacity: z.number().int().min(1).max(10_000).optional(),
  startDate: z.string().min(1).optional().nullable(),
  endDate: z.string().min(1).optional().nullable(),
});
export type CreateBatchInput = z.infer<typeof CreateBatchInputSchema>;

export const UpdateBatchInputSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  scheduleSummary: z.string().trim().optional().nullable(),
  status: BatchStatusSchema.optional(),
  teacherId: z.string().min(1).optional().nullable(),
  deliveryMode: BatchDeliveryModeSchema.optional(),
  seatCapacity: z.number().int().min(1).max(10_000).optional(),
  startDate: z.string().min(1).optional().nullable(),
  endDate: z.string().min(1).optional().nullable(),
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

export const AdminEnrollPaymentModeSchema = z.enum(["FULL", "INSTALLMENT_3", "INSTALLMENT_6"]);
export type AdminEnrollPaymentMode = z.infer<typeof AdminEnrollPaymentModeSchema>;

export const AdminEnrollInputSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  paymentMethod: AdminPaymentMethodSchema,
  batchId: z.string().min(1).optional().nullable(),
  paymentMode: AdminEnrollPaymentModeSchema.optional().default("FULL"),
});
export type AdminEnrollInput = z.infer<typeof AdminEnrollInputSchema>;

export const AssignEnrollmentBatchInputSchema = z.object({
  batchId: z.string().min(1).nullable(),
});
export type AssignEnrollmentBatchInput = z.infer<typeof AssignEnrollmentBatchInputSchema>;

export const MarkInstallmentPaidInputSchema = z.object({
  paymentMethod: AdminPaymentMethodSchema,
});
export type MarkInstallmentPaidInput = z.infer<typeof MarkInstallmentPaidInputSchema>;

export const SetEnrollmentAccessInputSchema = z.object({
  accessBlocked: z.boolean(),
});
export type SetEnrollmentAccessInput = z.infer<typeof SetEnrollmentAccessInputSchema>;

export const UpdateStudentProfileInputSchema = z.object({
  phone: z.string().trim().min(6).max(40),
  whatsappPhone: optionalText(40),
  dateOfBirth: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
      .nullable()
      .optional(),
  ),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).nullable().optional(),
  nidNumber: optionalText(40),
  addressLine: optionalText(191),
  city: optionalText(120),
  district: optionalText(120),
  guardianName: optionalText(120),
  guardianPhone: optionalText(40),
  educationLevel: optionalText(120),
  occupation: optionalText(120),
});
export type UpdateStudentProfileInput = z.infer<typeof UpdateStudentProfileInputSchema>;

export const StudentGenderSchema = z.enum([
  "MALE",
  "FEMALE",
  "OTHER",
  "PREFER_NOT_TO_SAY",
]);
export type StudentGender = z.infer<typeof StudentGenderSchema>;
export const STUDENT_GENDERS = StudentGenderSchema.options;

export const UpdateTeacherProfileInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: optionalText(40),
  title: optionalText(120),
  bio: optionalText(8000),
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
