import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { UserRole } from "@arva/shared";
import { api, ApiError } from "@/lib/api";

export function AdminSettingsPage() {
  const [required, setRequired] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSettings()
      .then((s) => setRequired(s.emailVerificationRequired))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const s = await api.updateSettings(required);
      setRequired(s.emailVerificationRequired);
      setMessage("Settings saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  if (loading) return <p className="text-ink-muted">Loading settings…</p>;

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="font-display text-2xl font-semibold">Website settings</h1>
      <form onSubmit={save} className="space-y-4 rounded-xl border border-border bg-surface-elevated p-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Require email verification</span>
            <span className="mt-1 block text-ink-muted">
              When on, students must verify email before the student portal. Turn off for
              local development/testing.
            </span>
          </span>
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-green-400">{message}</p> : null}
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
        >
          Save
        </button>
      </form>
    </div>
  );
}

export function AdminUsersPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const { user } = await api.adminCreateUser({
        fullName,
        email,
        role,
        password: password || undefined,
      });
      setMessage(`Created ${user.role}: ${user.email}`);
      setFullName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="font-display text-2xl font-semibold">Create user</h1>
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-border bg-surface-elevated p-4">
        <input
          className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="Full name"
          value={fullName}
          required
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="ADMIN">Admin</option>
        </select>
        <input
          className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="Password (optional — sends set-password email if empty)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-green-400">{message}</p> : null}
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
        >
          Create
        </button>
      </form>
    </div>
  );
}
