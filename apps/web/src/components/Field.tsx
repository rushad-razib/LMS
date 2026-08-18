import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  className?: string;
  children: ReactNode;
};

export function Field({ label, className, children }: FieldProps) {
  return (
    <label className={["grid gap-1 text-sm", className].filter(Boolean).join(" ")}>
      <span className="font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
