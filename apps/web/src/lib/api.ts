import type {
  AdminPaymentMethod,
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
  teacherId: string | null;
  teacher: { id: string; fullName: string; email: string } | null;
  course?: { id: string; title: string; slug: string };
  createdAt: string;
  updatedAt: string;
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
  register: (body: { fullName: string; email: string; password: string }) =>
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
  getSettings: () =>
    request<{ emailVerificationRequired: boolean }>("/auth/settings"),
  updateSettings: (emailVerificationRequired: boolean) =>
    request<{ emailVerificationRequired: boolean }>("/auth/settings", {
      method: "PATCH",
      body: { emailVerificationRequired },
    }),
  adminCreateUser: (body: {
    fullName: string;
    email: string;
    role: UserRole;
    password?: string;
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
  adminDashboardCounts: () =>
    request<{
      students: number;
      orders: number;
      batches: number;
      unassignedEnrollments: number;
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
  updateStudentProfile: (body: { phone?: string | null }) =>
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
  updateTeacherProfile: (body: { fullName: string }) =>
    request<{ profile: TeacherProfile }>("/teachers/profile", {
      method: "PATCH",
      body,
    }),
};

export type StudentEnrollment = {
  id: string;
  status: string;
  batchId: string | null;
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
};
