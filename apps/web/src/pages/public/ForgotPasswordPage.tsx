import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ForgotPasswordInputSchema } from "@arva/shared";
import { Field } from "@/components/Field";
import { Seo } from "@/components/Seo";
import { api } from "@/lib/api";
import {
  applyApiFormError,
  parseWithSchema,
  type FieldErrors,
} from "@/lib/formErrors";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setFieldErrors({});
    setFormError(null);
    setMessage(null);

    const parsed = parseWithSchema(ForgotPasswordInputSchema, { email });
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.formError);
      setPending(false);
      return;
    }

    try {
      await api.forgotPassword(parsed.data.email);
      setMessage("If that email exists, a reset link was sent.");
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Seo title="Forgot password" path="/forgot-password" noindex />
      <h1 className="font-display text-3xl font-bold">Forgot password</h1>
      <form noValidate onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Email" error={fieldErrors.email}>
          <input
            type="email"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 outline-none ring-accent focus:ring-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-fg"
        >
          Send reset link
        </button>
      </form>
      <p className="mt-4 text-sm">
        <Link to="/login" className="text-accent hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
