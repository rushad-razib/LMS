import type {
  AdminEnrollPaymentMode,
  AdminPaymentMethod,
  BatchDeliveryMode,
  BatchStatus,
  CourseStatus,
  CreateBatchInput,
  CreateCourseInput,
  PublicUser,
  UpdateBatchInput,
  UpdateCourseInput,
  UserRole,
} from "@arva/shared";

const API_BASE = "/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type Course = {
  id: string;
  title: string;
  slug: string;
  overview: string;
  duration: string;
  priceBdt: number;
  outlineText: string | null;
  faqText: string | null;
  coverImageKey?: string | null;
  coverImageUrl?: string | null;
  status: CourseStatus | string;
  createdAt: string;
  updatedAt: string;
  batchCount?: number;
  batches?: Batch[];
};

export type Batch = {
  id: string;
  courseId: string;
  name: string;
  scheduleSummary: string | null;
  status: BatchStatus | string;
  deliveryMode: BatchDeliveryMode | string;
  seatCapacity: number;
  seatsFilled?: number;
  startDate: string | null;
  endDate: string | null;
  teacherId: string | null;
  teacher: { id: string; fullName: string; email: string } | null;
  course?: { id: string; title: string; slug: string };
  createdAt: string;
  updatedAt: string;
};

export type BatchOverview = Batch & {
  seatsFilled: number;
  students: {
    id: string;
    fullName: string;
    email: string;
    enrolledAt: string;
    enrollmentId: string;
  }[];
};

export type OrderRow = {
  id: string;
  userId: string;
  courseId: string;
  amountBdt: number;
  channel: string;
  status: string;
  paymentMethod: string | null;
  provider: string | null;
  providerRef: string | null;
  tranId: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; fullName: string; email: string };
  course: { id: string; title: string; slug: string };
  enrollment: {
    id: string;
    batchId: string | null;
    status: string;
    batch: { id: string; name: string } | null;
  } | null;
};

export type StudentOrderRow = Omit<OrderRow, "user"> & {
  user?: OrderRow["user"];
};

export type EnrollmentRow = {
  id: string;
  userId: string;
  courseId: string;
  orderId: string | null;
  batchId: string | null;
  status: string;
  createdAt: string;
  user: { id: string; fullName: string; email: string };
  course: { id: string; title: string; slug: string };
  batch: { id: string; name: string } | null;
  order: {
    id: string;
    amountBdt: number;
    channel: string;
    status: string;
    paymentMethod: string | null;
    tranId: string;
  } | null;
};

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isForm) {
    headers.set("Content-Type", "application/json");
  }
  if (options.auth !== false && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
    body:
      options.body === undefined
        ? undefined
        : isForm
          ? (options.body as FormData)
          : JSON.stringify(options.body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      data?.error?.message ?? "Request failed",
      res.status,
      data?.error?.code,
      data?.error?.details,
    );
  }
  return data as T;
}

