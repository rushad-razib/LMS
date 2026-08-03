import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { api, ApiError } from "@/lib/api";

export function VerifyEmailPage() {
  const { user, refreshMe, logout } = useAuth();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!token) return;
    setPending(true);
    api
      .verifyEmail(token)
      .then(async () => {
        setMessage("Email verified. You can open the student portal.");
        if (user) await refreshMe();
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Verification failed");
      })
      .finally(() => setPending(false));
  }, [token, user, refreshMe]);

  async function resend(e: FormEvent) {
    e.preventDefault();
    if (!user?.email) return;
    setPending(true);
    setError(null);
    try {
      await api.resendVerification(user.email);
      setMessage("Verification email sent. Check your inbox (or API console in dev).");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not resend");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Verify your email</h1>
      <p className="mt-2 text-ink-muted">
        {user
          ? `We sent a link to ${user.email}. Verify before accessing the student portal when verification is required.`
          : "Open the link from your email, or log in and resend."}
      </p>
      {pending ? <p className="mt-4 text-sm text-ink-muted">Working…</p> : null}
      {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        {user ? (
          <button
            type="button"
            onClick={resend}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
          >
            Resend verification
          </button>
        ) : (
          <Link to="/login" className="text-accent hover:underline">
            Login
          </Link>
        )}
        {user?.canAccessStudentPortal ? (
          <Link to="/student" className="text-accent hover:underline">
            Go to student portal
          </Link>
        ) : null}
        {user ? (
          <button type="button" onClick={() => logout()} className="text-sm text-ink-muted">
            Logout
          </button>
        ) : null}
      </div>
    </div>
  );
}
