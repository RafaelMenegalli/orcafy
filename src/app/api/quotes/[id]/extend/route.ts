import { prisma } from "@/lib/prisma";
import { ApiError, json, parseBody, requireApiUserId, route } from "@/lib/api";
import { quoteExtendSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const userId = await requireApiUserId();
  const { id } = await params;
  const { extendHours } = await parseBody(req, quoteExtendSchema);

  const quote = await prisma.quote.findFirst({ where: { id, userId } });
  if (!quote) throw new ApiError(404, "Orçamento não encontrado.");
  if (quote.status === "APPROVED") throw new ApiError(409, "Orçamento já aprovado.");

  const base = Math.max(Date.now(), quote.expiresAt.getTime());
  const expiresAt = new Date(base + extendHours * 3600 * 1000);
  const status =
    quote.status === "EXPIRED" || quote.status === "REJECTED" ? (quote.viewsCount > 0 ? "VIEWED" : "SENT") : quote.status;

  const updated = await prisma.quote.update({ where: { id }, data: { expiresAt, status } });
  return json({ quote: updated });
});
