import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Copy, Eye, QrCode, Sparkles, Timer, CalendarClock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quoteInclude, quoteTotals, syncExpiration } from "@/lib/data";
import { formatBRL } from "@/lib/money";
import { cn, formatDateTime, formatDuration, formatPhone, timeAgo, whatsappLink } from "@/lib/format";
import { effectiveStatus, isOnlineNow } from "@/lib/quote";
import { describeEvent, EVENT_TONE, type RadarEventType } from "@/lib/radar";
import { approvedThanksMessage, followUpMessage, sendQuoteMessage } from "@/lib/messages";
import { getBaseUrl } from "@/lib/url";
import { PageHeader } from "@/components/page-header";
import { Card, StatusBadge } from "@/components/ui-static";
import { AutoRefresh } from "@/components/auto-refresh";
import { CopyLinkButton, QuoteActions, WhatsAppButton } from "@/components/quote-actions";

export const dynamic = "force-dynamic";

const ICONS: Record<RadarEventType, React.ComponentType<{ className?: string }>> = {
  VIEWED: Eye,
  TIME_SPENT: Clock,
  BUMP_TOGGLED: Sparkles,
  PIX_OPENED: QrCode,
  PIX_COPIED: Copy,
  APPROVED: CheckCircle2,
};

function expiresLabel(expiresAt: Date) {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return "Vencido";
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))} min`;
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)} dias`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await prisma.quote.findUnique({ where: { id }, select: { clientName: true } });
  return { title: q ? `Orçamento · ${q.clientName}` : "Orçamento" };
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const found = await prisma.quote.findFirst({ where: { id, userId: user.id }, include: quoteInclude });
  if (!found) notFound();
  const quote = await syncExpiration(found);

  const [events, baseUrl] = await Promise.all([
    prisma.quoteEvent.findMany({ where: { quoteId: id }, orderBy: { createdAt: "desc" }, take: 100 }),
    getBaseUrl(),
  ]);

  const status = effectiveStatus(quote);
  const totals = quoteTotals(quote);
  const url = `${baseUrl}/p/${quote.slug}`;
  const online = isOnlineNow(quote.lastViewedAt);
  const isOpen = status === "SENT" || status === "VIEWED" || status === "HOT";

  const sendHref = whatsappLink(
    quote.clientWhatsapp,
    quote.viewsCount > 0
      ? followUpMessage({ clientName: quote.clientName, title: quote.title, url, expiresAt: quote.expiresAt })
      : sendQuoteMessage({
          clientName: quote.clientName,
          providerName: user.name,
          businessName: user.businessName,
          title: quote.title,
          url,
          total: totals.total,
          expiresAt: quote.expiresAt,
        }),
  );

  return (
    <div className="animate-fade-in">
      <AutoRefresh />
      <PageHeader back="/app/orcamentos" title={quote.clientName} subtitle={quote.title} />

      {online && (
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-brand-600 px-4 py-3 text-white">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-white" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
          </span>
          <p className="text-sm font-bold">O cliente está com a proposta aberta agora</p>
        </div>
      )}

      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <StatusBadge status={status} />
            <p className="tabular mt-3 text-3xl font-extrabold tracking-tight">{formatBRL(totals.total)}</p>
            <p className="mt-0.5 text-sm text-ink-500">
              Sinal de {totals.pct}%: <span className="font-semibold text-ink-800">{formatBRL(totals.downPayment)}</span>
            </p>
          </div>
          {status === "APPROVED" && quote.approvedAt && (
            <div className="rounded-xl bg-brand-50 px-3 py-2 text-right text-xs text-brand-800">
              Aprovado
              <br />
              <span className="font-semibold">{formatDateTime(quote.approvedAt)}</span>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 border-t border-ink-100 pt-4 text-center">
          <Metric icon={Eye} value={String(quote.viewsCount)} label="aberturas" />
          <Metric icon={Clock} value={formatDuration(quote.totalTimeSeconds)} label="lendo" />
          <Metric icon={CalendarClock} value={quote.lastViewedAt ? timeAgo(quote.lastViewedAt).replace("há ", "") : "—"} label="último acesso" />
          <Metric icon={Timer} value={expiresLabel(quote.expiresAt)} label="validade" warn={status === "EXPIRED"} />
        </div>
      </Card>

      {isOpen && (
        <Card className="mt-3 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Link da proposta</p>
          <p className="mt-1 truncate font-mono text-sm text-ink-800">{url}</p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <WhatsAppButton href={sendHref} label={quote.viewsCount > 0 ? "Fazer follow-up" : "Enviar no WhatsApp"} />
            <CopyLinkButton url={url} />
          </div>
          <p className="mt-2 text-xs text-ink-500">Cliente: {formatPhone(quote.clientWhatsapp)}</p>
        </Card>
      )}

      <Card className="mt-3 divide-y divide-ink-100">
        <div className="p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-500">Itens</p>
          <ul className="space-y-2">
            {quote.items.map((it) => (
              <li key={it.id} className="flex justify-between gap-3 text-sm">
                <span className="text-ink-700">
                  {it.quantity > 1 && <span className="font-semibold">{it.quantity}× </span>}
                  {it.name}
                </span>
                <span className="tabular shrink-0 font-medium">{formatBRL(it.quantity * it.unitPrice)}</span>
              </li>
            ))}
          </ul>
        </div>
        {quote.bumps.length > 0 && (
          <div className="p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-500">Opcionais oferecidos</p>
            <ul className="space-y-2">
              {quote.bumps.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className={cn("flex items-center gap-2", b.selected ? "font-semibold text-brand-800" : "text-ink-500")}>
                    <span className={cn("h-2 w-2 rounded-full", b.selected ? "bg-brand-500" : "bg-ink-300")} />
                    {b.name}
                    {b.selected && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] text-brand-700">escolhido</span>}
                  </span>
                  <span className="tabular shrink-0">+{formatBRL(b.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="space-y-1 p-4 text-sm">
          {totals.discount > 0 && (
            <div className="flex justify-between text-ink-600">
              <span>Desconto</span>
              <span className="tabular">−{formatBRL(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="tabular">{formatBRL(totals.total)}</span>
          </div>
          <div className="flex justify-between text-ink-500">
            <span>Prazo</span>
            <span>{quote.deliveryTime}</span>
          </div>
        </div>
      </Card>

      <section className="mt-6">
        <h2 className="mb-3 text-base font-bold">Linha do tempo do Radar</h2>
        {events.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-sm text-ink-500 ring-1 ring-ink-100">
            O cliente ainda não abriu. Assim que ele tocar no link, você verá tudo aqui em tempo real.
          </p>
        ) : (
          <ol className="relative ml-4 border-l-2 border-ink-100 pl-6">
            {events.map((e) => {
              const Icon = ICONS[e.type];
              const tone = EVENT_TONE[e.type];
              return (
                <li key={e.id} className="relative pb-5 last:pb-0">
                  <span className={cn("absolute -left-[42px] flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-ink-50", tone.bg)}>
                    <Icon className={cn("h-4 w-4", tone.fg)} />
                  </span>
                  <p className={cn("text-sm text-ink-800", e.type === "APPROVED" && "font-bold text-brand-800")}>
                    {describeEvent(e, quote.clientName)}
                  </p>
                  <p className="text-xs text-ink-500">
                    {formatDateTime(e.createdAt)} · {timeAgo(e.createdAt)}
                  </p>
                </li>
              );
            })}
            <li className="relative">
              <span className="absolute -left-[38px] top-0.5 h-6 w-6 rounded-full bg-ink-200 ring-4 ring-ink-50" />
              <p className="text-sm text-ink-600">Orçamento criado</p>
              <p className="text-xs text-ink-500">{formatDateTime(quote.createdAt)}</p>
            </li>
          </ol>
        )}
      </section>

      <section className="mt-8">
        <QuoteActions
          quoteId={quote.id}
          slug={quote.slug}
          status={status}
          thanksHref={whatsappLink(quote.clientWhatsapp, approvedThanksMessage({ clientName: quote.clientName, title: quote.title }))}
        />
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
  warn,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  warn?: boolean;
}) {
  return (
    <div className="min-w-0">
      <Icon className={cn("mx-auto h-4 w-4", warn ? "text-rose-500" : "text-ink-400")} />
      <p className={cn("tabular mt-1 truncate text-sm font-bold", warn && "text-rose-600")}>{value}</p>
      <p className="truncate text-[11px] text-ink-500">{label}</p>
    </div>
  );
}
