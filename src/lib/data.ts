import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { calcQuoteTotals, effectiveStatus, isExpired } from "./quote";

export const quoteInclude = {
  items: { orderBy: { id: "asc" } },
  bumps: { orderBy: { id: "asc" } },
} satisfies Prisma.QuoteInclude;

export type QuoteWithParts = Prisma.QuoteGetPayload<{ include: typeof quoteInclude }>;

/** Persiste o status EXPIRED quando a validade passou (evita depender de cron). */
export async function syncExpiration<T extends { id: string; status: string; expiresAt: Date }>(quote: T): Promise<T> {
  if (quote.status !== "EXPIRED" && isExpired(quote)) {
    await prisma.quote.update({ where: { id: quote.id }, data: { status: "EXPIRED" } });
    return { ...quote, status: "EXPIRED" };
  }
  return quote;
}

/** Marca em lote os orçamentos vencidos de um usuário. */
export async function expireOverdueQuotes(userId: string) {
  await prisma.quote.updateMany({
    where: {
      userId,
      expiresAt: { lt: new Date() },
      status: { in: ["DRAFT", "SENT", "VIEWED", "HOT"] },
    },
    data: { status: "EXPIRED" },
  });
}

export function quoteTotals(q: QuoteWithParts) {
  return calcQuoteTotals({
    items: q.items,
    bumps: q.bumps,
    discount: q.discount,
    downPaymentPercent: q.downPaymentPercent,
  });
}

export async function getDashboardStats(userId: string) {
  await expireOverdueQuotes(userId);
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const quotes = await prisma.quote.findMany({
    where: { userId, createdAt: { gte: since } },
    include: quoteInclude,
  });

  let approvedValue = 0;
  let downPaymentValue = 0;
  let pipelineValue = 0;
  const counts = { total: quotes.length, viewed: 0, hot: 0, approved: 0, open: 0 };

  for (const q of quotes) {
    const status = effectiveStatus(q);
    const t = quoteTotals(q);
    if (q.viewsCount > 0) counts.viewed++;
    if (status === "HOT") counts.hot++;
    if (status === "APPROVED") {
      counts.approved++;
      approvedValue += t.total;
      downPaymentValue += t.downPayment;
    }
    if (status === "SENT" || status === "VIEWED" || status === "HOT") {
      counts.open++;
      pipelineValue += t.total;
    }
  }

  return {
    ...counts,
    openRate: counts.total ? Math.round((counts.viewed / counts.total) * 100) : 0,
    conversionRate: counts.total ? Math.round((counts.approved / counts.total) * 100) : 0,
    approvedValue,
    downPaymentValue,
    pipelineValue,
  };
}
