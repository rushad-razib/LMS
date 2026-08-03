import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, ApiError } from "@/lib/api";

export function SetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api.setPassword(token, password);
      setMessage("Password set. You can log in.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not set password");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Set password</h1>
      <p className="mt-2 text-ink-muted">Complete your invited account.</p>
      {!token ? (
        <p className="mt-4 text-sm text-red-600">Missing token.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Password</span>
            <input
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 outline-none ring-accent focus:ring-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-fg"
          >
            Save password
          </button>
        </form>
      )}
      <p className="mt-4 text-sm">
        <Link to="/login" className="text-accent hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
