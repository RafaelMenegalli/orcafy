import { prisma } from "@/lib/prisma";
import { json, parseBody, requireApiUserId, route } from "@/lib/api";
import { catalogItemSchema } from "@/lib/validation";

export const GET = route(async () => {
  const userId = await requireApiUserId();
  const items = await prisma.catalogItem.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return json({ items });
});

export const POST = route(async (req) => {
  const userId = await requireApiUserId();
  const data = await parseBody(req, catalogItemSchema);
  const item = await prisma.catalogItem.create({ data: { ...data, userId } });
  return json({ item }, 201);
});
