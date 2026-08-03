import type { PublicUser, UserRole } from "@arva/shared";

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
};
