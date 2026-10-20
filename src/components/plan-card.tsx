"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronDown, Crown, Loader2, Lock, MessageCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { AutoRefresh } from "@/components/auto-refresh";
import { useToast } from "@/components/toast";
import { buttonClass } from "@/lib/button-class";
import { apiFetch, errorMessage } from "@/lib/client-api";
import { cn, formatDate, whatsappLink } from "@/lib/format";
import { FREE_QUOTE_LIMIT } from "@/lib/quote";
import { PRO_PRICE_LABEL } from "@/lib/plan";

export type BillingDTO = {
  isPro: boolean;
  planStatus: "ACTIVE" | "PAST_DUE" | "CANCELED" | "REVOKED" | null;
  planExpiresAt: string | null;
  checkoutHref: string;
  justPaid: boolean;
};

export function PlanCard({
  billing,
  email,
  quotesUsed,
  supportWhatsapp,
}: {
  billing: BillingDTO;
  email: string;
  quotesUsed: number;
  supportWhatsapp: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [claimOpen, setClaimOpen] = useState(false);
  const [claim, setClaim] = useState({ email: "", refId: "" });
  const [claiming, setClaiming] = useState(false);
  const { isPro, planStatus, planExpiresAt, checkoutHref, justPaid } = billing;
  const until = planExpiresAt ? formatDate(planExpiresAt) : null;
  const usage = Math.min(quotesUsed, FREE_QUOTE_LIMIT);

  async function submitClaim() {
    setClaiming(true);
    try {
      const res = await apiFetch<{ pro: boolean }>("/api/billing/claim", { body: claim });
      toast(res.pro ? "Compra vinculada! Seu PRO está ativo." : "Compra vinculada à sua conta.");
      setClaimOpen(false);
      router.refresh();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setClaiming(false);
    }
  }

  const checkoutButton = (label: string) => (
    <a href={checkoutHref} className={buttonClass("primary", "lg", "mt-4 w-full")}>
      <Lock className="h-4 w-4" /> {label}
    </a>
  );

  return (
    <div className="space-y-4">
      {justPaid && !isPro && (
        <div className="flex gap-3 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-200">
          <AutoRefresh intervalMs={4000} />
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-brand-600" />
          <div className="text-sm">
            <p className="font-semibold text-brand-900">Confirmando seu pagamento…</p>
            <p className="mt-0.5 text-brand-800">
              Assim que a Cakto confirmar, o PRO é ativado aqui automaticamente. No cartão isso leva poucos segundos.
            </p>
          </div>
        </div>
      )}

      {justPaid && isPro && (
        <div className="flex gap-3 rounded-2xl bg-brand-600 p-4 text-white">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <div>
            <p className="font-bold">PRO ativado! 🎉</p>
            <p className="text-sm text-brand-50">Agora seus orçamentos são ilimitados.</p>
          </div>
        </div>
      )}

      {isPro ? (
        <div className="rounded-2xl bg-ink-900 p-4 text-white">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 shrink-0 text-amber-400" />
            <div>
              <p className="font-bold">Orçafy PRO</p>
              <p className="text-sm text-ink-300" suppressHydrationWarning>
                {!until
                  ? "Orçamentos ilimitados, sem vencimento."
                  : planStatus === "CANCELED"
                    ? `Assinatura cancelada. Você mantém o PRO até ${until}.`
                    : `Orçamentos ilimitados. Acesso garantido até ${until}, renovando automaticamente.`}
              </p>
            </div>
          </div>
          {planStatus === "PAST_DUE" && (
            <p className="mt-3 flex gap-2 rounded-xl bg-amber-400/15 p-3 text-xs text-amber-200" suppressHydrationWarning>
              <AlertTriangle className="h-4 w-4 shrink-0" />
              A cobrança da renovação foi recusada. Atualize o cartão na Cakto até {until} para não perder o PRO.
            </p>
          )}
          {planStatus === "CANCELED" && checkoutButton(`Assinar novamente · ${PRO_PRICE_LABEL}`)}
        </div>
      ) : (
        <>
          <div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Grátis</span>
              <span className="tabular text-ink-500">
                {usage}/{FREE_QUOTE_LIMIT} orçamentos usados
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
              <div
                className={cn("h-full rounded-full", usage >= FREE_QUOTE_LIMIT ? "bg-rose-500" : "bg-brand-500")}
                style={{ width: `${(usage / FREE_QUOTE_LIMIT) * 100}%` }}
              />
            </div>
          </div>

          {planStatus === "REVOKED" && (
            <p className="rounded-xl bg-ink-100 p-3 text-xs text-ink-600">Sua assinatura PRO foi encerrada após reembolso ou contestação.</p>
          )}
          {planStatus && planStatus !== "REVOKED" && until && (
            <p className="rounded-xl bg-ink-100 p-3 text-xs text-ink-600" suppressHydrationWarning>
              Seu PRO venceu em {until}. Assine de novo para voltar a enviar orçamentos ilimitados.
            </p>
          )}

          <div className="rounded-2xl bg-ink-900 p-4 text-white">
            <p className="flex items-center gap-2 font-bold">
              <Crown className="h-5 w-5 text-amber-400" /> PRO · {PRO_PRICE_LABEL}
            </p>
            <p className="mt-1 text-sm text-ink-300">Orçamentos ilimitados e Radar completo. Cancele quando quiser.</p>
            {checkoutButton("Assinar o PRO")}
            <p className="mt-2 text-center text-xs text-ink-400">
              Pagamento seguro pela Cakto. Use o e-mail <strong className="text-ink-200">{email}</strong> na compra.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setClaimOpen((v) => !v)}
              className="flex items-center gap-1 text-sm font-semibold text-ink-600"
            >
              Já paguei com outro e-mail <ChevronDown className={cn("h-4 w-4 transition", claimOpen && "rotate-180")} />
            </button>
            {claimOpen && (
              <div className="mt-3 space-y-3 rounded-2xl bg-ink-50 p-4">
                <p className="text-xs text-ink-600">
                  Informe o e-mail usado no pagamento e o código do pedido que aparece no e-mail de confirmação da Cakto.
                </p>
                <Input
                  label="E-mail da compra"
                  type="email"
                  inputMode="email"
                  autoCapitalize="off"
                  value={claim.email}
                  onChange={(e) => setClaim((c) => ({ ...c, email: e.target.value }))}
                />
                <Input
                  label="Código do pedido"
                  autoCapitalize="off"
                  placeholder="Ex: 9vbgfmg"
                  value={claim.refId}
                  onChange={(e) => setClaim((c) => ({ ...c, refId: e.target.value }))}
                />
                <Button block loading={claiming} disabled={!claim.email || !claim.refId} onClick={submitClaim}>
                  Vincular compra
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {supportWhatsapp && (
        <a
          href={whatsappLink(supportWhatsapp, `Olá! Preciso de ajuda com minha assinatura do Orçafy. Meu e-mail é ${email}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-500"
        >
          <MessageCircle className="h-4 w-4" /> Ajuda com a assinatura
        </a>
      )}
    </div>
  );
}
