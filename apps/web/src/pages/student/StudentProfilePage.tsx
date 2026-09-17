import { type FormEvent, useEffect, useState } from "react";
import { UpdateStudentProfileInputSchema } from "@arva/shared";
import { api, ApiError, type StudentProfile } from "@/lib/api";
import {
  applyApiFormError,
  parseWithSchema,
  type FieldErrors,
} from "@/lib/formErrors";
import { toast } from "@/lib/toast";
import { Field } from "@/components/Field";
import { useAuth } from "@/features/auth/AuthProvider";

export function StudentProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [phone, setPhone] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
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
        setLoadError(err instanceof ApiError ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError(null);

    const parsed = parseWithSchema(UpdateStudentProfileInputSchema, {
      phone: phone.trim() || null,
    });
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.formError);
      setSaving(false);
      return;
    }

    try {
      const res = await api.updateStudentProfile(parsed.data);
      setProfile(res.profile);
      toast.success("Profile updated");
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Update failed");
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

      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </p>
      ) : null}

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

        <form noValidate onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Phone" error={fieldErrors.phone}>
            <input
              id="phone"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+8801…"
            />
          </Field>
          {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
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
