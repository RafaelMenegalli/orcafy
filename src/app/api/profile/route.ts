import { prisma } from "@/lib/prisma";
import { ApiError, json, parseBody, requireApiUserId, route } from "@/lib/api";
import { profileSchema } from "@/lib/validation";
import { normalizePixKey } from "@/lib/pix";

const publicFields = {
  id: true,
  name: true,
  businessName: true,
  email: true,
  whatsapp: true,
  logoUrl: true,
  bio: true,
  portfolioUrls: true,
  pixKeyType: true,
  pixKey: true,
  pixHolderName: true,
  pixCity: true,
  defaultDownPayment: true,
  defaultWarrantyText: true,
  plan: true,
  quotesCreatedCount: true,
} as const;

export const GET = route(async () => {
  const userId = await requireApiUserId();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicFields });
  if (!user) throw new ApiError(404, "Usuário não encontrado.");
  return json({ user });
});

export const PATCH = route(async (req) => {
  const userId = await requireApiUserId();
  const data = await parseBody(req, profileSchema);

  let pixKey: string | null = null;
  if (data.pixKey) {
    try {
      pixKey = normalizePixKey(data.pixKeyType, data.pixKey);
    } catch (e) {
      throw new ApiError(422, e instanceof Error ? e.message : "Chave Pix inválida.");
    }
    if (!data.pixHolderName) throw new ApiError(422, "Informe o nome do titular da conta Pix.");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { ...data, pixKey },
    select: publicFields,
  });
  return json({ user });
});
