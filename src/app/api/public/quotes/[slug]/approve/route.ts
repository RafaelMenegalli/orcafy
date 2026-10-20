import { prisma } from "@/lib/prisma";
import { ApiError, json, route } from "@/lib/api";
import { isOpenStatus, loadPublicQuote } from "@/lib/public-quote";
import { quoteTotals } from "@/lib/data";

type Ctx = { params: Promise<{ slug: string }> };

export const POST = route<Ctx>(async (_req, { params }) => {
  const { slug } = await params;
  const { quote, isOwner } = await loadPublicQuote(slug);

  if (isOwner) {
    throw new ApiError(403, "Modo pré-visualização: só o cliente pode aprovar pelo link.", "PREVIEW");
  }
  if (quote.status === "APPROVED") return json({ ok: true, alreadyApproved: true });
  if (quote.status === "EXPIRED") throw new ApiError(409, "Esta proposta expirou. Peça uma nova ao prestador.", "EXPIRED");
  if (!isOpenStatus(quote.status)) throw new ApiError(409, "Esta proposta não está mais disponível.");

  const totals = quoteTotals(quote);
  const now = new Date();
  await prisma.$transaction([
    prisma.quote.update({
      where: { id: quote.id },
      data: { status: "APPROVED", approvedAt: now, lastViewedAt: now },
    }),
    prisma.quoteEvent.create({
      data: {
        quoteId: quote.id,
        type: "APPROVED",
        metadata: JSON.stringify({
          total: totals.total,
          downPayment: totals.downPayment,
          bumps: quote.bumps.filter((b) => b.selected).map((b) => b.name),
        }),
      },
    }),
  ]);

  return json({ ok: true, totals });
});
