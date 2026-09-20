import { type FormEvent, useEffect, useRef, useState } from "react";
import { UpdateTeacherProfileInputSchema } from "@arva/shared";
import { api, ApiError, type TeacherProfile } from "@/lib/api";
import {
  applyApiFormError,
  parseWithSchema,
  type FieldErrors,
} from "@/lib/formErrors";
import { toast } from "@/lib/toast";
import { Field } from "@/components/Field";
import { useAuth } from "@/features/auth/AuthProvider";

export function TeacherProfilePage() {
  const { user, refreshMe } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [removingCv, setRemovingCv] = useState(false);
  const [loading, setLoading] = useState(true);
  const photoRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .teacherProfile()
      .then((r) => {
        setProfile(r.profile);
        setFullName(r.profile.fullName);
        setPhone(r.profile.phone ?? "");
        setTitle(r.profile.title ?? "");
        setBio(r.profile.bio ?? "");
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

    const parsed = parseWithSchema(UpdateTeacherProfileInputSchema, {
      fullName: fullName.trim(),
      phone: phone.trim() || null,
      title: title.trim() || null,
      bio: bio.trim() || null,
    });
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.formError);
      setSaving(false);
      return;
    }

    try {
      const res = await api.updateTeacherProfile(parsed.data);
      setProfile(res.profile);
      await refreshMe();
      toast.success("Profile updated");
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function onPhotoChange(file: File | null) {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await api.teacherUploadPhoto(body);
      setProfile(res.profile);
      toast.success("Photo updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploadingPhoto(false);
      if (photoRef.current) photoRef.current.value = "";
    }
  }

  async function onCvChange(file: File | null) {
    if (!file) return;
    setUploadingCv(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await api.teacherUploadCv(body);
      setProfile(res.profile);
      toast.success("CV uploaded");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "CV upload failed");
    } finally {
      setUploadingCv(false);
      if (cvRef.current) cvRef.current.value = "";
    }
  }

  async function onRemoveCv() {
    setRemovingCv(true);
    try {
      const res = await api.teacherDeleteCv();
      setProfile(res.profile);
      toast.success("CV removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Remove failed");
    } finally {
      setRemovingCv(false);
    }
  }

  if (loading) return <p className="text-ink-muted">Loading…</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Profile</h1>
        <p className="mt-1 text-ink-muted">Your teacher account details.</p>
      </div>

      {loadError ? <p className="text-sm text-red-400">{loadError}</p> : null}

      <div className="rounded-xl border border-border bg-surface-elevated p-6">
        <div className="mb-6 flex items-center gap-4">
          {profile?.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface text-sm text-ink-muted">
              No photo
            </div>
          )}
          <div>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              disabled={uploadingPhoto}
              onClick={() => photoRef.current?.click()}
              className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-60"
            >
              {uploadingPhoto ? "Uploading…" : "Upload photo"}
            </button>
          </div>
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-ink-muted">Email</dt>
            <dd className="font-medium">{profile?.email ?? user?.email}</dd>
          </div>
        </dl>

        <div className="mt-6 space-y-3 rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            CV (optional)
          </h2>
          <p className="text-sm text-ink-muted">PDF only, up to 10MB.</p>
          {profile?.cvFileName ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {profile.cvUrl ? (
                <a
                  href={profile.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-accent hover:underline"
                >
                  {profile.cvFileName}
                </a>
              ) : (
                <span className="font-medium">{profile.cvFileName}</span>
              )}
              <button
                type="button"
                disabled={removingCv}
                onClick={onRemoveCv}
                className="text-red-400 hover:underline disabled:opacity-60"
              >
                {removingCv ? "Removing…" : "Remove"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">No CV uploaded yet.</p>
          )}
          <input
            ref={cvRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => onCvChange(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            disabled={uploadingCv}
            onClick={() => cvRef.current?.click()}
            className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-60"
          >
            {uploadingCv
              ? "Uploading…"
              : profile?.cvFileName
                ? "Replace CV"
                : "Upload CV"}
          </button>
        </div>

        <form noValidate onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Full name" error={fieldErrors.fullName}>
            <input
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>
          <Field label="Phone" error={fieldErrors.phone}>
            <input
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+8801…"
            />
          </Field>
          <Field label="Title" error={fieldErrors.title}>
            <input
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Instructor"
            />
          </Field>
          <Field label="Bio" error={fieldErrors.bio}>
            <textarea
              className="min-h-28 w-full rounded-lg border border-border bg-surface px-3 py-2"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </Field>
          {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
