import "server-only";
import type { PaymentEvent, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/** Configuração da Cakto (com override por variáveis de ambiente). */
export const caktoConfig = {
  checkoutUrl: process.env.CAKTO_CHECKOUT_URL || "https://pay.cakto.com.br/kn4x95h_1223903",
  // IDs aceitos para o produto Orçafy PRO (id do produto, short_id ou id da oferta).
  productIds: (process.env.CAKTO_PRODUCT_IDS || "b0d44ea3-239f-484f-b304-f9473dbbec35,kn4x95h")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

/** Dias de acesso por cobrança mensal aprovada (30 dias + 3 de carência para a renovação). */
const ACCESS_DAYS_PER_CHARGE = 33;

const ACTIVATE_EVENTS = new Set(["purchase_approved", "subscription_created", "subscription_renewed"]);
const CANCEL_EVENTS = new Set(["subscription_canceled", "subscription_cancelled"]);
const PAST_DUE_EVENTS = new Set(["subscription_renewal_refused", "purchase_refused"]);
const REVOKE_EVENTS = new Set(["refund", "chargeback", "purchase_refunded", "purchase_chargeback"]);
const NEGATIVE_STATUSES = new Set(["refused", "canceled", "cancelled", "refunded", "chargedback", "waiting_payment", "pending"]);
const REVOKE_STATUSES = new Set(["refunded", "chargedback"]);

export type CaktoPayload = {
  secret?: unknown;
  event?: unknown;
  data?: {
    id?: unknown;
    refId?: unknown;
    customer?: { email?: unknown; name?: unknown } | null;
    offer?: { id?: unknown } | null;
    product?: { id?: unknown; short_id?: unknown } | null;
    subscription?: unknown;
    status?: unknown;
    amount?: unknown;
    paidAt?: unknown;
  } | null;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export function extractEventInfo(body: CaktoPayload) {
  const d = body.data ?? {};
  const sub = d.subscription;
  const subscriptionId =
    str(sub) ?? (sub && typeof sub === "object" ? str((sub as { id?: unknown }).id) : null);
  const paidAtRaw = str(d.paidAt);
  const paidAt = paidAtRaw && !Number.isNaN(Date.parse(paidAtRaw)) ? new Date(paidAtRaw) : null;
  return {
    event: str(body.event) ?? "unknown",
    externalId: str(d.id),
    refId: str(d.refId),
    email: str(d.customer?.email)?.toLowerCase() ?? null,
    status: str(d.status)?.toLowerCase() ?? null,
    amount: typeof d.amount === "number" ? d.amount : null,
    subscriptionId,
    paidAt,
    productKeys: [str(d.product?.id), str(d.product?.short_id), str(d.offer?.id)].filter((x): x is string => Boolean(x)),
  };
}

export type EventInfo = ReturnType<typeof extractEventInfo>;

export function isOurProduct(info: EventInfo) {
  if (caktoConfig.productIds.length === 0) return true;
  return info.productKeys.some((k) => caktoConfig.productIds.includes(k));
}

type Action =
  | { kind: "activate"; expiresAt: Date }
  | { kind: "cancel" }
  | { kind: "past_due" }
  | { kind: "revoke" }
  | { kind: "ignore"; reason: string };

export function decideAction(info: EventInfo): Action {
  if (REVOKE_EVENTS.has(info.event) || (info.status && REVOKE_STATUSES.has(info.status))) return { kind: "revoke" };
  if (CANCEL_EVENTS.has(info.event)) return { kind: "cancel" };
  if (PAST_DUE_EVENTS.has(info.event)) return { kind: "past_due" };
  if (ACTIVATE_EVENTS.has(info.event)) {
    if (info.status && NEGATIVE_STATUSES.has(info.status)) return { kind: "ignore", reason: `status ${info.status}` };
    const base = info.paidAt ?? new Date();
    return { kind: "activate", expiresAt: new Date(base.getTime() + ACCESS_DAYS_PER_CHARGE * 86400000) };
  }
  return { kind: "ignore", reason: `evento ${info.event} não altera o plano` };
}

/** Aplica um evento a um usuário. Retorna uma nota legível do que foi feito. */
async function applyToUser(userId: string, info: EventInfo, tx: Prisma.TransactionClient) {
  const action = decideAction(info);
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
  const link = {
    ...(info.subscriptionId ? { caktoSubscriptionId: info.subscriptionId } : {}),
    ...(info.email ? { caktoCustomerEmail: info.email } : {}),
  };

  switch (action.kind) {
    case "activate": {
      // Nunca encurta um acesso já mais longo (eventos podem chegar fora de ordem).
      const current = user.planExpiresAt?.getTime() ?? 0;
      const expiresAt = new Date(Math.max(current, action.expiresAt.getTime()));
      await tx.user.update({ where: { id: userId }, data: { plan: "PRO", planStatus: "ACTIVE", planExpiresAt: expiresAt, ...link } });
      return `PRO ativo até ${expiresAt.toISOString()}`;
    }
    case "cancel":
      await tx.user.update({ where: { id: userId }, data: { planStatus: "CANCELED", ...link } });
      return "assinatura cancelada; acesso mantido até o fim do período pago";
    case "past_due":
      await tx.user.update({ where: { id: userId }, data: { planStatus: "PAST_DUE", ...link } });
      return "pagamento recusado; acesso mantido durante a carência";
    case "revoke":
      await tx.user.update({ where: { id: userId }, data: { plan: "FREE", planStatus: "REVOKED", planExpiresAt: new Date(), ...link } });
      return "reembolso/chargeback: PRO removido";
    case "ignore":
      return `ignorado: ${action.reason}`;
  }
}

async function findUserFor(info: EventInfo) {
  const or: Prisma.UserWhereInput[] = [];
  if (info.subscriptionId) or.push({ caktoSubscriptionId: info.subscriptionId });
  if (info.email) or.push({ email: info.email }, { caktoCustomerEmail: info.email });
  if (or.length === 0) return null;
  return prisma.user.findFirst({ where: { OR: or }, select: { id: true } });
}

/** Processa um webhook já autenticado. Idempotente pelo dedupeKey. */
export async function processCaktoEvent(body: CaktoPayload, rawHash: string) {
  const info = extractEventInfo(body);
  const dedupeKey = `${info.event}:${info.externalId ?? rawHash}:${info.status ?? "-"}`;
  const { secret: _secret, ...safePayload } = body;
  void _secret;

  const existing = await prisma.paymentEvent.findUnique({ where: { dedupeKey } });
  if (existing) return { duplicate: true, event: existing };

  const ours = isOurProduct(info);
  const user = ours ? await findUserFor(info) : null;

  const event = await prisma.$transaction(async (tx) => {
    let note: string;
    let processed = false;
    if (!ours) note = "ignorado: produto diferente do Orçafy PRO";
    else if (!user) note = "aguardando vínculo: nenhum usuário com este e-mail";
    else {
      note = await applyToUser(user.id, info, tx);
      processed = true;
    }
    return tx.paymentEvent.create({
      data: {
        dedupeKey,
        eventType: info.event,
        externalId: info.externalId,
        refId: info.refId,
        email: info.email,
        status: info.status,
        amount: info.amount,
        userId: user?.id ?? null,
        processed,
        note,
        payload: JSON.stringify(safePayload),
      },
    });
  });

  return { duplicate: false, event };
}

function infoFromStored(e: PaymentEvent): EventInfo {
  return extractEventInfo(JSON.parse(e.payload) as CaktoPayload);
}

/**
 * Vincula ao usuário os eventos que chegaram antes do cadastro (ou com outro e-mail)
 * e os aplica em ordem cronológica.
 */
export async function linkPendingEvents(userId: string, email: string) {
  const pending = await prisma.paymentEvent.findMany({
    where: { email: email.toLowerCase(), userId: null, processed: false },
    orderBy: { createdAt: "asc" },
  });
  let applied = 0;
  for (const e of pending) {
    const info = infoFromStored(e);
    if (!isOurProduct(info)) continue;
    await prisma.$transaction(async (tx) => {
      const note = await applyToUser(userId, info, tx);
      await tx.paymentEvent.update({ where: { id: e.id }, data: { userId, processed: true, note } });
    });
    applied++;
  }
  return applied;
}
