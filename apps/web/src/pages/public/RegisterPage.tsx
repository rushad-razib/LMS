import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/lib/api";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const user = await register(fullName, email, password);
      if (!user.canAccessStudentPortal) {
        navigate("/verify-email", { replace: true });
        return;
      }
      navigate("/student", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Register</h1>
      <p className="mt-2 text-ink-muted">Create a student account to buy and join courses.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Full name</span>
          <input
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 outline-none ring-accent focus:ring-2"
            value={fullName}
            required
            minLength={2}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email</span>
          <input
            type="email"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 outline-none ring-accent focus:ring-2"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Password</span>
          <input
            type="password"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 outline-none ring-accent focus:ring-2"
            value={password}
            required
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-fg disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink-muted">
        Already have an account?{" "}
        <Link to="/login" className="text-accent hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
