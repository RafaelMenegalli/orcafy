import { prisma } from "@/lib/prisma";
import { ApiError, json, parseBody, requireApiUserId, route } from "@/lib/api";
import { quoteStatusSchema } from "@/lib/validation";
import { quoteInclude, quoteTotals, syncExpiration } from "@/lib/data";

type Ctx = { params: Promise<{ id: string }> };

async function ownedQuote(id: string, userId: string) {
  const quote = await prisma.quote.findFirst({ where: { id, userId }, include: quoteInclude });
  if (!quote) throw new ApiError(404, "Orçamento não encontrado.");
  return syncExpiration(quote);
}

export const GET = route<Ctx>(async (_req, { params }) => {
  const userId = await requireApiUserId();
  const { id } = await params;
  const quote = await ownedQuote(id, userId);
  const events = await prisma.quoteEvent.findMany({
    where: { quoteId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return json({ quote, events, totals: quoteTotals(quote) });
});

export const PATCH = route<Ctx>(async (req, { params }) => {
  const userId = await requireApiUserId();
  const { id } = await params;
  const quote = await ownedQuote(id, userId);
  const { status } = await parseBody(req, quoteStatusSchema);

  if (status === "APPROVED") {
    if (quote.status === "APPROVED") return json({ quote });
    const totals = quoteTotals(quote);
    const [updated] = await prisma.$transaction([
      prisma.quote.update({ where: { id }, data: { status: "APPROVED", approvedAt: new Date() } }),
      prisma.quoteEvent.create({
        data: {
          quoteId: id,
          type: "APPROVED",
          metadata: JSON.stringify({ total: totals.total, downPayment: totals.downPayment, manual: true }),
        },
      }),
    ]);
    return json({ quote: updated });
  }

  if (status === "REJECTED") {
    const updated = await prisma.quote.update({ where: { id }, data: { status: "REJECTED" } });
    return json({ quote: updated });
  }

  // Reabrir (status SENT): volta ao estágio adequado do funil.
  if (quote.expiresAt.getTime() < Date.now()) {
    throw new ApiError(409, "A proposta está vencida. Estenda a validade para reabrir.", "EXPIRED");
  }
  const reopened = await prisma.quote.update({
    where: { id },
    data: { status: quote.viewsCount > 0 ? "VIEWED" : "SENT", approvedAt: null },
  });
  return json({ quote: reopened });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const userId = await requireApiUserId();
  const { id } = await params;
  await ownedQuote(id, userId);
  await prisma.quote.delete({ where: { id } });
  return json({ ok: true });
});
