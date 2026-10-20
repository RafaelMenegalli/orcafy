import { prisma } from "@/lib/prisma";
import { ApiError, json, parseBody, requireApiUserId, route } from "@/lib/api";
import { catalogItemSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

async function ownedItem(id: string, userId: string) {
  const item = await prisma.catalogItem.findFirst({ where: { id, userId } });
  if (!item) throw new ApiError(404, "Item não encontrado.");
  return item;
}

export const PATCH = route<Ctx>(async (req, { params }) => {
  const userId = await requireApiUserId();
  const { id } = await params;
  await ownedItem(id, userId);
  const data = await parseBody(req, catalogItemSchema);
  const item = await prisma.catalogItem.update({ where: { id }, data });
  return json({ item });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const userId = await requireApiUserId();
  const { id } = await params;
  await ownedItem(id, userId);
  await prisma.catalogItem.delete({ where: { id } });
  return json({ ok: true });
});
