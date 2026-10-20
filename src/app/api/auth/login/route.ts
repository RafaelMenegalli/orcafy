import { prisma } from "@/lib/prisma";
import { ApiError, json, parseBody, route } from "@/lib/api";
import { createSessionCookie, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export const POST = route(async (req) => {
  const data = await parseBody(req, loginSchema);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  const ok = user ? await verifyPassword(data.password, user.passwordHash) : false;
  if (!user || !ok) throw new ApiError(401, "E-mail ou senha incorretos.", "INVALID_CREDENTIALS");

  await createSessionCookie({ sub: user.id, email: user.email, name: user.name });
  return json({ ok: true });
});
