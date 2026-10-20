"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  Timer,
  Truck,
  X,
  Lock,
} from "lucide-react";
import { Button, Sheet } from "@/components/ui";
import { PixQr } from "@/components/pix-qr";
import { useToast } from "@/components/toast";
import { useQuoteTracking } from "@/components/use-quote-tracking";
import { apiFetch, errorMessage } from "@/lib/client-api";
import { formatBRL } from "@/lib/money";
import { calcQuoteTotals, type QuoteStatusValue } from "@/lib/quote";
import { cn, firstName, whatsappLink } from "@/lib/format";
import { buttonClass } from "@/lib/button-class";
import { tryBuildPixPayload, type PixKeyType } from "@/lib/pix";
import { clientApprovedMessage, clientExpiredMessage, clientQuestionMessage } from "@/lib/messages";

export type PublicQuoteDTO = {
  slug: string;
  clientName: string;
  title: string;
  description: string | null;
  deliveryTime: string;
  warrantyText: string | null;
  discount: number;
  downPaymentPercent: number;
  status: QuoteStatusValue;
  expiresAt: string;
  approvedAt: string | null;
  createdAt: string;
  items: { id: string; name: string; description: string | null; quantity: number; unitPrice: number }[];
  bumps: { id: string; name: string; description: string | null; price: number; selected: boolean }[];
};

export type ProviderDTO = {
  name: string;
  businessName: string;
  whatsapp: string;
  logoUrl: string | null;
  bio: string | null;
  portfolioUrls: string[];
  pix: { keyType: PixKeyType; key: string; holderName: string; city: string } | null;
};

function useCountdown(target: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return null;
  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { diff, d, h, m, s };
}

const pad = (n: number) => n.toString().padStart(2, "0");

