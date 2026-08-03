import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "@/lib/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api.forgotPassword(email);
      setMessage("If that email exists, a reset link was sent.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Forgot password</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email</span>
          <input
            type="email"
            required
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 outline-none ring-accent focus:ring-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-fg"
        >
          Send reset link
        </button>
      </form>
      <p className="mt-4 text-sm">
        <Link to="/login" className="text-accent hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
