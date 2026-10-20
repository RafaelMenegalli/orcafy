import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ApiError, json, parseBody, route } from "@/lib/api";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  plan: z.enum(["FREE", "PRO"]),
});

function secretMatches(provided: string | null, expected: string) {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Ativa/desativa o plano PRO de um usuário após confirmar o pagamento.
 * Uso: curl -X POST /api/admin/plan -H "x-admin-secret: $ADMIN_SECRET" -d '{"email":"...","plan":"PRO"}'
 */
export const POST = route(async (req) => {
  const expected = process.env.ADMIN_SECRET;
  if (!expected || expected.length < 16) throw new ApiError(404, "Not found");
  if (!secretMatches(req.headers.get("x-admin-secret"), expected)) throw new ApiError(401, "Não autorizado.");

  const { email, plan } = await parseBody(req, schema);
  const user = await prisma.user.update({
    where: { email },
    data: { plan },
    select: { id: true, email: true, plan: true },
  }).catch(() => null);
  if (!user) throw new ApiError(404, "Usuário não encontrado.");
  return json({ user });
});
