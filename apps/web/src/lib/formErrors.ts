import { ApiError } from "@/lib/api";

export type FieldErrors = Record<string, string>;

type ZodFlatten = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
};

type FlattenedError = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};

/** Structural Zod schema shape so the web app need not depend on `zod` directly. */
type ParsableSchema<T> = {
  safeParse: (
    data: unknown,
  ) =>
    | { success: true; data: T }
    | { success: false; error: { flatten: () => FlattenedError } };
};

function isZodFlatten(value: unknown): value is ZodFlatten {
  return Boolean(value && typeof value === "object");
}

/** Map Zod flatten() / API VALIDATION_ERROR details → one message per field. */
export function fieldErrorsFromZodFlatten(details: unknown): FieldErrors {
  if (!isZodFlatten(details) || !details.fieldErrors) return {};
  const out: FieldErrors = {};
  for (const [key, messages] of Object.entries(details.fieldErrors)) {
    const first = messages?.find((m) => typeof m === "string" && m.trim());
    if (first) out[key] = first;
  }
  return out;
}

export function fieldErrorsFromZodError(error: {
  flatten: () => FlattenedError;
}): FieldErrors {
  return fieldErrorsFromZodFlatten(error.flatten());
}

export function parseWithSchema<T>(
  schema: ParsableSchema<T>,
  data: unknown,
): { ok: true; data: T } | { ok: false; fieldErrors: FieldErrors; formError: string | null } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const flat = result.error.flatten();
  return {
    ok: false,
    fieldErrors: fieldErrorsFromZodError(result.error),
    formError: flat.formErrors[0] ?? null,
  };
}

/** Non-field / business API errors for an in-form banner. */
export function formErrorFromApi(err: unknown, fallback = "Request failed"): string {
  if (err instanceof ApiError) {
    if (err.code === "VALIDATION_ERROR") {
      const fields = fieldErrorsFromZodFlatten(err.details);
      if (Object.keys(fields).length > 0) {
        return "Please fix the highlighted fields.";
      }
      if (isZodFlatten(err.details) && err.details.formErrors?.[0]) {
        return err.details.formErrors[0];
      }
    }
    return err.message || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Apply API error: prefer field map when VALIDATION_ERROR, else form banner. */
export function applyApiFormError(
  err: unknown,
  setFieldErrors: (errors: FieldErrors) => void,
  setFormError: (message: string | null) => void,
  fallback = "Request failed",
) {
  if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
    const fields = fieldErrorsFromZodFlatten(err.details);
    if (Object.keys(fields).length > 0) {
      setFieldErrors(fields);
      setFormError(null);
      return;
    }
  }
  setFieldErrors({});
  setFormError(formErrorFromApi(err, fallback));
}
