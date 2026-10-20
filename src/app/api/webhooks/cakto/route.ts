import { createHash, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { json } from "@/lib/api";
import { processCaktoEvent, type CaktoPayload } from "@/lib/billing";

export const dynamic = "force-dynamic";

function secretMatches(provided: unknown, expected: string) {
  if (typeof provided !== "string" || !provided) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Webhook da Cakto. A Cakto envia a chave secreta no campo "secret" do corpo.
 * Responde 200 para eventos válidos (mesmo os ignorados) para evitar reenvios desnecessários.
 */
export async function POST(req: Request) {
  const expected = process.env.CAKTO_WEBHOOK_SECRET;
  if (!expected) {
    console.error("[cakto] CAKTO_WEBHOOK_SECRET não configurado");
    return json({ error: "Webhook não configurado." }, 503);
  }

  const raw = await req.text();
  let body: CaktoPayload;
  try {
    body = JSON.parse(raw) as CaktoPayload;
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }
  if (!body || typeof body !== "object") return json({ error: "JSON inválido." }, 400);

  const provided = body.secret ?? req.headers.get("x-cakto-secret") ?? req.headers.get("x-webhook-secret");
  if (!secretMatches(provided, expected)) {
    return json({ error: "Assinatura inválida." }, 401);
  }

  const rawHash = createHash("sha256").update(raw).digest("hex").slice(0, 32);
  try {
    const result = await processCaktoEvent(body, rawHash);
    return json({
      ok: true,
      duplicate: result.duplicate,
      processed: result.event.processed,
      note: result.event.note,
    });
  } catch (err) {
    // Entrega simultânea do mesmo evento: o outro request já gravou.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return json({ ok: true, duplicate: true });
    }
    console.error("[cakto] erro ao processar webhook", err);
    return json({ error: "Erro ao processar o evento." }, 500);
  }
}
