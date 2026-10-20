import { prisma } from "@/lib/prisma";
import { ApiError, json, parseBody, route } from "@/lib/api";
import { createSessionCookie, hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { linkPendingEvents } from "@/lib/billing";

export const POST = route(async (req) => {
  const data = await parseBody(req, registerSchema);

  const exists = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (exists) throw new ApiError(409, "Já existe uma conta com este e-mail.", "EMAIL_TAKEN");

  const user = await prisma.user.create({
    data: {
      name: data.name,
      businessName: data.businessName,
      email: data.email,
      whatsapp: data.whatsapp,
      passwordHash: await hashPassword(data.password),
      pixHolderName: data.name.slice(0, 25),
      portfolioUrls: [],
    },
  });

  // Comprou o PRO antes de criar a conta? Ativa agora.
  await linkPendingEvents(user.id, user.email);

  await createSessionCookie({ sub: user.id, email: user.email, name: user.name });
  return json({ ok: true, user: { id: user.id, name: user.name } }, 201);
});
