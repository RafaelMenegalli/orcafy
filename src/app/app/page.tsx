import Link from "next/link";
import { AlertTriangle, ArrowRight, Flame, MessageCircle, Plus, TrendingUp, Wallet, Eye, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardStats, quoteInclude, quoteTotals } from "@/lib/data";
import { formatBRL } from "@/lib/money";
import { firstName, timeAgo, whatsappLink, formatDuration } from "@/lib/format";
import { FREE_QUOTE_LIMIT } from "@/lib/quote";
import { isProActive } from "@/lib/plan";
import { followUpMessage } from "@/lib/messages";
import { getBaseUrl } from "@/lib/url";
import { RadarFeed } from "@/components/radar-feed";
import { buttonClass } from "@/lib/button-class";

export const dynamic = "force-dynamic";
export const metadata = { title: "Radar" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, hotQuotes, events, baseUrl] = await Promise.all([
    getDashboardStats(user.id),
    prisma.quote.findMany({
      where: { userId: user.id, status: "HOT", expiresAt: { gt: new Date() } },
      include: quoteInclude,
      orderBy: { lastViewedAt: "desc" },
      take: 5,
    }),
    prisma.quoteEvent.findMany({
      where: { quote: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { quote: { select: { id: true, title: true, clientName: true, slug: true } } },
    }),
    getBaseUrl(),
  ]);
  const serverTime = new Date().toISOString();
  const online = await prisma.quote.findMany({
    where: { userId: user.id, lastViewedAt: { gte: new Date(Date.now() - 30_000) } },
    select: { id: true, title: true, clientName: true, lastViewedAt: true, viewsCount: true },
  });

  const usagePct = Math.min(100, Math.round((user.quotesCreatedCount / FREE_QUOTE_LIMIT) * 100));

  return (
    <div className="animate-fade-in">
      <header className="flex items-center justify-between pb-5 pt-6">
        <div>
          <p className="text-sm text-ink-500">{user.businessName}</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Olá, {firstName(user.name)} 👋</h1>
        </div>
        <Link href="/app/orcamentos/novo" className={buttonClass("primary", "md", "hidden sm:inline-flex")}>
          <Plus className="h-5 w-5" /> Novo orçamento
        </Link>
      </header>

      {!user.pixKey && (
        <Link
          href="/app/perfil#pix"
          className="mb-4 flex items-center gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 transition hover:bg-amber-100"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-amber-900">Configure sua chave Pix</p>
            <p className="text-amber-800">Sem ela, seus clientes não conseguem pagar o sinal na aprovação.</p>
          </div>
          <ArrowRight className="h-5 w-5 text-amber-700" />
        </Link>
      )}

      {!isProActive(user) && (
        <div className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-ink-100">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink-700">Plano Grátis</span>
            <span className="tabular text-ink-500">
              {Math.min(user.quotesCreatedCount, FREE_QUOTE_LIMIT)}/{FREE_QUOTE_LIMIT} orçamentos
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
            <div
              className={usagePct >= 100 ? "h-full rounded-full bg-rose-500" : "h-full rounded-full bg-brand-500"}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          {usagePct >= 60 && (
            <Link href="/app/perfil#plano" className="mt-2 inline-block text-xs font-semibold text-brand-700">
              Liberar orçamentos ilimitados com o PRO →
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={TrendingUp} label="Em negociação" value={formatBRL(stats.pipelineValue)} sub={`${stats.open} em aberto`} />
        <Stat icon={Eye} label="Taxa de abertura" value={`${stats.openRate}%`} sub={`${stats.viewed} de ${stats.total} abertos`} />
        <Stat
          icon={CheckCircle2}
          label="Aprovados (30d)"
          value={formatBRL(stats.approvedValue)}
          sub={`${stats.conversionRate}% de conversão`}
          highlight
        />
        <Stat icon={Wallet} label="Sinais via Pix" value={formatBRL(stats.downPaymentValue)} sub={`${stats.approved} ${stats.approved === 1 ? "aprovado" : "aprovados"}`} />
      </div>

      {hotQuotes.length > 0 && (
        <section className="mt-7">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-bold">Chame agora</h2>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">{hotQuotes.length}</span>
          </div>
          <div className="space-y-2">
            {hotQuotes.map((q) => {
              const totals = quoteTotals(q);
              const url = `${baseUrl}/p/${q.slug}`;
              return (
                <div key={q.id} className="rounded-2xl bg-white p-4 ring-1 ring-orange-200">
                  <Link href={`/app/orcamentos/${q.id}`} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{q.clientName}</p>
                        <p className="truncate text-sm text-ink-500">{q.title}</p>
                      </div>
                      <p className="tabular shrink-0 font-bold">{formatBRL(totals.total)}</p>
                    </div>
                    <p className="mt-2 text-xs text-ink-500">
                      {q.viewsCount} {q.viewsCount === 1 ? "abertura" : "aberturas"} · {formatDuration(q.totalTimeSeconds)} lendo ·
                      visto {timeAgo(q.lastViewedAt)}
                    </p>
                  </Link>
                  <a
                    href={whatsappLink(q.clientWhatsapp, followUpMessage({ clientName: q.clientName, title: q.title, url, expiresAt: q.expiresAt }))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass("primary", "md", "mt-3 w-full bg-[#25D366] hover:bg-[#1ebe5b] shadow-none")}
                  >
                    <MessageCircle className="h-5 w-5" /> Chamar {firstName(q.clientName)} no WhatsApp
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-7">
        <RadarFeed
          initialServerTime={serverTime}
          initialOnline={online.map((q) => ({ ...q, lastViewedAt: q.lastViewedAt?.toISOString() ?? null }))}
          initialEvents={events.map((e) => ({
            id: e.id,
            type: e.type,
            metadata: e.metadata,
            createdAt: e.createdAt.toISOString(),
            quote: e.quote,
          }))}
        />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? "rounded-2xl bg-ink-900 p-4 text-white" : "rounded-2xl bg-white p-4 ring-1 ring-ink-100"}>
      <div className={highlight ? "flex items-center gap-1.5 text-xs text-ink-300" : "flex items-center gap-1.5 text-xs text-ink-500"}>
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="tabular mt-1.5 truncate text-lg font-extrabold">{value}</p>
      <p className={highlight ? "mt-0.5 text-xs text-brand-300" : "mt-0.5 text-xs text-ink-500"}>{sub}</p>
    </div>
  );
}
