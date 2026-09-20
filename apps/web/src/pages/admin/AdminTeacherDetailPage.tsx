import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError, type TeacherProfile } from "@/lib/api";
import { toast } from "@/lib/toast";
import { PageHeader } from "@/components/PageHeader";

export function AdminTeacherDetailPage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [removingCv, setRemovingCv] = useState(false);
  const cvRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    const r = await api.adminTeacherProfile(userId);
    setProfile(r.profile);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed"))
      .finally(() => setLoading(false));
  }, [load]);

  async function onCvChange(file: File | null) {
    if (!file || !userId) return;
    setUploadingCv(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await api.adminUploadTeacherCv(userId, body);
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
    if (!userId) return;
    setRemovingCv(true);
    try {
      const res = await api.adminDeleteTeacherCv(userId);
      setProfile(res.profile);
      toast.success("CV removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Remove failed");
    } finally {
      setRemovingCv(false);
    }
  }

  if (loading) {
    return <p className="text-ink-muted">Loading teacher…</p>;
  }

  if (error || !profile) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-400">{error ?? "Teacher not found"}</p>
        <Link to="/admin/users" className="text-accent hover:underline">
          ← Users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={profile.fullName} description="Teacher profile & CV" />
      <Link to="/admin/users" className="text-sm text-accent hover:underline">
        ← Users
      </Link>

      <div className="rounded-xl border border-border bg-surface-elevated p-4">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-ink-muted">Email</dt>
            <dd className="mt-1">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-ink-muted">Phone</dt>
            <dd className="mt-1">{profile.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-ink-muted">Title</dt>
            <dd className="mt-1">{profile.title || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase text-ink-muted">Bio</dt>
            <dd className="mt-1 whitespace-pre-wrap">{profile.bio || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-surface-elevated p-4">
        <h2 className="font-display text-lg font-semibold">CV (optional)</h2>
        <p className="text-sm text-ink-muted">PDF only, up to 10MB. Not required at account create.</p>
        {profile.cvFileName ? (
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
          <p className="text-sm text-ink-muted">No CV on file.</p>
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
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
        >
          {uploadingCv
            ? "Uploading…"
            : profile.cvFileName
              ? "Replace CV"
              : "Upload CV"}
        </button>
      </div>
    </div>
  );
}
