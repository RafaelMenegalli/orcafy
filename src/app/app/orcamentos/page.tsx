import Link from "next/link";
import { Eye, FileText, Plus, Search, Clock } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expireOverdueQuotes, quoteInclude, quoteTotals } from "@/lib/data";
import { formatBRL } from "@/lib/money";
import { cn, timeAgo } from "@/lib/format";
import { effectiveStatus, type QuoteStatusValue } from "@/lib/quote";
import { PageHeader } from "@/components/page-header";
import { EmptyState, StatusBadge } from "@/components/ui-static";
import { buttonClass } from "@/lib/button-class";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orçamentos" };

const FILTERS: { key: string; label: string; statuses?: QuoteStatusValue[] }[] = [
  { key: "todos", label: "Todos" },
  { key: "abertos", label: "Em aberto", statuses: ["SENT", "VIEWED", "HOT"] },
  { key: "quentes", label: "🔥 Quentes", statuses: ["HOT"] },
  { key: "aprovados", label: "Aprovados", statuses: ["APPROVED"] },
  { key: "perdidos", label: "Perdidos", statuses: ["REJECTED", "EXPIRED"] },
];

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ f?: string; q?: string }> }) {
  const user = await requireUser();
  const { f = "todos", q = "" } = await searchParams;
  await expireOverdueQuotes(user.id);

  const filter = FILTERS.find((x) => x.key === f) ?? FILTERS[0];
  const term = q.trim();
  const where: Prisma.QuoteWhereInput = {
    userId: user.id,
    ...(filter.statuses ? { status: { in: filter.statuses } } : {}),
    ...(term
      ? {
          OR: [
            { clientName: { contains: term, mode: "insensitive" } },
            { title: { contains: term, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const quotes = await prisma.quote.findMany({ where, include: quoteInclude, orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Orçamentos"
        subtitle={`${quotes.length} ${quotes.length === 1 ? "orçamento" : "orçamentos"}`}
        action={
          <Link href="/app/orcamentos/novo" className={buttonClass("primary", "sm")}>
            <Plus className="h-4 w-4" /> Novo
          </Link>
        }
      />

      <form className="relative mb-3" action="/app/orcamentos">
        <input type="hidden" name="f" value={filter.key} />
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          name="q"
          defaultValue={term}
          placeholder="Buscar por cliente ou serviço"
          className="h-12 w-full rounded-xl border-0 bg-white pl-10 pr-3 ring-1 ring-inset ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </form>

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((x) => (
          <Link
            key={x.key}
            href={`/app/orcamentos?f=${x.key}${term ? `&q=${encodeURIComponent(term)}` : ""}`}
            className={cn(
              "inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium transition",
              x.key === filter.key ? "bg-ink-900 text-white" : "bg-white text-ink-700 ring-1 ring-inset ring-ink-200",
            )}
          >
            {x.label}
          </Link>
        ))}
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={term || filter.statuses ? "Nada encontrado" : "Nenhum orçamento ainda"}
          description={
            term || filter.statuses
              ? "Tente outro filtro ou termo de busca."
              : "Crie seu primeiro orçamento interativo em 60 segundos e acompanhe pelo Radar."
          }
          action={
            !term && !filter.statuses ? (
              <Link href="/app/orcamentos/novo" className={buttonClass("primary", "lg")}>
                <Plus className="h-5 w-5" /> Criar orçamento
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {quotes.map((quote) => {
            const status = effectiveStatus(quote);
            const totals = quoteTotals(quote);
            return (
              <li key={quote.id}>
                <Link
                  href={`/app/orcamentos/${quote.id}`}
                  className={cn(
                    "block rounded-2xl bg-white p-4 ring-1 ring-ink-100 transition hover:ring-ink-200 active:scale-[0.99]",
                    status === "HOT" && "ring-orange-200",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900">{quote.clientName}</p>
                      <p className="truncate text-sm text-ink-500">{quote.title}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular font-bold">{formatBRL(totals.total)}</p>
                      <StatusBadge status={status} className="mt-1" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> {quote.viewsCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {quote.lastViewedAt ? `visto ${timeAgo(quote.lastViewedAt)}` : `enviado ${timeAgo(quote.createdAt)}`}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
