import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ResetPasswordInputSchema } from "@arva/shared";
import { PasswordField } from "@/components/PasswordField";
import { api } from "@/lib/api";
import {
  applyApiFormError,
  parseWithSchema,
  type FieldErrors,
} from "@/lib/formErrors";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
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

    const parsed = parseWithSchema(ResetPasswordInputSchema, { token, password });
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.formError);
      setPending(false);
      return;
    }

    try {
      await api.resetPassword(parsed.data.token, parsed.data.password);
      setMessage("Password updated. You can log in.");
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Reset failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Reset password</h1>
      {!token ? (
        <p className="mt-4 text-sm text-red-600">Missing token.</p>
      ) : (
        <form noValidate onSubmit={onSubmit} className="mt-8 space-y-4">
          <PasswordField
            label="New password"
            value={password}
            onValueChange={setPassword}
            error={fieldErrors.password}
          />
          {fieldErrors.token ? (
            <p className="text-sm text-red-600">{fieldErrors.token}</p>
          ) : null}
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-fg"
          >
            Update password
          </button>
        </form>
      )}
      <p className="mt-4 text-sm">
        <Link to="/login" className="text-accent hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
