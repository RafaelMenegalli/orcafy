import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, json, parseBody, requireApiUserId, route } from "@/lib/api";
import { linkPendingEvents } from "@/lib/billing";
import { isProActive } from "@/lib/plan";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Informe o e-mail usado na compra."),
  refId: z.string().trim().min(3, "Informe o código do pedido.").max(60),
});

/**
 * Vincula uma compra feita com outro e-mail à conta logada.
 * Exige e-mail + código do pedido (refId) para comprovar a posse da compra.
 */
export const POST = route(async (req) => {
  const userId = await requireApiUserId();
  const { email, refId } = await parseBody(req, schema);

  const match = await prisma.paymentEvent.findFirst({
    where: { email, refId: { equals: refId, mode: "insensitive" } },
    select: { userId: true },
  });
  if (!match) {
    throw new ApiError(404, "Não encontramos uma compra com esse e-mail e código. Confira os dados no e-mail da Cakto.");
  }
  if (match.userId && match.userId !== userId) {
    throw new ApiError(409, "Esta compra já está vinculada a outra conta.");
  }

  await linkPendingEvents(userId, email);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true },
  });
  return json({ ok: true, pro: isProActive(user) });
});
