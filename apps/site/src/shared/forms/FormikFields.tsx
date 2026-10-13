import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ErrorMessage, Field } from "formik";

interface FormikFieldProps extends ComponentPropsWithoutRef<"input"> {
  name: string;
  label: string;
}

export function FormikField({ name, label, type = "text", ...inputProps }: FormikFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider opacity-70">{label}</span>
      <Field name={name} type={type} className="fk-input disabled:cursor-not-allowed disabled:opacity-60" {...inputProps} />
      <ErrorMessage name={name} component="div" className="mt-1 text-xs text-destructive" />
    </label>
  );
}

export function FormikSelect({
  name,
  label,
  options,
  disabled,
  helperText,
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  helperText?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider opacity-70">{label}</span>
      <Field name={name} as="select" className="fk-input disabled:cursor-not-allowed disabled:opacity-60" disabled={disabled}>
        <option value="">Sélectionnez une option</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Field>
      {helperText && <p className="mt-1.5 text-xs opacity-60">{helperText}</p>}
      <ErrorMessage name={name} component="div" className="mt-1 text-xs text-destructive" />
    </label>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function FormikFieldStyles() {
  return (
    <style>{`.fk-input { width: 100%; padding: 0.75rem 0.875rem; border-radius: 0.625rem; border: 1px solid var(--color-border); background: var(--color-card); color: var(--color-foreground); font-size: 0.9rem; outline: none; transition: all 0.2s; } .fk-input:focus { border-color: var(--sacred-red); box-shadow: 0 0 0 3px var(--ring); } .fk-input:disabled { cursor: not-allowed; opacity: 0.6; }`}</style>
  );
}
