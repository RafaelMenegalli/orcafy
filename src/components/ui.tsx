"use client";

import { forwardRef, useEffect, useId } from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/format";
import { sizeClass, variantClass, type ButtonSize, type ButtonVariant } from "@/lib/button-class";

/* ---------------------------------- Button --------------------------------- */


export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, block, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        variantClass[variant],
        sizeClass[size],
        block && "w-full",
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

/* ---------------------------------- Fields --------------------------------- */

type FieldProps = { label?: string; hint?: React.ReactNode; error?: string | null; className?: string };

export function Field({
  label,
  hint,
  error,
  className,
  htmlFor,
  children,
}: FieldProps & { htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      {children}
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : hint ? <p className="text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}

const inputBase =
  "block w-full rounded-xl border-0 bg-white px-3.5 text-ink-900 ring-1 ring-inset ring-ink-200 placeholder:text-ink-400 transition focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-ink-50 disabled:text-ink-500";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  FieldProps & { prefix?: string; suffix?: string; inputClassName?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, prefix, suffix, inputClassName, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} className={className} htmlFor={inputId}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-ink-500">{prefix}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn(inputBase, "h-12", prefix && "pl-10", suffix && "pr-12", error && "ring-rose-300", inputClassName)}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-ink-500">{suffix}</span>
        )}
      </div>
    </Field>
  );
});

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, rows = 3, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} className={className} htmlFor={inputId}>
      <textarea ref={ref} id={inputId} rows={rows} className={cn(inputBase, "py-3", error && "ring-rose-300")} {...props} />
    </Field>
  );
});

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & FieldProps;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, children, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} className={className} htmlFor={inputId}>
      <select ref={ref} id={inputId} className={cn(inputBase, "h-12 appearance-none pr-8")} {...props}>
        {children}
      </select>
    </Field>
  );
});

/* --------------------------------- Switch ---------------------------------- */

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50",
        checked ? "bg-brand-600" : "bg-ink-200",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

/* ---------------------------------- Chips ---------------------------------- */

export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition active:scale-95",
        active ? "bg-ink-900 text-white" : "bg-white text-ink-700 ring-1 ring-inset ring-ink-200 hover:bg-ink-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------- Bottom Sheet ------------------------------ */

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-ink-950/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full max-w-lg animate-fade-up flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-ink-200 sm:hidden" />
        <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-3">
          <h2 className="text-lg font-bold text-ink-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="border-t border-ink-100 px-5 py-4 pb-safe">{footer}</div>}
      </div>
    </div>
  );
}

