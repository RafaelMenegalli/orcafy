import { cn } from "@/lib/format";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-700",
        className,
      )}
      aria-hidden
    >
      <span className="h-[55%] w-[55%] rounded-full border-[3px] border-white" />
      <span className="absolute right-[18%] top-[18%] h-[22%] w-[22%] rounded-full bg-amber-400" />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink-900", className)}>
      <LogoMark />
      Orçafy
    </span>
  );
}
