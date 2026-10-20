"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookUser,
  Check,
  ChevronDown,
  Copy,
  Crown,
  Minus,
  Package,
  PartyPopper,
  Plus,
  Sparkles,
  Trash2,
  User,
  ArrowRight,
} from "lucide-react";
import { Button, Chip, Input, Sheet, Textarea } from "@/components/ui";
import { buttonClass } from "@/lib/button-class";
import { useToast } from "@/components/toast";
import { WhatsAppButton } from "@/components/quote-actions";
import { apiFetch, ClientApiError, errorMessage } from "@/lib/client-api";
import { formatBRL, parseMoney, toMoneyInput } from "@/lib/money";
import { calcQuoteTotals } from "@/lib/quote";
import { cn, maskPhoneInput, whatsappLink } from "@/lib/format";
import { sendQuoteMessage } from "@/lib/messages";

export type CatalogOption = { id: string; name: string; description: string | null; finalPrice: number; isBumpDefault: boolean };

type ItemRow = { key: string; name: string; description: string; quantity: number; unitPrice: string };
type BumpRow = { key: string; name: string; description: string; price: string };

export type QuoteDraft = {
  clientName: string;
  clientWhatsapp: string;
  title: string;
  description: string;
  deliveryTime: string;
  warrantyText: string;
  discount: number;
  downPaymentPercent: number;
  items: { name: string; description: string | null; quantity: number; unitPrice: number }[];
  bumps: { name: string; description: string | null; price: number }[];
};

const DELIVERY_OPTIONS = ["Hoje", "24 horas", "3 dias úteis", "7 dias úteis", "15 dias"];
const VALIDITY_OPTIONS = [
  { hours: 24, label: "24h" },
  { hours: 48, label: "48h" },
  { hours: 72, label: "3 dias" },
  { hours: 168, label: "7 dias" },
  { hours: 360, label: "15 dias" },
];
const DOWN_OPTIONS = [0, 30, 50, 100];

let keySeq = 0;
const newKey = () => `k${Date.now().toString(36)}${(keySeq++).toString(36)}`;

type Created = { id: string; slug: string; total: number; expiresAt: string; clientName: string; clientWhatsapp: string; title: string };

type ContactsNavigator = Navigator & {
  contacts?: { select: (props: string[], opts?: { multiple?: boolean }) => Promise<Array<{ name?: string[]; tel?: string[] }>> };
};

