import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LoginInputSchema } from "@arva/shared";
import { Field } from "@/components/Field";
import { PasswordField } from "@/components/PasswordField";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  applyApiFormError,
  parseWithSchema,
  type FieldErrors,
} from "@/lib/formErrors";

function portalForRole(role: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "TEACHER") return "/teacher";
  return "/student";
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

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

    const parsed = parseWithSchema(LoginInputSchema, { email, password });
    if (!parsed.ok) {
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.formError);
      setPending(false);
      return;
    }

    try {
      const user = await login(parsed.data.email, parsed.data.password);
      if (user.role === "STUDENT" && !user.canAccessStudentPortal) {
        navigate("/verify-email", { replace: true });
        return;
      }
      navigate(from || portalForRole(user.role), { replace: true });
    } catch (err) {
      applyApiFormError(err, setFieldErrors, setFormError, "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Seo title="Login" path="/login" noindex />
      <h1 className="font-display text-3xl font-bold">Login</h1>
      <p className="mt-2 text-ink-muted">Sign in to your AR Visionary Academy account.</p>
      <form noValidate onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Email" error={fieldErrors.email}>
          <input
            type="email"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-ink outline-none ring-accent focus:ring-2"
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
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink-muted">
        <Link to="/forgot-password" className="text-accent hover:underline">
          Forgot password?
        </Link>
        {" · "}
        <Link to="/register" className="text-accent hover:underline">
          Create student account
        </Link>
      </p>
    </div>
  );
}
