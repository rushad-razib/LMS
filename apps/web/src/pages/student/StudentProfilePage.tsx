import { type FormEvent, useEffect, useState } from "react";
import { api, ApiError, type StudentProfile } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Field } from "@/components/Field";
import { useAuth } from "@/features/auth/AuthProvider";

export function StudentProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .studentProfile()
      .then((r) => {
        setProfile(r.profile);
        setPhone(r.profile.phone ?? "");
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
      const res = await api.updateStudentProfile({
        phone: phone.trim() || null,
      });
      setProfile(res.profile);
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
        <p className="mt-1 text-ink-muted">Your student account details.</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-border bg-surface-elevated p-6">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-ink-muted">Name</dt>
            <dd className="font-medium">{profile?.fullName ?? user?.fullName}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Email</dt>
            <dd className="font-medium">{profile?.email ?? user?.email}</dd>
          </div>
        </dl>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Phone">
            <input
              id="phone"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+8801…"
            />
          </Field>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save phone"}
          </button>
        </form>
      </div>
    </div>
  );
}
