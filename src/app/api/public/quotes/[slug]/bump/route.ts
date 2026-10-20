import { prisma } from "@/lib/prisma";
import { ApiError, json, parseBody, route } from "@/lib/api";
import { bumpToggleSchema } from "@/lib/validation";
import { isOpenStatus, loadPublicQuote } from "@/lib/public-quote";
import { quoteTotals } from "@/lib/data";

type Ctx = { params: Promise<{ slug: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const { slug } = await params;
  const { bumpId, selected } = await parseBody(req, bumpToggleSchema);
  const { quote, isOwner } = await loadPublicQuote(slug);

  const bump = quote.bumps.find((b) => b.id === bumpId);
  if (!bump) throw new ApiError(404, "Opcional não encontrado.");
  if (isOwner) return json({ ok: true, preview: true });
  if (!isOpenStatus(quote.status)) throw new ApiError(409, "Esta proposta não aceita mais alterações.");

  if (bump.selected !== selected) {
    await prisma.$transaction([
      prisma.quoteBump.update({ where: { id: bumpId }, data: { selected } }),
      prisma.quote.update({ where: { id: quote.id }, data: { status: "HOT", lastViewedAt: new Date() } }),
      prisma.quoteEvent.create({
        data: {
          quoteId: quote.id,
          type: "BUMP_TOGGLED",
          metadata: JSON.stringify({ bumpId, bumpName: bump.name, price: bump.price, selected }),
        },
      }),
    ]);
  }

  const totals = quoteTotals({
    ...quote,
    bumps: quote.bumps.map((b) => (b.id === bumpId ? { ...b, selected } : b)),
  });
  return json({ ok: true, totals });
});