export function PublicQuote({ quote, provider, isOwner, pageUrl }: { quote: PublicQuoteDTO; provider: ProviderDTO; isOwner: boolean; pageUrl: string }) {
  const toast = useToast();
  const [bumps, setBumps] = useState(quote.bumps);
  const [status, setStatus] = useState<QuoteStatusValue>(quote.status);
  const [approvedAt, setApprovedAt] = useState(quote.approvedAt);
  const [pixOpen, setPixOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [approving, setApproving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const countdown = useCountdown(quote.expiresAt);

  const { track } = useQuoteTracking(quote.slug, !isOwner);

  const expired = status === "EXPIRED" || (countdown !== null && countdown.diff <= 0 && status !== "APPROVED" && status !== "REJECTED");
  const approved = status === "APPROVED";
  const closed = expired || approved || status === "REJECTED";

  const totals = useMemo(
    () => calcQuoteTotals({ items: quote.items, bumps, discount: quote.discount, downPaymentPercent: quote.downPaymentPercent }),
    [quote.items, bumps, quote.discount, quote.downPaymentPercent],
  );

  const pix = useMemo(() => {
    if (!provider.pix || totals.downPayment <= 0) return null;
    const r = tryBuildPixPayload({
      ...provider.pix,
      amount: totals.downPayment,
      txid: `ORC${quote.slug}`.toUpperCase(),
    });
    return r.payload;
  }, [provider.pix, totals.downPayment, quote.slug]);

  async function toggleBump(id: string) {
    if (closed) return;
    const bump = bumps.find((b) => b.id === id);
    if (!bump) return;
    const selected = !bump.selected;
    setBumps((prev) => prev.map((b) => (b.id === id ? { ...b, selected } : b)));
    if (navigator.vibrate) navigator.vibrate(12);
    setTogglingId(id);
    try {
      await apiFetch(`/api/public/quotes/${quote.slug}/bump`, { body: { bumpId: id, selected } });
    } catch (e) {
      setBumps((prev) => prev.map((b) => (b.id === id ? { ...b, selected: !selected } : b)));
      toast(errorMessage(e), "error");
    } finally {
      setTogglingId(null);
    }
  }

  function openPayment() {
    if (pix) {
      setPixOpen(true);
      track("PIX_OPENED", totals.downPayment);
    } else {
      approve();
    }
  }

  async function copyPix() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix);
    } catch {
      const el = document.createElement("textarea");
      el.value = pix;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    toast("Código Pix copiado! Cole no app do seu banco.");
    track("PIX_COPIED", totals.downPayment);
    setTimeout(() => setCopied(false), 4000);
  }

  async function approve() {
    if (isOwner) {
      toast("Pré-visualização: só o cliente pode aprovar pelo link.", "info");
      return;
    }
    setApproving(true);
    try {
      await apiFetch(`/api/public/quotes/${quote.slug}/approve`, { body: {} });
      setStatus("APPROVED");
      setApprovedAt(new Date().toISOString());
      setPixOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setApproving(false);
    }
  }

  const questionHref = whatsappLink(provider.whatsapp, clientQuestionMessage({ providerName: provider.name, title: quote.title, url: pageUrl }));
  const approvedHref = whatsappLink(
    provider.whatsapp,
    clientApprovedMessage({ providerName: provider.name, title: quote.title, downPayment: provider.pix ? totals.downPayment : 0, url: pageUrl }),
  );
  const expiredHref = whatsappLink(provider.whatsapp, clientExpiredMessage({ providerName: provider.name, title: quote.title, url: pageUrl }));
  const urgent = countdown !== null && countdown.diff > 0 && countdown.diff < 24 * 3600 * 1000;

  return (
    <div className="min-h-dvh bg-ink-50">
      {isOwner && (
        <div className="flex items-center justify-center gap-2 bg-ink-900 px-4 py-2 text-center text-xs font-medium text-white">
          <Eye className="h-3.5 w-3.5" /> Pré-visualização — suas visitas não contam no Radar
        </div>
      )}

      {/* Validade */}
      {!closed && countdown && (
        <div
          className={cn(
            "sticky top-0 z-20 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold backdrop-blur",
            urgent ? "bg-rose-600/95 text-white" : "bg-ink-900/95 text-white",
          )}
        >
          <Timer className="h-4 w-4" />
          <span>Proposta válida por</span>
          <span className="tabular">
            {countdown.d > 0 && `${countdown.d}d `}
            {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
          </span>
        </div>
      )}

      <main className="mx-auto max-w-lg px-4 pb-40 pt-6">
        {/* Prestador */}
        <header className="flex items-center gap-3">
          {provider.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={provider.logoUrl} alt={provider.businessName} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-ink-100" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-extrabold text-white">
              {provider.businessName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate font-bold text-ink-900">
              {provider.businessName} <BadgeCheck className="h-4 w-4 shrink-0 text-brand-600" />
            </p>
            <p className="truncate text-sm text-ink-500">{provider.name}</p>
          </div>
        </header>

        {/* Estados finais */}
        {approved && (
          <div className="mt-6 animate-fade-up rounded-3xl bg-brand-600 p-5 text-white shadow-lg shadow-brand-600/20">
            <div className="flex h-12 w-12 animate-pop items-center justify-center rounded-2xl bg-white/20">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mt-3 text-xl font-extrabold">Orçamento aprovado!</h2>
            <p className="mt-1 text-sm text-brand-50" suppressHydrationWarning>
              {approvedAt &&
                `Aprovado em ${new Date(approvedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}. `}
              {provider.pix && totals.downPayment > 0
                ? "Envie o comprovante do Pix para agilizar o início do serviço."
                : `${firstName(provider.name)} vai entrar em contato para combinar os próximos passos.`}
            </p>
            <a
              href={approvedHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("primary", "lg", "mt-4 w-full bg-white text-brand-700 shadow-none hover:bg-brand-50")}
            >
              <MessageCircle className="h-5 w-5" /> {provider.pix && totals.downPayment > 0 ? "Enviar comprovante" : "Falar no WhatsApp"}
            </a>
          </div>
        )}

        {expired && !approved && (
          <div className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-ink-200">
            <div className="flex items-center gap-2 font-bold text-ink-900">
              <CalendarClock className="h-5 w-5 text-rose-500" /> Esta proposta expirou
            </div>
            <p className="mt-1 text-sm text-ink-600">Os valores podem ter mudado. Peça uma proposta atualizada em um toque.</p>
            <a
              href={expiredHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("primary", "lg", "mt-4 w-full bg-[#25D366] shadow-none hover:bg-[#1ebe5b]")}
            >
              <MessageCircle className="h-5 w-5" /> Pedir para renovar
            </a>
          </div>
        )}

        {status === "REJECTED" && (
          <div className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-ink-200">
            <p className="font-bold">Proposta encerrada</p>
            <p className="mt-1 text-sm text-ink-600">Se ainda tiver interesse, fale com {firstName(provider.name)} pelo WhatsApp.</p>
          </div>
        )}

        {/* Proposta */}
        <section className="mt-6">
          <p className="text-sm text-ink-500">Olá, {firstName(quote.clientName)} 👋 Aqui está sua proposta:</p>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight text-ink-900">{quote.title}</h1>
          {quote.description && <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-600">{quote.description}</p>}
        </section>

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-card ring-1 ring-ink-100">
          <ul className="space-y-3.5">
            {quote.items.map((it) => (
              <li key={it.id} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink-900">
                    {it.quantity > 1 && <span className="text-brand-700">{it.quantity}× </span>}
                    {it.name}
                  </p>
                  {it.description && <p className="mt-0.5 text-sm text-ink-500">{it.description}</p>}
                </div>
                <p className="tabular shrink-0 font-semibold">{formatBRL(it.quantity * it.unitPrice)}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Order bumps */}
        {bumps.length > 0 && (
          <section className="mt-5">
            <h2 className="flex items-center gap-2 font-bold text-ink-900">
              <Sparkles className="h-5 w-5 text-amber-500" /> Quer turbinar seu pedido?
            </h2>
            <p className="mt-0.5 text-sm text-ink-500">Toque para adicionar. O total atualiza na hora.</p>
            <div className="mt-3 space-y-2.5">
              {bumps.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  disabled={closed || togglingId === b.id}
                  onClick={() => toggleBump(b.id)}
                  aria-pressed={b.selected}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left transition active:scale-[0.99] disabled:active:scale-100",
                    b.selected ? "ring-2 ring-brand-500 shadow-md shadow-brand-500/10" : "ring-1 ring-ink-200",
                    closed && !b.selected && "opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition",
                      b.selected ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300 bg-white",
                    )}
                  >
                    {b.selected && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink-900">{b.name}</span>
                    {b.description && <span className="mt-0.5 block text-sm text-ink-500">{b.description}</span>}
                  </span>
                  <span className={cn("tabular shrink-0 text-sm font-bold", b.selected ? "text-brand-700" : "text-ink-700")}>
                    +{formatBRL(b.price)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Totais */}
        <section className="mt-5 rounded-3xl bg-ink-900 p-5 text-white">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-ink-300">
              <dt>Serviços</dt>
              <dd className="tabular">{formatBRL(totals.itemsTotal)}</dd>
            </div>
            {totals.bumpsTotal > 0 && (
              <div className="flex justify-between text-ink-300">
                <dt>Opcionais</dt>
                <dd className="tabular">+{formatBRL(totals.bumpsTotal)}</dd>
              </div>
            )}
            {totals.discount > 0 && (
              <div className="flex justify-between text-brand-300">
                <dt>Desconto</dt>
                <dd className="tabular">−{formatBRL(totals.discount)}</dd>
              </div>
            )}
          </dl>
          <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-3">
            <span className="text-sm text-ink-300">Total</span>
            <span key={totals.total} className="tabular animate-pop text-3xl font-extrabold tracking-tight">
              {formatBRL(totals.total)}
            </span>
          </div>
          {totals.pct > 0 && totals.pct < 100 && (
            <p className="mt-2 text-right text-xs text-ink-400">
              Sinal de {totals.pct}% ({formatBRL(totals.downPayment)}) na aprovação + {formatBRL(totals.remaining)} na entrega
            </p>
          )}
          {totals.pct === 100 && <p className="mt-2 text-right text-xs text-ink-400">Pagamento integral via Pix na aprovação</p>}
        </section>

        {/* Condições */}
        <section className="mt-5 grid gap-2.5">
          <Condition icon={Truck} title="Prazo de entrega" text={quote.deliveryTime} />
          {quote.warrantyText && <Condition icon={ShieldCheck} title="Garantia" text={quote.warrantyText} />}
          {provider.pix && totals.downPayment > 0 && (
            <Condition icon={Lock} title="Pagamento seguro via Pix" text={`Direto para ${provider.pix.holderName}, sem intermediários.`} />
          )}
        </section>

        {/* Sobre */}
        {(provider.bio || provider.portfolioUrls.length > 0) && (
          <section className="mt-6">
            <h2 className="font-bold text-ink-900">Sobre {provider.businessName}</h2>
            {provider.bio && <p className="mt-1.5 text-[15px] leading-relaxed text-ink-600">{provider.bio}</p>}
            {provider.portfolioUrls.length > 0 && (
              <div className="no-scrollbar -mx-4 mt-3 flex snap-x gap-2.5 overflow-x-auto px-4">
                {provider.portfolioUrls.map((url, i) => (
                  <button key={i} type="button" onClick={() => setLightbox(url)} className="shrink-0 snap-start">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Trabalho realizado ${i + 1}`}
                      loading="lazy"
                      className="h-40 w-40 rounded-2xl object-cover ring-1 ring-ink-100"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        <a
          href={questionHref}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("outline", "lg", "mt-6 w-full")}
        >
          <MessageCircle className="h-5 w-5 text-[#25D366]" /> Tirar uma dúvida no WhatsApp
        </a>

        <p className="mt-8 text-center text-xs text-ink-400">
          Proposta enviada via <span className="font-semibold text-ink-500">Orçafy</span>
        </p>
      </main>

      {/* CTA fixo */}
      {!closed && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 px-4 pb-safe pt-3 shadow-float backdrop-blur">
          <div className="mx-auto max-w-lg pb-3">
            <Button size="xl" block loading={approving} onClick={openPayment} className="h-[62px] gap-3">
              {pix ? <QrCode className="h-6 w-6 shrink-0" /> : <CheckCircle2 className="h-6 w-6 shrink-0" />}
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[17px] font-bold">Aprovar orçamento</span>
                <span className="tabular text-xs font-medium text-brand-100">
                  {pix ? `Sinal de ${formatBRL(totals.downPayment)} via Pix` : `Total de ${formatBRL(totals.total)}`}
                </span>
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Pix */}
      <Sheet
        open={pixOpen}
        onClose={() => setPixOpen(false)}
        title="Pague o sinal via Pix"
        footer={
          <Button size="xl" block loading={approving} onClick={approve}>
            <CheckCircle2 className="h-5 w-5" /> Já paguei, aprovar orçamento
          </Button>
        }
      >
        {pix && provider.pix && (
          <div className="flex flex-col items-center text-center">
            <p className="text-sm text-ink-500">Valor do sinal ({totals.pct}%)</p>
            <p className="tabular text-3xl font-extrabold">{formatBRL(totals.downPayment)}</p>
            <PixQr payload={pix} size={220} className="mt-4" />
            <p className="mt-2 text-xs text-ink-500">
              Recebedor: <span className="font-semibold text-ink-700">{provider.pix.holderName}</span>
            </p>

            <div className="mt-5 w-full rounded-2xl bg-ink-50 p-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Pix Copia e Cola</p>
              <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-ink-700">{pix}</p>
            </div>
            <Button variant={copied ? "secondary" : "dark"} size="lg" block className="mt-3" onClick={copyPix}>
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              {copied ? "Código copiado!" : "Copiar código Pix"}
            </Button>

            <ol className="mt-5 w-full space-y-2 text-left text-sm text-ink-600">
              {["Copie o código ou escaneie o QR Code", "Abra o app do seu banco e escolha Pix Copia e Cola", "Confirme o pagamento e toque em “Já paguei”"].map(
                (step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ),
              )}
            </ol>
          </div>
        )}
      </Sheet>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-4" onClick={() => setLightbox(null)}>
          <button type="button" aria-label="Fechar" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Trabalho realizado" className="max-h-[85dvh] max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
}

function Condition({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink-100">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50">
        <Icon className="h-[18px] w-[18px] text-brand-600" />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="text-sm text-ink-600">{text}</p>
      </div>
    </div>
  );
}
