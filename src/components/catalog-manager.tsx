"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, Package, Pencil, Plus, Sparkles, Wand2 } from "lucide-react";
import { Button, Input, Sheet, Switch, Textarea } from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiFetch, errorMessage } from "@/lib/client-api";
import { formatBRL, parseMoney, toMoneyInput } from "@/lib/money";
import { calculatePrice, effectiveMargin, roundCommercial } from "@/lib/pricing";
import { cn } from "@/lib/format";

export type CatalogItemDTO = {
  id: string;
  name: string;
  description: string | null;
  costMaterial: number;
  costLaborHours: number;
  hourlyRate: number;
  profitMargin: number;
  finalPrice: number;
  isBumpDefault: boolean;
};

type FormState = {
  name: string;
  description: string;
  costMaterial: string;
  costLaborHours: string;
  hourlyRate: string;
  profitMargin: string;
  finalPrice: string;
  isBumpDefault: boolean;
  priceTouched: boolean;
};

const emptyForm = (hourlyRate = ""): FormState => ({
  name: "",
  description: "",
  costMaterial: "",
  costLaborHours: "",
  hourlyRate,
  profitMargin: "30",
  finalPrice: "",
  isBumpDefault: false,
  priceTouched: false,
});

const toForm = (i: CatalogItemDTO): FormState => ({
  name: i.name,
  description: i.description ?? "",
  costMaterial: toMoneyInput(i.costMaterial),
  costLaborHours: i.costLaborHours ? String(i.costLaborHours).replace(".", ",") : "",
  hourlyRate: toMoneyInput(i.hourlyRate),
  profitMargin: String(i.profitMargin),
  finalPrice: toMoneyInput(i.finalPrice),
  isBumpDefault: i.isBumpDefault,
  priceTouched: true,
});

