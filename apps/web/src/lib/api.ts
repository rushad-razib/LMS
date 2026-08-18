import type {
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
  headers.set("Content-Type", "application/json");
  if (options.auth !== false && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
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
};
