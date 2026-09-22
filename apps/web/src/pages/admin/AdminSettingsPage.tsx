import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { UpdateSettingsInputSchema } from "@arva/shared";
import { api, ApiError, type WebsiteSettings } from "@/lib/api";
import {
  applyApiFormError,
  parseWithSchema,
  type FieldErrors,
} from "@/lib/formErrors";
import { Field } from "@/components/Field";

const empty: WebsiteSettings = {
  emailVerificationRequired: true,
  siteName: null,
  headerLogoKey: null,
  headerLogoUrl: null,
  footerLogoKey: null,
  footerLogoUrl: null,
  footerCopyright: null,
  contactPhone: null,
  contactEmail: null,
  address: null,
  businessHours: null,
  whatsappNumber: null,
  facebookUrl: null,
  instagramUrl: null,
  youtubeUrl: null,
  mapEmbedHtml: null,
  announcementBar: null,
};

export function AdminSettingsPage() {
  const [form, setForm] = useState<WebsiteSettings>(empty);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<"header" | "footer" | null>(
    null,
  );

  useEffect(() => {
    api
      .getSettings()
      .then(setForm)
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  function setField<K extends keyof WebsiteSettings>(key: K, value: WebsiteSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadLogo(slot: "header" | "footer", file: File | undefined) {
    if (!file) return;
    setUploadingSlot(slot);
    setMessage(null);
    setFormError(null);
    try {
      const { settings } = await api.adminUploadSettingsLogo(slot, file);
      setForm(settings);
      setMessage(`${slot === "header" ? "Header" : "Footer"} logo uploaded.`);
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Logo upload failed");
    } finally {
      setUploadingSlot(null);
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setFieldErrors({});
    setFormError(null);

    const parsed = parseWithSchema(UpdateSettingsInputSchema, {
      emailVerificationRequired: form.emailVerificationRequired,
      siteName: form.siteName ?? "",
      footerCopyright: form.footerCopyright ?? "",
      contactPhone: form.contactPhone ?? "",
      contactEmail: form.contactEmail ?? "",
      address: form.address ?? "",
      businessHours: form.businessHours ?? "",
      whatsappNumber: form.whatsappNumber ?? "",
      facebookUrl: form.facebookUrl ?? "",
      instagramUrl: form.instagramUrl ?? "",
      youtubeUrl: form.youtubeUrl ?? "",
      mapEmbedHtml: form.mapEmbedHtml ?? "",
      announcementBar: form.announcementBar ?? "",
    });
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.formError);
      return;
    }

    try {
      const s = await api.updateSettings(parsed.data);
      setForm(s);
      setMessage("Settings saved.");
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Save failed");
    }
  }

  if (loading) return <p className="text-ink-muted">Loading settings…</p>;

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-semibold">Website settings</h1>
      {loadError ? <p className="text-sm text-red-400">{loadError}</p> : null}
      <form
        noValidate
        onSubmit={save}
        className="space-y-4 rounded-xl border border-border bg-surface-elevated p-4"
      >
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.emailVerificationRequired}
            onChange={(e) => setField("emailVerificationRequired", e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Require email verification</span>
            <span className="mt-1 block text-ink-muted">
              When on, students must verify email before the student portal.
            </span>
          </span>
        </label>

        <div className="space-y-3 border-t border-border pt-4">
          <h2 className="font-display text-lg font-semibold">Branding</h2>
          <p className="text-sm text-ink-muted">
            Site name is shown when a logo is not set. Logos upload immediately
            (PNG, JPEG, or WebP, max 2MB).
          </p>

          <Field label="Site name" error={fieldErrors.siteName}>
            <input
              value={form.siteName ?? ""}
              onChange={(e) => setField("siteName", e.target.value || null)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="AR Visionary Academy"
            />
          </Field>

          <Field label="Header logo">
            {form.headerLogoUrl ? (
              <img
                src={form.headerLogoUrl}
                alt="Header logo preview"
                className="mb-2 h-10 max-w-[200px] object-contain"
              />
            ) : null}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploadingSlot !== null}
              onChange={(e) => {
                void uploadLogo("header", e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {uploadingSlot === "header" ? (
              <p className="mt-1 text-sm text-ink-muted">Uploading…</p>
            ) : null}
          </Field>

          <Field label="Footer logo">
            {form.footerLogoUrl ? (
              <img
                src={form.footerLogoUrl}
                alt="Footer logo preview"
                className="mb-2 h-10 max-w-[200px] object-contain"
              />
            ) : null}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploadingSlot !== null}
              onChange={(e) => {
                void uploadLogo("footer", e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {uploadingSlot === "footer" ? (
              <p className="mt-1 text-sm text-ink-muted">Uploading…</p>
            ) : null}
          </Field>

          <Field label="Footer copyright" error={fieldErrors.footerCopyright}>
            <textarea
              value={form.footerCopyright ?? ""}
              onChange={(e) => setField("footerCopyright", e.target.value || null)}
              rows={2}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="© 2026 AR Visionary Academy · AR Ventures"
            />
          </Field>
        </div>

        <Field label="Announcement bar" error={fieldErrors.announcementBar}>
          <input
            value={form.announcementBar ?? ""}
            onChange={(e) => setField("announcementBar", e.target.value || null)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            placeholder="Shown at top of public pages"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Contact phone" error={fieldErrors.contactPhone}>
            <input
              value={form.contactPhone ?? ""}
              onChange={(e) => setField("contactPhone", e.target.value || null)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
          </Field>
          <Field label="Contact email" error={fieldErrors.contactEmail}>
            <input
              value={form.contactEmail ?? ""}
              onChange={(e) => setField("contactEmail", e.target.value || null)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
          </Field>
          <Field label="WhatsApp number" error={fieldErrors.whatsappNumber}>
            <input
              value={form.whatsappNumber ?? ""}
              onChange={(e) => setField("whatsappNumber", e.target.value || null)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="8801XXXXXXXXX"
            />
          </Field>
        </div>

        <Field label="Address" error={fieldErrors.address}>
          <textarea
            value={form.address ?? ""}
            onChange={(e) => setField("address", e.target.value || null)}
            rows={2}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          />
        </Field>
        <Field label="Business hours" error={fieldErrors.businessHours}>
          <textarea
            value={form.businessHours ?? ""}
            onChange={(e) => setField("businessHours", e.target.value || null)}
            rows={2}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Facebook URL" error={fieldErrors.facebookUrl}>
            <input
              value={form.facebookUrl ?? ""}
              onChange={(e) => setField("facebookUrl", e.target.value || null)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
          </Field>
          <Field label="Instagram URL" error={fieldErrors.instagramUrl}>
            <input
              value={form.instagramUrl ?? ""}
              onChange={(e) => setField("instagramUrl", e.target.value || null)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
          </Field>
          <Field label="YouTube URL" error={fieldErrors.youtubeUrl}>
            <input
              value={form.youtubeUrl ?? ""}
              onChange={(e) => setField("youtubeUrl", e.target.value || null)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
          </Field>
        </div>

        <Field label="Map embed HTML" error={fieldErrors.mapEmbedHtml}>
          <textarea
            value={form.mapEmbedHtml ?? ""}
            onChange={(e) => setField("mapEmbedHtml", e.target.value || null)}
            rows={3}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs"
            placeholder="<iframe …>"
          />
        </Field>

        {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
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
