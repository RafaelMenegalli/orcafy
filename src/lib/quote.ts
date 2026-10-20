import { round2 } from "./money";

export type QuoteStatusValue = "DRAFT" | "SENT" | "VIEWED" | "HOT" | "APPROVED" | "REJECTED" | "EXPIRED";

type ItemLike = { quantity: number; unitPrice: number };
type BumpLike = { price: number; selected: boolean };

export function calcQuoteTotals(input: {
  items: ItemLike[];
  bumps: BumpLike[];
  discount: number;
  downPaymentPercent: number;
}) {
  const itemsTotal = round2(input.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0));
  const bumpsTotal = round2(input.bumps.filter((b) => b.selected).reduce((s, b) => s + b.price, 0));
  const gross = round2(itemsTotal + bumpsTotal);
  const discount = round2(Math.min(Math.max(input.discount || 0, 0), gross));
  const total = round2(gross - discount);
  const pct = Math.min(Math.max(input.downPaymentPercent, 0), 100);
  const downPayment = round2((total * pct) / 100);
  return { itemsTotal, bumpsTotal, gross, discount, total, downPayment, remaining: round2(total - downPayment), pct };
}

export function isExpired(q: { status: string; expiresAt: Date | string }) {
  if (q.status === "APPROVED" || q.status === "REJECTED") return false;
  return new Date(q.expiresAt).getTime() < Date.now();
}

/** Status efetivo (considera a validade sem precisar de cron). */
export function effectiveStatus(q: { status: string; expiresAt: Date | string }): QuoteStatusValue {
  if (isExpired(q)) return "EXPIRED";
  return q.status as QuoteStatusValue;
}

/** Regras do Radar: quando um orçamento vira "HOT". */
export const HOT_RULES = { minViews: 3, minSeconds: 120 };

export function shouldBeHot(q: { viewsCount: number; totalTimeSeconds: number }) {
  return q.viewsCount >= HOT_RULES.minViews || q.totalTimeSeconds >= HOT_RULES.minSeconds;
}

export const STATUS_META: Record<QuoteStatusValue, { label: string; tone: string; dot: string }> = {
  DRAFT: { label: "Rascunho", tone: "bg-ink-100 text-ink-600", dot: "bg-ink-400" },
  SENT: { label: "Enviado", tone: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  VIEWED: { label: "Visualizado", tone: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  HOT: { label: "Quente", tone: "bg-orange-50 text-orange-700", dot: "bg-orange-500" },
  APPROVED: { label: "Aprovado", tone: "bg-brand-50 text-brand-700", dot: "bg-brand-500" },
  REJECTED: { label: "Recusado", tone: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  EXPIRED: { label: "Expirado", tone: "bg-ink-100 text-ink-500", dot: "bg-ink-400" },
};

export const FREE_QUOTE_LIMIT = 5;

/** Um cliente está "na página agora" se houve sinal de vida nos últimos 30s. */
export const ONLINE_WINDOW_MS = 30_000;
export function isOnlineNow(lastViewedAt: Date | string | null | undefined) {
  if (!lastViewedAt) return false;
  return Date.now() - new Date(lastViewedAt).getTime() < ONLINE_WINDOW_MS;
}
