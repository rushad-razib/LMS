import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { UpdateSettingsInputSchema } from "@arva/shared";
import { api, ApiError } from "@/lib/api";
import {
  applyApiFormError,
  parseWithSchema,
  type FieldErrors,
} from "@/lib/formErrors";

export function AdminSettingsPage() {
  const [required, setRequired] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSettings()
      .then((s) => setRequired(s.emailVerificationRequired))
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setFieldErrors({});
    setFormError(null);

    const parsed = parseWithSchema(UpdateSettingsInputSchema, {
      emailVerificationRequired: required,
    });
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.formError);
      return;
    }

    try {
      const s = await api.updateSettings(parsed.data.emailVerificationRequired);
      setRequired(s.emailVerificationRequired);
      setMessage("Settings saved.");
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Save failed");
    }
  }

  if (loading) return <p className="text-ink-muted">Loading settings…</p>;

  return (
    <div className="max-w-xl space-y-4">
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
            {fieldErrors.emailVerificationRequired ? (
              <span className="mt-1 block text-xs text-red-400">
                {fieldErrors.emailVerificationRequired}
              </span>
            ) : null}
          </span>
        </label>
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
