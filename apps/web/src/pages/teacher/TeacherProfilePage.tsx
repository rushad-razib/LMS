import { type FormEvent, useEffect, useState } from "react";
import { api, ApiError, type TeacherProfile } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Field } from "@/components/Field";
import { useAuth } from "@/features/auth/AuthProvider";

export function TeacherProfilePage() {
  const { user, refreshMe } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .teacherProfile()
      .then((r) => {
        setProfile(r.profile);
        setFullName(r.profile.fullName);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.updateTeacherProfile({ fullName: fullName.trim() });
      setProfile(res.profile);
      await refreshMe();
      toast.success("Profile updated");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-ink-muted">Loading…</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Profile</h1>
        <p className="mt-1 text-ink-muted">Your teacher account details.</p>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="rounded-xl border border-border bg-surface-elevated p-6">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-ink-muted">Email</dt>
            <dd className="font-medium">{profile?.email ?? user?.email}</dd>
          </div>
        </dl>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Full name">
            <input
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              value={fullName}
              required
              minLength={2}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save name"}
          </button>
        </form>
      </div>
    </div>
  );
}
