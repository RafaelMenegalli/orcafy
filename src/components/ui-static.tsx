import { cn } from "@/lib/format";
import { STATUS_META, type QuoteStatusValue } from "@/lib/quote";

/* ---------------------------------- Card ----------------------------------- */

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl bg-white shadow-card ring-1 ring-ink-100", className)} {...props}>
      {children}
    </div>
  );
}

/* --------------------------------- Badges ---------------------------------- */

export function StatusBadge({ status, className }: { status: QuoteStatusValue; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.tone,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot, status === "HOT" && "animate-pulse")} />
      {meta.label}
    </span>
  );
}

/* ------------------------------ Empty state -------------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-ink-200 px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
        <Icon className="h-6 w-6 text-brand-600" />
      </div>
      <h3 className="font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
