import { cn } from "./format";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "dark";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

export const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20",
  secondary: "bg-ink-100 text-ink-800 hover:bg-ink-200",
  outline: "bg-white text-ink-800 ring-1 ring-inset ring-ink-200 hover:bg-ink-50",
  ghost: "text-ink-600 hover:bg-ink-100",
  danger: "bg-rose-50 text-rose-700 hover:bg-rose-100",
  dark: "bg-ink-900 text-white hover:bg-ink-800",
};

export const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm rounded-xl gap-1.5",
  md: "h-11 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-5 text-base rounded-2xl gap-2",
  xl: "h-14 px-6 text-base rounded-2xl gap-2.5",
};

/** Classes de botão para usar em <Link>/<a> (funciona em server e client components). */
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string) {
  return cn(
    "inline-flex select-none items-center justify-center font-semibold transition active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
    variantClass[variant],
    sizeClass[size],
    extra,
  );
}