export const api = {
  register: (body: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
  }) =>
    request<{ accessToken: string; user: PublicUser }>("/auth/register", {
      method: "POST",
      body,
      auth: false,
    }),
  login: (body: { email: string; password: string }) =>
    request<{ accessToken: string; user: PublicUser }>("/auth/login", {
      method: "POST",
      body,
      auth: false,
    }),
  refresh: () =>
    request<{ accessToken: string; user: PublicUser }>("/auth/refresh", {
      method: "POST",
      auth: false,
    }),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
  me: () => request<{ user: PublicUser }>("/auth/me"),
  verifyEmail: (token: string) =>
    request<{ user: PublicUser }>("/auth/verify-email", {
      method: "POST",
      body: { token },
      auth: false,
    }),
  resendVerification: (email: string) =>
    request<{ ok: true }>("/auth/resend-verification", {
      method: "POST",
      body: { email },
      auth: false,
    }),
  forgotPassword: (email: string) =>
    request<{ ok: true }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
      auth: false,
    }),
  resetPassword: (token: string, password: string) =>
    request<{ ok: true }>("/auth/reset-password", {
      method: "POST",
      body: { token, password },
      auth: false,
    }),
  setPassword: (token: string, password: string) =>
    request<{ ok: true }>("/auth/set-password", {
      method: "POST",
      body: { token, password },
      auth: false,
    }),
  getSettings: () => request<WebsiteSettings>("/auth/settings"),
  updateSettings: (body: Partial<WebsiteSettings>) =>
    request<WebsiteSettings>("/auth/settings", {
      method: "PATCH",
      body,
    }),
  getPublicSettings: () =>
    request<{ settings: PublicWebsiteSettings }>("/content/public/settings", {
      auth: false,
    }),
  adminUploadSettingsLogo: (slot: "header" | "footer", file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<{ settings: WebsiteSettings }>(
      `/content/admin/settings/logo/${slot}`,
      { method: "POST", body },
    );
  },

  listPublicBlog: () =>
    request<{ posts: BlogPost[] }>("/content/public/blog", { auth: false }),
  getPublicBlog: (slug: string) =>
    request<{ post: BlogPost }>(`/content/public/blog/${slug}`, { auth: false }),
  listPublicGallery: () =>
    request<{ items: GalleryItem[] }>("/content/public/gallery", { auth: false }),
  listPublicTrainers: () =>
    request<{ trainers: MarketingTrainer[] }>("/content/public/trainers", {
      auth: false,
    }),

  adminListBlog: () => request<{ posts: BlogPost[] }>("/content/admin/blog"),
  adminCreateBlog: (body: {
    title: string;
    slug?: string;
    excerpt: string;
    bodyHtml: string;
    published?: boolean;
  }) =>
    request<{ post: BlogPost }>("/content/admin/blog", { method: "POST", body }),
  adminUpdateBlog: (
    id: string,
    body: {
      title?: string;
      slug?: string;
      excerpt?: string;
      bodyHtml?: string;
      published?: boolean;
    },
  ) =>
    request<{ post: BlogPost }>(`/content/admin/blog/${id}`, {
      method: "PATCH",
      body,
    }),
  adminDeleteBlog: (id: string) =>
    request<{ ok: true }>(`/content/admin/blog/${id}`, { method: "DELETE" }),
  adminUploadBlogCover: (id: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<{ post: BlogPost }>(`/content/admin/blog/${id}/cover`, {
      method: "POST",
      body,
    });
  },

  adminListGallery: () => request<{ items: GalleryItem[] }>("/content/admin/gallery"),
  adminCreateGallery: (
    file: File,
    meta?: { title?: string | null; sortOrder?: number },
  ) => {
    const body = new FormData();
    body.append("file", file);
    if (meta?.title) body.append("title", meta.title);
    if (meta?.sortOrder != null) body.append("sortOrder", String(meta.sortOrder));
    return request<{ item: GalleryItem }>("/content/admin/gallery", {
      method: "POST",
      body,
    });
  },
  adminUpdateGallery: (
    id: string,
    body: { title?: string | null; sortOrder?: number },
  ) =>
    request<{ item: GalleryItem }>(`/content/admin/gallery/${id}`, {
      method: "PATCH",
      body,
    }),
  adminDeleteGallery: (id: string) =>
    request<{ ok: true }>(`/content/admin/gallery/${id}`, { method: "DELETE" }),

  adminListTrainers: () =>
    request<{ trainers: MarketingTrainer[] }>("/content/admin/trainers"),
  adminCreateTrainer: (body: {
    fullName: string;
    title?: string | null;
    bio?: string | null;
    sortOrder?: number;
    published?: boolean;
  }) =>
    request<{ trainer: MarketingTrainer }>("/content/admin/trainers", {
      method: "POST",
      body,
    }),
  adminUpdateTrainer: (
    id: string,
    body: {
      fullName?: string;
      title?: string | null;
      bio?: string | null;
      sortOrder?: number;
      published?: boolean;
    },
  ) =>
    request<{ trainer: MarketingTrainer }>(`/content/admin/trainers/${id}`, {
      method: "PATCH",
      body,
    }),
  adminDeleteTrainer: (id: string) =>
    request<{ ok: true }>(`/content/admin/trainers/${id}`, { method: "DELETE" }),
  adminUploadTrainerPhoto: (id: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<{ trainer: MarketingTrainer }>(
      `/content/admin/trainers/${id}/photo`,
      { method: "POST", body },
    );
  },

  adminListNotices: () => request<{ notices: GlobalNotice[] }>("/notices/admin"),
  adminCreateNotice: (body: {
    title: string;
    body: string;
    published?: boolean;
  }) =>
    request<{ notice: GlobalNotice }>("/notices/admin", { method: "POST", body }),
  adminUpdateNotice: (
    id: string,
    body: { title?: string; body?: string; published?: boolean },
  ) =>
    request<{ notice: GlobalNotice }>(`/notices/admin/${id}`, {
      method: "PATCH",
      body,
    }),
  adminDeleteNotice: (id: string) =>
    request<{ ok: true }>(`/notices/admin/${id}`, { method: "DELETE" }),
  studentNotices: () => request<{ notices: GlobalNotice[] }>("/notices/student"),

  submitContact: (body: {
    name: string;
    email: string;
    phone?: string | null;
    subject: string;
    message: string;
  }) =>
    request<{ ok: true; leadId: string }>("/contact", {
      method: "POST",
      body,
      auth: false,
    }),
  adminListLeads: () => request<{ leads: Lead[] }>("/contact/admin"),
  adminMarkLeadRead: (id: string) =>
    request<{ lead: Lead }>(`/contact/admin/${id}/read`, { method: "PATCH" }),

  adminCreateUser: (body: {
    fullName: string;
    email: string;
    role: UserRole;
    password?: string;
    phone?: string;
  }) =>
    request<{ user: PublicUser }>("/auth/admin/users", {
      method: "POST",
      body,
    }),
  adminListUsers: () =>
    request<{
      users: {
        id: string;
        email: string;
        fullName: string;
        role: string;
        status: string;
        emailVerifiedAt: string | null;
        createdAt: string;
        taughtBatchCount: number;
        taughtBatches: { id: string; name: string; courseTitle: string }[];
      }[];
    }>("/auth/admin/users"),
  adminDeleteUser: (id: string, body?: { reassignTeacherId?: string | null }) =>
    request<{ ok: true }>(`/auth/admin/users/${id}`, {
      method: "DELETE",
      body: body ?? {},
    }),

  listPublicCourses: () =>
    request<{ courses: Course[] }>("/courses/public", { auth: false }),
  getPublicCourse: (slug: string) =>
    request<{ course: Course }>(`/courses/public/${slug}`, { auth: false }),

  adminListCourses: () => request<{ courses: Course[] }>("/courses"),
  adminGetCourse: (id: string) => request<{ course: Course }>(`/courses/${id}`),
  adminCreateCourse: (body: CreateCourseInput) =>
    request<{ course: Course }>("/courses", { method: "POST", body }),
  adminUpdateCourse: (id: string, body: UpdateCourseInput) =>
    request<{ course: Course }>(`/courses/${id}`, { method: "PATCH", body }),
  adminDeleteCourse: (id: string) =>
    request<{ ok: true }>(`/courses/${id}`, { method: "DELETE" }),

  adminListBatches: (courseId?: string) =>
    request<{ batches: Batch[] }>(
      courseId
        ? `/courses/batches?courseId=${encodeURIComponent(courseId)}`
        : "/courses/batches",
    ),
  adminGetBatch: (id: string) =>
    request<{ batch: BatchOverview }>(`/courses/batches/${id}`),
  adminCreateBatch: (body: CreateBatchInput) =>
    request<{ batch: Batch }>("/courses/batches", { method: "POST", body }),
  adminUpdateBatch: (id: string, body: UpdateBatchInput) =>
    request<{ batch: Batch }>(`/courses/batches/${id}`, { method: "PATCH", body }),
  adminAssignBatchTeacher: (id: string, teacherId: string | null) =>
    request<{ batch: Batch }>(`/courses/batches/${id}/teacher`, {
      method: "PATCH",
      body: { teacherId },
    }),
  adminDeleteBatch: (id: string) =>
    request<{ ok: true }>(`/courses/batches/${id}`, { method: "DELETE" }),
  adminListTeachers: () =>
    request<{ teachers: { id: string; fullName: string; email: string }[] }>(
      "/courses/teachers",
    ),
  adminUploadCourseCover: (id: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<{ course: Course }>(`/courses/${id}/cover`, {
      method: "POST",
      body,
    });
  },

  checkout: (courseId: string) =>
    request<{
      kind: "enrolled" | "redirect";
      gatewayUrl: string | null;
      order: { id: string; tranId: string; status: string; amountBdt: number };
      enrollment: EnrollmentRow | null;
    }>("/purchases/checkout", { method: "POST", body: { courseId } }),
  myOrders: () => request<{ orders: StudentOrderRow[] }>("/purchases/me"),
  adminListOrders: () => request<{ orders: OrderRow[] }>("/purchases/admin/orders"),
  adminListEnrollments: (unassignedOnly?: boolean) =>
    request<{ enrollments: EnrollmentRow[] }>(
      unassignedOnly
        ? "/purchases/admin/enrollments?unassigned=1"
        : "/purchases/admin/enrollments",
    ),
  adminEnroll: (body: {
    studentId: string;
    courseId: string;
    paymentMethod: AdminPaymentMethod;
    batchId?: string | null;
    paymentMode?: AdminEnrollPaymentMode;
  }) =>
    request<{ order: OrderRow; enrollment: EnrollmentRow }>(
      "/purchases/admin/enroll",
      { method: "POST", body },
    ),
  adminAssignEnrollmentBatch: (id: string, batchId: string | null) =>
    request<{ enrollment: EnrollmentRow }>(
      `/purchases/admin/enrollments/${id}/batch`,
      { method: "PATCH", body: { batchId } },
    ),
  adminSetEnrollmentAccess: (id: string, accessBlocked: boolean) =>
    request<{ enrollment: EnrollmentRow }>(
      `/purchases/admin/enrollments/${id}/access`,
      { method: "PATCH", body: { accessBlocked } },
    ),
  adminMarkInstallmentPaid: (id: string, paymentMethod: AdminPaymentMethod) =>
    request<{ order: OrderRow; installment: InstallmentRow }>(
      `/purchases/admin/installments/${id}/pay`,
      { method: "POST", body: { paymentMethod } },
    ),
  adminStudentDetail: (userId: string) =>
    request<AdminStudentDetail>(`/purchases/admin/students/${userId}`),
  adminDashboardCounts: () =>
    request<{
      students: number;
      orders: number;
      batches: number;
      unassignedEnrollments: number;
      unverifiedStudents: number;
      unreadLeads: number;
    }>("/purchases/admin/dashboard"),

  myEnrollments: () =>
    request<{ enrollments: StudentEnrollment[] }>("/students/enrollments"),
  studentCourseHub: (slug: string) =>
    request<{ enrollment: StudentEnrollment }>(`/students/courses/${slug}`),
  studentCourseSessions: (slug: string) =>
    request<{ sessions: StudentLiveSession[] }>(
      `/students/courses/${slug}/sessions`,
    ),
  studentCourseMaterials: (slug: string) =>
    request<{ materials: StudentMaterial[] }>(
      `/students/courses/${slug}/materials`,
    ),
  studentCourseAnnouncements: (slug: string) =>
    request<{ announcements: StudentAnnouncement[] }>(
      `/students/courses/${slug}/announcements`,
    ),
  studentProfile: () => request<{ profile: StudentProfile }>("/students/profile"),
  updateStudentProfile: (body: {
    phone: string;
    whatsappPhone?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    nidNumber?: string | null;
    addressLine?: string | null;
    city?: string | null;
    district?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
    educationLevel?: string | null;
    occupation?: string | null;
  }) =>
    request<{ profile: StudentProfile }>("/students/profile", {
      method: "PATCH",
      body,
    }),

  teacherBatches: () => request<{ batches: TeacherBatch[] }>("/teachers/batches"),
  teacherBatchHub: (id: string) =>
    request<{ batch: TeacherBatchHub }>(`/teachers/batches/${id}`),
  teacherSessions: (batchId: string) =>
    request<{ sessions: TeacherLiveSession[] }>(
      `/teachers/batches/${batchId}/sessions`,
    ),
  teacherCreateSession: (batchId: string, body: TeacherSessionInput) =>
    request<{ session: TeacherLiveSession }>(
      `/teachers/batches/${batchId}/sessions`,
      { method: "POST", body },
    ),
  teacherUpdateSession: (
    batchId: string,
    sessionId: string,
    body: Partial<TeacherSessionInput>,
  ) =>
    request<{ session: TeacherLiveSession }>(
      `/teachers/batches/${batchId}/sessions/${sessionId}`,
      { method: "PATCH", body },
    ),
  teacherDeleteSession: (batchId: string, sessionId: string) =>
    request<{ ok: true }>(`/teachers/batches/${batchId}/sessions/${sessionId}`, {
      method: "DELETE",
    }),
  teacherMaterials: (batchId: string) =>
    request<{ materials: TeacherMaterial[] }>(
      `/teachers/batches/${batchId}/materials`,
    ),
  teacherUploadMaterial: (batchId: string, body: FormData) =>
    request<{ material: TeacherMaterial }>(
      `/teachers/batches/${batchId}/materials`,
      { method: "POST", body },
    ),
  teacherDeleteMaterial: (batchId: string, materialId: string) =>
    request<{ ok: true }>(
      `/teachers/batches/${batchId}/materials/${materialId}`,
      { method: "DELETE" },
    ),
  teacherAnnouncements: (batchId: string) =>
    request<{ announcements: TeacherAnnouncement[] }>(
      `/teachers/batches/${batchId}/announcements`,
    ),
  teacherCreateAnnouncement: (
    batchId: string,
    body: { title: string; body: string },
  ) =>
    request<{ announcement: TeacherAnnouncement }>(
      `/teachers/batches/${batchId}/announcements`,
      { method: "POST", body },
    ),
  teacherUpdateAnnouncement: (
    batchId: string,
    announcementId: string,
    body: { title?: string; body?: string },
  ) =>
    request<{ announcement: TeacherAnnouncement }>(
      `/teachers/batches/${batchId}/announcements/${announcementId}`,
      { method: "PATCH", body },
    ),
  teacherDeleteAnnouncement: (batchId: string, announcementId: string) =>
    request<{ ok: true }>(
      `/teachers/batches/${batchId}/announcements/${announcementId}`,
      { method: "DELETE" },
    ),
  teacherProfile: () => request<{ profile: TeacherProfile }>("/teachers/profile"),
  updateTeacherProfile: (body: {
    fullName: string;
    phone?: string | null;
    title?: string | null;
    bio?: string | null;
  }) =>
    request<{ profile: TeacherProfile }>("/teachers/profile", {
      method: "PATCH",
      body,
    }),
  teacherUploadPhoto: (body: FormData) =>
    request<{ profile: TeacherProfile }>("/teachers/profile/photo", {
      method: "POST",
      body,
    }),
  teacherUploadCv: (body: FormData) =>
    request<{ profile: TeacherProfile }>("/teachers/profile/cv", {
      method: "POST",
      body,
    }),
  teacherDeleteCv: () =>
    request<{ profile: TeacherProfile }>("/teachers/profile/cv", {
      method: "DELETE",
    }),
  adminTeacherProfile: (id: string) =>
    request<{ profile: TeacherProfile }>(`/auth/admin/teachers/${id}`),
  adminUploadTeacherCv: (id: string, body: FormData) =>
    request<{ profile: TeacherProfile }>(`/auth/admin/teachers/${id}/cv`, {
      method: "POST",
      body,
    }),
  adminDeleteTeacherCv: (id: string) =>
    request<{ profile: TeacherProfile }>(`/auth/admin/teachers/${id}/cv`, {
      method: "DELETE",
    }),
};

