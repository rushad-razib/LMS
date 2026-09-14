import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PasswordField } from "@/components/PasswordField";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/lib/api";

function portalForRole(role: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "TEACHER") return "/teacher";
  return "/student";
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (user.role === "STUDENT" && !user.canAccessStudentPortal) {
        navigate("/verify-email", { replace: true });
        return;
      }
      navigate(from || portalForRole(user.role), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Login</h1>
      <p className="mt-2 text-ink-muted">Sign in to your AR Visionary Academy account.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">Email</span>
          <input
            type="email"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-ink outline-none ring-accent focus:ring-2"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <PasswordField label="Password" value={password} onValueChange={setPassword} required />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-fg disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink-muted">
        <Link to="/forgot-password" className="text-accent hover:underline">
          Forgot password?
        </Link>
        {" · "}
        <Link to="/register" className="text-accent hover:underline">
          Create student account
        </Link>
      </p>
    </div>
  );
}