export function CatalogManager({ items }: { items: CatalogItemDTO[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItemDTO | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastHourlyRate = items.find((i) => i.hourlyRate > 0)?.hourlyRate;

  const calc = useMemo(
    () =>
      calculatePrice({
        costMaterial: parseMoney(form.costMaterial),
        costLaborHours: parseMoney(form.costLaborHours),
        hourlyRate: parseMoney(form.hourlyRate),
        profitMargin: parseMoney(form.profitMargin),
      }),
    [form.costMaterial, form.costLaborHours, form.hourlyRate, form.profitMargin],
  );

  const finalPrice = form.priceTouched ? parseMoney(form.finalPrice) : calc.suggestedPrice;
  const real = effectiveMargin(calc.totalCost, finalPrice);

  function openNew() {
    setEditing(null);
    setForm(emptyForm(lastHourlyRate ? toMoneyInput(lastHourlyRate) : ""));
    setError(null);
    setOpen(true);
  }

  function openEdit(item: CatalogItemDTO) {
    setEditing(item);
    setForm(toForm(item));
    setError(null);
    setOpen(true);
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const raw = e.target.value;
    const numeric = ["costMaterial", "costLaborHours", "hourlyRate", "profitMargin", "finalPrice"].includes(k);
    const value = numeric ? raw.replace(/[^\d,.]/g, "") : raw;
    setForm((f) => ({ ...f, [k]: value, ...(k === "finalPrice" ? { priceTouched: value !== "" } : {}) }));
  };

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name,
        description: form.description || null,
        costMaterial: parseMoney(form.costMaterial),
        costLaborHours: parseMoney(form.costLaborHours),
        hourlyRate: parseMoney(form.hourlyRate),
        profitMargin: parseMoney(form.profitMargin),
        finalPrice,
        isBumpDefault: form.isBumpDefault,
      };
      if (editing) {
        await apiFetch(`/api/catalog/${editing.id}`, { method: "PATCH", body });
        toast("Item atualizado!");
      } else {
        await apiFetch("/api/catalog", { body });
        toast("Item adicionado ao catálogo!");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/catalog/${editing.id}`, { method: "DELETE" });
      toast("Item removido.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  const services = items.filter((i) => !i.isBumpDefault);
  const extras = items.filter((i) => i.isBumpDefault);

  return (
    <>
      <Button size="lg" block onClick={openNew} className="mb-5">
        <Plus className="h-5 w-5" /> Adicionar serviço ou produto
      </Button>

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-ink-200 px-6 py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
            <Package className="h-6 w-6 text-brand-600" />
          </div>
          <h3 className="font-semibold">Seu catálogo está vazio</h3>
          <p className="mt-1 max-w-xs text-sm text-ink-500">
            Cadastre seus serviços uma vez, com a calculadora de preço, e monte orçamentos com um toque.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { title: "Serviços e produtos", list: services },
            { title: "Opcionais (order bumps)", list: extras },
          ]
            .filter((g) => g.list.length > 0)
            .map((g) => (
              <section key={g.title}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">{g.title}</h2>
                <ul className="space-y-2">
                  {g.list.map((item) => {
                    const cost = item.costMaterial + item.costLaborHours * item.hourlyRate;
                    const m = effectiveMargin(cost, item.finalPrice);
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-ink-100 transition hover:ring-ink-200 active:scale-[0.99]"
                        >
                          <span
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                              item.isBumpDefault ? "bg-amber-50" : "bg-brand-50",
                            )}
                          >
                            {item.isBumpDefault ? (
                              <Sparkles className="h-5 w-5 text-amber-600" />
                            ) : (
                              <Package className="h-5 w-5 text-brand-600" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{item.name}</p>
                            <p className="text-xs text-ink-500">
                              {cost > 0 ? `Custo ${formatBRL(cost)} · margem ${m.marginPct.toFixed(0)}%` : "Sem custo cadastrado"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="tabular font-bold">{formatBRL(item.finalPrice)}</p>
                            <Pencil className="ml-auto mt-1 h-3.5 w-3.5 text-ink-400" />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
        </div>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar item" : "Novo item"}
        footer={
          <div className="flex gap-2.5">
            {editing && (
              <Button variant="danger" size="lg" loading={deleting} onClick={remove}>
                Excluir
              </Button>
            )}
            <Button size="lg" className="flex-1" loading={saving} onClick={save}>
              Salvar · {formatBRL(finalPrice)}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Nome" placeholder="Ex: Polimento técnico" value={form.name} onChange={set("name")} />
          <Textarea label="Descrição (aparece para o cliente)" rows={2} value={form.description} onChange={set("description")} />

          <div className="rounded-2xl bg-ink-50 p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Calculator className="h-4 w-4 text-brand-600" /> Calculadora de preço
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Material/insumos"
                prefix="R$"
                inputMode="decimal"
                placeholder="0,00"
                value={form.costMaterial}
                onChange={set("costMaterial")}
                className="col-span-2"
              />
              <Input label="Horas de trabalho" inputMode="decimal" placeholder="0" suffix="h" value={form.costLaborHours} onChange={set("costLaborHours")} />
              <Input label="Valor da hora" prefix="R$" inputMode="decimal" placeholder="0,00" value={form.hourlyRate} onChange={set("hourlyRate")} />
              <Input
                label="Margem de lucro"
                inputMode="decimal"
                suffix="%"
                value={form.profitMargin}
                onChange={set("profitMargin")}
                className="col-span-2"
                hint="Percentual do preço final que fica como lucro."
              />
            </div>
            <dl className="mt-4 space-y-1.5 border-t border-ink-200 pt-3 text-sm">
              <div className="flex justify-between text-ink-600">
                <dt>Mão de obra</dt>
                <dd className="tabular">{formatBRL(calc.labor)}</dd>
              </div>
              <div className="flex justify-between text-ink-600">
                <dt>Custo total</dt>
                <dd className="tabular">{formatBRL(calc.totalCost)}</dd>
              </div>
              <div className="flex justify-between font-bold">
                <dt>Preço sugerido</dt>
                <dd className="tabular text-brand-700">{formatBRL(calc.suggestedPrice)}</dd>
              </div>
            </dl>
            {calc.suggestedPrice > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() =>
                  setForm((f) => ({ ...f, finalPrice: toMoneyInput(roundCommercial(calc.suggestedPrice)), priceTouched: true }))
                }
              >
                <Wand2 className="h-4 w-4" /> Arredondar para {formatBRL(roundCommercial(calc.suggestedPrice))}
              </Button>
            )}
          </div>

          <Input
            label="Preço final praticado"
            prefix="R$"
            inputMode="decimal"
            placeholder={toMoneyInput(calc.suggestedPrice) || "0,00"}
            value={form.finalPrice}
            onChange={set("finalPrice")}
            hint={
              calc.totalCost > 0 && finalPrice > 0 ? (
                <span className={real.profit < 0 ? "font-semibold text-rose-600" : undefined}>
                  Lucro de {formatBRL(real.profit)} por venda ({real.marginPct.toFixed(1)}% do preço)
                </span>
              ) : (
                "Deixe vazio para usar o preço sugerido."
              )
            }
          />

          <label className="flex items-center justify-between gap-4 rounded-2xl bg-amber-50/70 p-4 ring-1 ring-amber-200">
            <span>
              <span className="block text-sm font-semibold">Sugerir como opcional</span>
              <span className="block text-xs text-ink-600">Aparece como “order bump” ao montar orçamentos.</span>
            </span>
            <Switch checked={form.isBumpDefault} onChange={(v) => setForm((f) => ({ ...f, isBumpDefault: v }))} label="Sugerir como opcional" />
          </label>

          {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">{error}</p>}
        </div>
      </Sheet>
    </>
  );
}
