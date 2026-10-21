import { cn } from "@/lib/format";

export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/orcafy-mark.png"
      alt=""
      aria-hidden
      width={32}
      height={32}
      className={cn("h-8 w-8 shrink-0 rounded-[10px] bg-[#0a0e1a] shadow-sm ring-1 ring-black/5", className)}
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink-900", className)}>
      <LogoMark />
      <span>
        Orça<span className="text-brand-600">fy</span>
      </span>
    </span>
  );
}
