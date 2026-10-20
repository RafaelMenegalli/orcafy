import { prisma } from "@/lib/prisma";
import { ApiError, json, parseBody, requireApiUserId, route } from "@/lib/api";
import { quoteSchema } from "@/lib/validation";
import { generateSlug } from "@/lib/slug";
import { FREE_QUOTE_LIMIT } from "@/lib/quote";
import { isProActive } from "@/lib/plan";
import { expireOverdueQuotes, quoteInclude } from "@/lib/data";

export const GET = route(async () => {
  const userId = await requireApiUserId();
  await expireOverdueQuotes(userId);
  const quotes = await prisma.quote.findMany({
    where: { userId },
    include: quoteInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return json({ quotes });
});

async function uniqueSlug() {
  for (let attempt = 0; attempt < 6; attempt++) {
    const slug = generateSlug(attempt < 3 ? 7 : 9);
    const taken = await prisma.quote.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) return slug;
  }
  throw new ApiError(500, "Não foi possível gerar o link. Tente novamente.");
}

export const POST = route(async (req) => {
  const userId = await requireApiUserId();
  const data = await parseBody(req, quoteSchema);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true, quotesCreatedCount: true },
  });
  if (!user) throw new ApiError(401, "Sessão inválida.", "UNAUTHORIZED");
  if (!isProActive(user) && user.quotesCreatedCount >= FREE_QUOTE_LIMIT) {
    throw new ApiError(
      402,
      `Você atingiu o limite de ${FREE_QUOTE_LIMIT} orçamentos do plano grátis. Assine o PRO para enviar orçamentos ilimitados.`,
      "PLAN_LIMIT",
    );
  }

  const slug = await uniqueSlug();
  const expiresAt = new Date(Date.now() + data.validityHours * 3600 * 1000);

  const [quote] = await prisma.$transaction([
    prisma.quote.create({
      data: {
        slug,
        userId,
        clientName: data.clientName,
        clientWhatsapp: data.clientWhatsapp,
        title: data.title,
        description: data.description,
        deliveryTime: data.deliveryTime,
        warrantyText: data.warrantyText,
        discount: data.discount,
        downPaymentPercent: data.downPaymentPercent,
        status: "SENT",
        expiresAt,
        items: { create: data.items },
        bumps: { create: data.bumps.map((b) => ({ ...b, selected: false })) },
      },
      include: quoteInclude,
    }),
    prisma.user.update({ where: { id: userId }, data: { quotesCreatedCount: { increment: 1 } } }),
  ]);

  return json({ quote }, 201);
});