export function QuoteBuilder({
  catalog,
  defaults,
  draft,
  user,
  baseUrl,
  limitReached,
}: {
  catalog: CatalogOption[];
  defaults: { downPaymentPercent: number; warrantyText: string };
  draft?: QuoteDraft | null;
  user: { name: string; businessName: string; hasPix: boolean };
  baseUrl: string;
  limitReached: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [clientName, setClientName] = useState(draft?.clientName ?? "");
  const [clientWhatsapp, setClientWhatsapp] = useState(draft ? maskPhoneInput(draft.clientWhatsapp) : "");
  const [title, setTitle] = useState(draft?.title ?? "");
  const [description, setDescription] = useState(draft?.description ?? "");
  const [showDetails, setShowDetails] = useState(Boolean(draft?.description));
  const [items, setItems] = useState<ItemRow[]>(
    draft?.items.map((i) => ({
      key: newKey(),
      name: i.name,
      description: i.description ?? "",
      quantity: i.quantity,
      unitPrice: toMoneyInput(i.unitPrice),
    })) ?? [],
  );
  const [bumps, setBumps] = useState<BumpRow[]>(
    draft?.bumps.map((b) => ({ key: newKey(), name: b.name, description: b.description ?? "", price: toMoneyInput(b.price) })) ?? [],
  );
  const [deliveryTime, setDeliveryTime] = useState(draft?.deliveryTime ?? "3 dias úteis");
  const [validityHours, setValidityHours] = useState(72);
  const [downPaymentPercent, setDownPaymentPercent] = useState(draft?.downPaymentPercent ?? defaults.downPaymentPercent);
  const [discount, setDiscount] = useState(draft?.discount ? toMoneyInput(draft.discount) : "");
  const [warrantyText, setWarrantyText] = useState(draft?.warrantyText ?? defaults.warrantyText);
  const [showConditions, setShowConditions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(limitReached);

  const bumpSuggestions = catalog.filter((c) => c.isBumpDefault && !bumps.some((b) => b.name === c.name));

  const totals = useMemo(
    () =>
      calcQuoteTotals({
        items: items.map((i) => ({ quantity: i.quantity, unitPrice: parseMoney(i.unitPrice) })),
        bumps: [],
        discount: parseMoney(discount),
        downPaymentPercent,
      }),
    [items, discount, downPaymentPercent],
  );

  function addFromCatalog(c: CatalogOption) {
    setItems((prev) => {
      const existing = prev.find((i) => i.name === c.name && parseMoney(i.unitPrice) === c.finalPrice);
      if (existing) return prev.map((i) => (i.key === existing.key ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { key: newKey(), name: c.name, description: c.description ?? "", quantity: 1, unitPrice: toMoneyInput(c.finalPrice) }];
    });
    if (!title.trim()) setTitle(c.name);
    if (navigator.vibrate) navigator.vibrate(15);
  }

  function updateItem(key: string, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function updateBump(key: string, patch: Partial<BumpRow>) {
    setBumps((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  }

  async function pickContact() {
    const nav = navigator as ContactsNavigator;
    if (!nav.contacts?.select) return;
    try {
      const [contact] = await nav.contacts.select(["name", "tel"], { multiple: false });
      if (!contact) return;
      if (contact.name?.[0]) setClientName(contact.name[0]);
      if (contact.tel?.[0]) setClientWhatsapp(maskPhoneInput(contact.tel[0]));
    } catch {
      /* usuário cancelou */
    }
  }

  const [canPickContact, setCanPickContact] = useState(false);
  useEffect(() => {
    setCanPickContact(Boolean((navigator as ContactsNavigator).contacts?.select));
  }, []);

  async function submit() {
    setError(null);
    if (items.length === 0) {
      setError("Adicione pelo menos um item ao orçamento.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        clientName,
        clientWhatsapp,
        title: title.trim() || items[0]?.name || "",
        description: description || null,
        deliveryTime,
        warrantyText: warrantyText || null,
        discount: parseMoney(discount),
        downPaymentPercent,
        validityHours,
        items: items.map((i) => ({
          name: i.name,
          description: i.description || null,
          quantity: i.quantity,
          unitPrice: parseMoney(i.unitPrice),
        })),
        bumps: bumps
          .filter((b) => b.name.trim())
          .map((b) => ({ name: b.name, description: b.description || null, price: parseMoney(b.price) })),
      };
      const { quote } = await apiFetch<{
        quote: { id: string; slug: string; expiresAt: string; clientName: string; clientWhatsapp: string; title: string };
      }>("/api/quotes", { body });
      setCreated({ ...quote, total: totals.total });
      router.refresh();
    } catch (e) {
      if (e instanceof ClientApiError && e.code === "PLAN_LIMIT") {
        setUpgradeOpen(true);
      } else {
        setError(errorMessage(e));
        toast(errorMessage(e), "error");
      }
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    const url = `${baseUrl}/p/${created.slug}`;
    const message = sendQuoteMessage({
      clientName: created.clientName,
      providerName: user.name,
      businessName: user.businessName,
      title: created.title,
      url,
      total: created.total,
      expiresAt: created.expiresAt,
    });
    return (
      <div className="animate-fade-up pb-8 pt-10 text-center">
        <div className="mx-auto flex h-16 w-16 animate-pop items-center justify-center rounded-3xl bg-brand-100">
          <PartyPopper className="h-8 w-8 text-brand-700" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Orçamento pronto!</h1>
        <p className="mx-auto mt-1 max-w-xs text-sm text-ink-500">
          Envie agora para {created.clientName.split(" ")[0]}. O Radar vai te avisar assim que o link for aberto.
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-white p-4 text-left ring-1 ring-ink-100">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Link da proposta</p>
          <p className="mt-1 truncate font-mono text-sm">{url}</p>
          <p className="tabular mt-2 text-lg font-extrabold">{formatBRL(created.total)}</p>
        </div>
        <div className="mx-auto mt-5 grid max-w-sm gap-2.5">
          <WhatsAppButton href={whatsappLink(created.clientWhatsapp, message)} label="Enviar no WhatsApp" className="h-14 w-full text-base" />
          <Button
            variant="outline"
            size="lg"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                toast("Link copiado!");
              } catch {
                toast("Não foi possível copiar.", "error");
              }
            }}
          >
            <Copy className="h-5 w-5" /> Copiar link
          </Button>
          <Link href={`/app/orcamentos/${created.id}`} className={buttonClass("ghost", "lg")}>
            Acompanhar no Radar <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        {!user.hasPix && (
          <p className="mx-auto mt-6 max-w-sm rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            Configure sua chave Pix no{" "}
            <Link href="/app/perfil#pix" className="font-semibold underline">
              perfil
            </Link>{" "}
            para o cliente conseguir pagar o sinal.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-40">
      {/* Cliente */}
      <section className="space-y-3">
        <SectionTitle icon={User} title="Cliente" />
        <Input
          label="Nome"
          placeholder="Ex: Mariana Costa"
          autoComplete="off"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
        <Input
          label="WhatsApp"
          type="tel"
          inputMode="tel"
          placeholder="(11) 99999-8888"
          value={clientWhatsapp}
          onChange={(e) => setClientWhatsapp(maskPhoneInput(e.target.value))}
        />
        {canPickContact && (
          <Button variant="secondary" size="sm" onClick={pickContact}>
            <BookUser className="h-4 w-4" /> Escolher dos contatos
          </Button>
        )}
      </section>

      {/* Itens */}
      <section className="space-y-3">
        <SectionTitle icon={Package} title="O que vai no orçamento" />
        {catalog.length > 0 ? (
          <div>
            <p className="mb-2 text-xs text-ink-500">Toque para adicionar do seu catálogo</p>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {catalog.map((c) => {
                const count = items.filter((i) => i.name === c.name).reduce((s, i) => s + i.quantity, 0);
                return (
                  <Chip key={c.id} active={count > 0} onClick={() => addFromCatalog(c)}>
                    {count > 0 ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {c.name}
                    <span className={cn("tabular text-xs", count > 0 ? "text-ink-300" : "text-ink-500")}>{formatBRL(c.finalPrice)}</span>
                    {count > 1 && <span className="rounded-full bg-white/20 px-1.5 text-xs">{count}×</span>}
                  </Chip>
                );
              })}
            </div>
          </div>
        ) : (
          <Link href="/app/catalogo" className="block rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
            💡 Cadastre seus serviços no <span className="font-semibold underline">catálogo</span> e monte orçamentos com um toque.
          </Link>
        )}

        <div className="space-y-2.5">
          {items.map((item) => (
            <div key={item.key} className="animate-fade-up rounded-2xl bg-white p-3.5 ring-1 ring-ink-100">
              <div className="flex items-start gap-2">
                <input
                  value={item.name}
                  onChange={(e) => updateItem(item.key, { name: e.target.value })}
                  placeholder="Nome do item"
                  className="min-w-0 flex-1 rounded-lg bg-transparent py-1 font-semibold text-ink-900 placeholder:text-ink-400 focus:bg-ink-50 focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Remover item"
                  onClick={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-xl bg-ink-50 ring-1 ring-ink-100">
                  <button
                    type="button"
                    aria-label="Diminuir"
                    onClick={() => updateItem(item.key, { quantity: Math.max(1, item.quantity - 1) })}
                    className="flex h-10 w-10 items-center justify-center text-ink-600"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="tabular w-7 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label="Aumentar"
                    onClick={() => updateItem(item.key, { quantity: item.quantity + 1 })}
                    className="flex h-10 w-10 items-center justify-center text-ink-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">R$</span>
                  <input
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.key, { unitPrice: e.target.value.replace(/[^\d,.]/g, "") })}
                    placeholder="0,00"
                    className="tabular h-10 w-full rounded-xl border-0 bg-white pl-9 pr-3 text-right font-semibold ring-1 ring-inset ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            block
            onClick={() => setItems((prev) => [...prev, { key: newKey(), name: "", description: "", quantity: 1, unitPrice: "" }])}
          >
            <Plus className="h-4 w-4" /> Item avulso
          </Button>
        </div>

        <Input
          label="Título do orçamento"
          placeholder="Ex: Polimento Técnico + Higienização"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {showDetails ? (
          <Textarea
            label="Detalhes para o cliente (opcional)"
            placeholder="Explique o que está incluso, materiais usados, diferenciais…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        ) : (
          <button type="button" onClick={() => setShowDetails(true)} className="text-sm font-semibold text-brand-700">
            + Adicionar detalhes
          </button>
        )}
      </section>

      {/* Order bumps */}
      <section className="space-y-3">
        <SectionTitle icon={Sparkles} title="Opcionais" subtitle="O cliente marca com um toque e o total sobe na hora." />
        {bumpSuggestions.length > 0 && bumps.length < 6 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {bumpSuggestions.map((c) => (
              <Chip
                key={c.id}
                onClick={() =>
                  setBumps((prev) => [
                    ...prev,
                    { key: newKey(), name: c.name, description: c.description ?? "", price: toMoneyInput(c.finalPrice) },
                  ])
                }
              >
                <Plus className="h-4 w-4" /> {c.name}
                <span className="tabular text-xs text-ink-500">+{formatBRL(c.finalPrice)}</span>
              </Chip>
            ))}
          </div>
        )}
        {bumps.map((b) => (
          <div key={b.key} className="flex animate-fade-up items-center gap-2 rounded-2xl bg-amber-50/60 p-3 ring-1 ring-amber-200">
            <input
              value={b.name}
              onChange={(e) => updateBump(b.key, { name: e.target.value })}
              placeholder="Ex: Entrega Expressa 24h"
              className="min-w-0 flex-1 rounded-lg bg-transparent py-2 text-sm font-semibold placeholder:text-ink-400 focus:bg-white focus:outline-none"
            />
            <div className="relative w-28 shrink-0">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-500">+R$</span>
              <input
                inputMode="decimal"
                value={b.price}
                onChange={(e) => updateBump(b.key, { price: e.target.value.replace(/[^\d,.]/g, "") })}
                placeholder="0,00"
                className="tabular h-10 w-full rounded-xl border-0 bg-white pl-10 pr-2 text-right text-sm font-semibold ring-1 ring-inset ring-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button
              type="button"
              aria-label="Remover opcional"
              onClick={() => setBumps((prev) => prev.filter((x) => x.key !== b.key))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-white hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {bumps.length < 6 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBumps((prev) => [...prev, { key: newKey(), name: "", description: "", price: "" }])}
          >
            <Plus className="h-4 w-4" /> Criar opcional
          </Button>
        )}
      </section>

      {/* Condições */}
      <section className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-ink-700">Prazo de entrega</p>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {DELIVERY_OPTIONS.map((d) => (
              <Chip key={d} active={deliveryTime === d} onClick={() => setDeliveryTime(d)}>
                {d}
              </Chip>
            ))}
          </div>
          <input
            value={deliveryTime}
            onChange={(e) => setDeliveryTime(e.target.value)}
            placeholder="Ou escreva: Entrega até sexta-feira"
            className="mt-2 h-11 w-full rounded-xl border-0 bg-white px-3.5 text-sm ring-1 ring-inset ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink-700">Validade da proposta</p>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {VALIDITY_OPTIONS.map((v) => (
              <Chip key={v.hours} active={validityHours === v.hours} onClick={() => setValidityHours(v.hours)}>
                {v.label}
              </Chip>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-500">O cliente vê uma contagem regressiva. Prazos curtos aceleram a decisão.</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink-700">Sinal via Pix na aprovação</p>
          <div className="grid grid-cols-4 gap-2">
            {DOWN_OPTIONS.map((p) => (
              <Chip key={p} active={downPaymentPercent === p} onClick={() => setDownPaymentPercent(p)} className="justify-center">
                {p === 0 ? "Sem" : `${p}%`}
              </Chip>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowConditions((v) => !v)}
          className="flex items-center gap-1 text-sm font-semibold text-ink-600"
        >
          Desconto e garantia <ChevronDown className={cn("h-4 w-4 transition", showConditions && "rotate-180")} />
        </button>
        {showConditions && (
          <div className="animate-fade-up space-y-3">
            <Input
              label="Desconto (R$)"
              inputMode="decimal"
              prefix="R$"
              placeholder="0,00"
              value={discount}
              onChange={(e) => setDiscount(e.target.value.replace(/[^\d,.]/g, ""))}
            />
            <Textarea label="Garantia" rows={2} value={warrantyText} onChange={(e) => setWarrantyText(e.target.value)} />
          </div>
        )}
      </section>

      {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">{error}</p>}

      {/* Barra fixa de total */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-ink-100 bg-white/95 px-4 py-3 shadow-float backdrop-blur lg:bottom-0 lg:pl-64">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="tabular truncate text-xl font-extrabold leading-tight">{formatBRL(totals.total)}</p>
            <p className="tabular truncate text-xs text-ink-500">
              {downPaymentPercent > 0 ? `Sinal ${formatBRL(totals.downPayment)} via Pix` : "Sem sinal"}
              {bumps.length > 0 && ` · ${bumps.length} opcional${bumps.length > 1 ? "is" : ""}`}
            </p>
          </div>
          <Button size="lg" loading={saving} onClick={submit} className="px-6">
            Gerar link <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Sheet open={upgradeOpen} onClose={() => setUpgradeOpen(false)} title="Limite do plano Grátis">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
            <Crown className="h-7 w-7 text-amber-600" />
          </div>
          <p className="mt-4 text-sm text-ink-600">
            Você já usou os 5 orçamentos do plano Grátis. Com o <strong>PRO</strong>, você envia orçamentos ilimitados e continua
            acompanhando tudo pelo Radar.
          </p>
          <Link href="/app/perfil#plano" className={buttonClass("primary", "xl", "mt-5 w-full")}>
            Quero o PRO
          </Link>
        </div>
      </Sheet>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
        <Icon className="h-[18px] w-[18px] text-brand-600" /> {title}
      </h2>
      {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
    </div>
  );
}