export type StudentEnrollment = {
  id: string;
  status: string;
  batchId: string | null;
  accessBlocked?: boolean;
  awaitingBatch: boolean;
  createdAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    overview: string;
    duration: string;
    priceBdt: number;
  };
  batch: {
    id: string;
    name: string;
    scheduleSummary: string | null;
    status: string;
    teacher: { id: string; fullName: string } | null;
  } | null;
};

export type InstallmentRow = {
  id: string;
  sequence: number;
  amountBdt: number;
  dueDate: string;
  payByDate: string;
  status: string;
  paidAt: string | null;
  paymentMethod: string | null;
  orderId: string | null;
};

export type AdminStudentDetail = {
  student: {
    id: string;
    fullName: string;
    email: string;
    status: string;
    phone: string | null;
    whatsappPhone: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    nidNumber: string | null;
    addressLine: string | null;
    city: string | null;
    district: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    educationLevel: string | null;
    occupation: string | null;
    emailVerifiedAt: string | null;
    createdAt: string;
  };
  enrollments: {
    id: string;
    createdAt: string;
    accessBlocked: boolean;
    batch: { id: string; name: string } | null;
    course: { id: string; title: string; slug: string; priceBdt: number };
    totalBdt: number;
    dueBdt: number;
    paidBdt: number;
    paymentMode: string;
    plan: {
      id: string;
      months: number;
      status: string;
      graceDays: number;
      installments: InstallmentRow[];
    } | null;
  }[];
};

