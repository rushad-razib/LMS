import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { ContactLeadInputSchema } from "@arva/shared";
import { api, type PublicWebsiteSettings } from "@/lib/api";
import {
  applyApiFormError,
  parseWithSchema,
  type FieldErrors,
} from "@/lib/formErrors";
import { Field } from "@/components/Field";
import { Seo } from "@/components/Seo";

export function ContactPage() {
  const [settings, setSettings] = useState<PublicWebsiteSettings | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getPublicSettings()
      .then((r) => setSettings(r.settings))
      .catch(() => setSettings(null));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setSuccess(false);
    const parsed = parseWithSchema(ContactLeadInputSchema, {
      name,
      email,
      phone: phone.trim() || null,
      subject,
      message,
    });
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.formError);
      return;
    }
    setSaving(true);
    try {
      await api.submitContact(parsed.data);
      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Could not send message");
    } finally {
      setSaving(false);
    }
  }

  const wa = settings?.whatsappNumber?.replace(/\D/g, "");

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2">
      <Seo
        title="Contact"
        description="Contact AR Visionary Academy — phone, WhatsApp, map, and inquiry form."
        path="/contact"
      />
      <div>
        <h1 className="font-display text-3xl font-semibold">Contact</h1>
        <p className="mt-2 text-ink-muted">
          Reach the academy team — we usually reply within one business day.
        </p>
        <dl className="mt-6 space-y-3 text-sm">
          {settings?.contactPhone ? (
            <div>
              <dt className="font-medium text-ink-muted">Phone</dt>
              <dd>{settings.contactPhone}</dd>
            </div>
          ) : null}
          {settings?.contactEmail ? (
            <div>
              <dt className="font-medium text-ink-muted">Email</dt>
              <dd>{settings.contactEmail}</dd>
            </div>
          ) : null}
          {settings?.address ? (
            <div>
              <dt className="font-medium text-ink-muted">Address</dt>
              <dd className="whitespace-pre-wrap">{settings.address}</dd>
            </div>
          ) : null}
          {settings?.businessHours ? (
            <div>
              <dt className="font-medium text-ink-muted">Hours</dt>
              <dd className="whitespace-pre-wrap">{settings.businessHours}</dd>
            </div>
          ) : null}
        </dl>
        {wa ? (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
          >
            WhatsApp
          </a>
        ) : null}
        {settings?.mapEmbedHtml ? (
          <div
            className="mt-6 overflow-hidden rounded-xl border border-border [&_iframe]:h-56 [&_iframe]:w-full"
            dangerouslySetInnerHTML={{ __html: settings.mapEmbedHtml }}
          />
        ) : null}
      </div>

      <form
        noValidate
        onSubmit={onSubmit}
        className="space-y-3 rounded-xl border border-border bg-surface-elevated p-5"
      >
        <Field label="Name" error={fieldErrors.name}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          />
        </Field>
        <Field label="Email" error={fieldErrors.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          />
        </Field>
        <Field label="Phone" error={fieldErrors.phone}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          />
        </Field>
        <Field label="Subject" error={fieldErrors.subject}>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          />
        </Field>
        <Field label="Message" error={fieldErrors.message}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          />
        </Field>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {success ? (
          <p className="text-sm text-green-700">
            Thanks — your message was received.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
        >
          {saving ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}
