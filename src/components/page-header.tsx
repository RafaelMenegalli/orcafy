import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  back?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 pb-5 pt-6">
      <div className="flex min-w-0 items-start gap-2">
        {back && (
          <Link
            href={back}
            aria-label="Voltar"
            className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
        )}
        <div className="min-w-0 pt-1">
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-ink-900">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