export type StudentLiveSession = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  meetingUrl: string;
  notes: string | null;
};

export type StudentMaterial = {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
};

export type StudentAnnouncement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

export type StudentProfile = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  whatsappPhone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nidNumber: string | null;
  addressLine: string | null;
  city: string | null;
  district: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  educationLevel: string | null;
  occupation: string | null;
  emailVerifiedAt: string | null;
};

export type TeacherBatch = {
  id: string;
  name: string;
  scheduleSummary: string | null;
  status: string;
  course: { id: string; title: string; slug: string };
  studentCount: number;
  sessionCount: number;
  materialCount: number;
  announcementCount: number;
  createdAt: string;
  updatedAt: string;
};

export type TeacherLiveSession = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  meetingUrl: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TeacherAnnouncement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type TeacherBatchHub = {
  id: string;
  name: string;
  scheduleSummary: string | null;
  status: string;
  course: { id: string; title: string; slug: string };
  studentCount: number;
  upcomingSession: TeacherLiveSession | null;
  latestAnnouncement: TeacherAnnouncement | null;
  createdAt: string;
  updatedAt: string;
};

export type TeacherMaterial = {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
};

export type TeacherSessionInput = {
  title: string;
  startsAt: string;
  endsAt?: string | null;
  meetingUrl: string;
  notes?: string | null;
};

export type TeacherProfile = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  cvFileName: string | null;
  cvUrl: string | null;
};

export type WebsiteSettings = {
  emailVerificationRequired: boolean;
  siteName: string | null;
  headerLogoKey: string | null;
  headerLogoUrl: string | null;
  footerLogoKey: string | null;
  footerLogoUrl: string | null;
  footerCopyright: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  businessHours: string | null;
  whatsappNumber: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  mapEmbedHtml: string | null;
  announcementBar: string | null;
};

export type PublicWebsiteSettings = {
  siteName: string | null;
  headerLogoUrl: string | null;
  footerLogoUrl: string | null;
  footerCopyright: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  businessHours: string | null;
  whatsappNumber: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  mapEmbedHtml: string | null;
  announcementBar: string | null;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  bodyHtml: string;
  coverImageKey: string | null;
  coverImageUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GalleryItem = {
  id: string;
  title: string | null;
  imageKey: string;
  imageUrl: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MarketingTrainer = {
  id: string;
  fullName: string;
  title: string | null;
  bio: string | null;
  photoKey: string | null;
  photoUrl: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GlobalNotice = {
  id: string;
  title: string;
  body: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};
