import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RegisterInputSchema } from "@arva/shared";
import { Field } from "@/components/Field";
import { PasswordField } from "@/components/PasswordField";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  applyApiFormError,
  parseWithSchema,
  type FieldErrors,
} from "@/lib/formErrors";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setFieldErrors({});
    setFormError(null);

    const parsed = parseWithSchema(RegisterInputSchema, {
      fullName,
      email,
      password,
    });
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.formError);
      setPending(false);
      return;
    }

    try {
      const user = await register(
        parsed.data.fullName,
        parsed.data.email,
        parsed.data.password,
      );
      if (!user.canAccessStudentPortal) {
        navigate("/verify-email", { replace: true });
        return;
      }
      navigate("/student", { replace: true });
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Registration failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Register</h1>
      <p className="mt-2 text-ink-muted">Create a student account to buy and join courses.</p>
      <form noValidate onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Full name" error={fieldErrors.fullName}>
          <input
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 outline-none ring-accent focus:ring-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Field>
        <Field label="Email" error={fieldErrors.email}>
          <input
            type="email"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 outline-none ring-accent focus:ring-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <PasswordField
          label="Password"
          value={password}
          onValueChange={setPassword}
          error={fieldErrors.password}
        />
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-fg disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink-muted">
        Already have an account?{" "}
        <Link to="/login" className="text-accent hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
