"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, ImagePlus, Link2, LogOut, Save, Trash2, AlertCircle } from "lucide-react";
import { Button, Chip, Input, Select, Textarea } from "@/components/ui";
import { useToast } from "@/components/toast";
import { PixQr } from "@/components/pix-qr";
import { InstallApp } from "@/components/install-app";
import { PlanCard, type BillingDTO } from "@/components/plan-card";
import { apiFetch, errorMessage } from "@/lib/client-api";
import { resizeImage } from "@/lib/image";
import { maskPhoneInput } from "@/lib/format";
import { PIX_KEY_LABELS, PIX_KEY_PLACEHOLDERS, tryBuildPixPayload, type PixKeyType } from "@/lib/pix";
import { buttonClass } from "@/lib/button-class";

export type ProfileDTO = {
  name: string;
  businessName: string;
  email: string;
  whatsapp: string;
  logoUrl: string | null;
  bio: string | null;
  portfolioUrls: string[];
  pixKeyType: PixKeyType;
  pixKey: string | null;
  pixHolderName: string | null;
  pixCity: string | null;
  defaultDownPayment: number;
  defaultWarrantyText: string | null;
  quotesCreatedCount: number;
};

function Section({ id, title, subtitle, children }: { id?: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 rounded-2xl bg-white p-4 ring-1 ring-ink-100 sm:p-5">
      <h2 className="text-base font-bold">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function ProfileForm({
  profile,
  billing,
  supportWhatsapp,
  welcome,
}: {
  profile: ProfileDTO;
  billing: BillingDTO;
  supportWhatsapp: string | null;
  welcome: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const logoInput = useRef<HTMLInputElement>(null);
  const portfolioInput = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [f, setF] = useState({
    name: profile.name,
    businessName: profile.businessName,
    whatsapp: maskPhoneInput(profile.whatsapp),
    logoUrl: profile.logoUrl ?? "",
    bio: profile.bio ?? "",
    portfolioUrls: profile.portfolioUrls,
    pixKeyType: profile.pixKeyType,
    pixKey: profile.pixKey ?? "",
    pixHolderName: profile.pixHolderName ?? "",
    pixCity: profile.pixCity ?? "SAO PAULO",
    defaultDownPayment: profile.defaultDownPayment,
    defaultWarrantyText: profile.defaultWarrantyText ?? "",
  });

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((prev) => ({ ...prev, [k]: v }));

  const pixPreview = useMemo(() => {
    if (!f.pixKey.trim()) return null;
    return tryBuildPixPayload({
      keyType: f.pixKeyType,
      key: f.pixKey,
      holderName: f.pixHolderName,
      city: f.pixCity,
      amount: 1,
      txid: "TESTEORCAFY",
    });
  }, [f.pixKey, f.pixKeyType, f.pixHolderName, f.pixCity]);

  async function onLogo(file: File | undefined) {
    if (!file) return;
    try {
      set("logoUrl", await resizeImage(file, 256, "image/png"));
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  }

  async function onPortfolio(files: FileList | null) {
    if (!files) return;
    const room = 4 - f.portfolioUrls.length;
    const picked = Array.from(files).slice(0, room);
    try {
      const urls = await Promise.all(picked.map((file) => resizeImage(file, 960, "image/jpeg", 0.75)));
      set("portfolioUrls", [...f.portfolioUrls, ...urls].slice(0, 4));
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        body: {
          ...f,
          logoUrl: f.logoUrl || null,
          bio: f.bio || null,
          pixKey: f.pixKey || null,
          pixHolderName: f.pixHolderName || null,
          pixCity: f.pixCity || null,
          defaultWarrantyText: f.defaultWarrantyText || null,
        },
      });
      toast("Perfil salvo!");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
      toast(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 pb-28">
      {welcome && (
        <div className="rounded-2xl bg-brand-600 p-4 text-white">
          <p className="font-bold">Conta criada! 🎉</p>
          <p className="mt-1 text-sm text-brand-50">
            Complete sua marca e sua chave Pix — é isso que o cliente vê na proposta. Depois é só criar o primeiro orçamento.
          </p>
        </div>
      )}

      <Section title="Seu negócio" subtitle="Aparece no topo de cada proposta.">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => logoInput.current?.click()}
            className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ink-100 ring-1 ring-ink-200"
            aria-label="Enviar logo"
          >
            {f.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.logoUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-7 w-7 text-ink-400" />
            )}
          </button>
          <div className="space-y-1.5">
            <Button variant="outline" size="sm" onClick={() => logoInput.current?.click()}>
              <ImagePlus className="h-4 w-4" /> {f.logoUrl ? "Trocar logo" : "Enviar logo"}
            </Button>
            {f.logoUrl && (
              <button type="button" onClick={() => set("logoUrl", "")} className="block text-xs font-medium text-rose-600">
                Remover
              </button>
            )}
          </div>
          <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
        </div>
        <Input label="Seu nome" value={f.name} onChange={(e) => set("name", e.target.value)} />
        <Input label="Nome do negócio" value={f.businessName} onChange={(e) => set("businessName", e.target.value)} />
        <Input
          label="WhatsApp"
          type="tel"
          inputMode="tel"
          value={f.whatsapp}
          onChange={(e) => set("whatsapp", maskPhoneInput(e.target.value))}
          hint="O cliente usa para tirar dúvidas e enviar o comprovante."
        />
        <Textarea
          label="Sobre você"
          rows={3}
          maxLength={400}
          placeholder="Ex: Especialista em estética automotiva há 8 anos. Atendo a domicílio na zona sul."
          value={f.bio}
          onChange={(e) => set("bio", e.target.value)}
          hint={`${f.bio.length}/400`}
        />
      </Section>

      <Section title="Portfólio" subtitle="Até 4 fotos de trabalhos reais. Gera confiança e aumenta a aprovação.">
        <div className="grid grid-cols-2 gap-2.5">
          {f.portfolioUrls.map((url, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl bg-ink-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Trabalho ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Remover foto"
                onClick={() => set("portfolioUrls", f.portfolioUrls.filter((_, j) => j !== i))}
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-ink-900/70 text-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {f.portfolioUrls.length < 4 && (
            <button
              type="button"
              onClick={() => portfolioInput.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink-200 text-sm font-medium text-ink-500 hover:bg-ink-50"
            >
              <ImagePlus className="h-6 w-6" /> Adicionar foto
            </button>
          )}
        </div>
        <input
          ref={portfolioInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            onPortfolio(e.target.files);
            e.target.value = "";
          }}
        />
        {f.portfolioUrls.length < 4 && (
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="Ou cole o link https:// de uma foto"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
            />
            <Button
              variant="secondary"
              className="h-12"
              disabled={!/^https:\/\/\S+$/i.test(urlDraft.trim())}
              onClick={() => {
                set("portfolioUrls", [...f.portfolioUrls, urlDraft.trim()].slice(0, 4));
                setUrlDraft("");
              }}
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Section>

      <Section id="pix" title="Recebimento via Pix" subtitle="O sinal cai direto na sua conta. Sem intermediários e sem taxa.">
        <Select label="Tipo de chave" value={f.pixKeyType} onChange={(e) => set("pixKeyType", e.target.value as PixKeyType)}>
          {(Object.keys(PIX_KEY_LABELS) as PixKeyType[]).map((k) => (
            <option key={k} value={k}>
              {PIX_KEY_LABELS[k]}
            </option>
          ))}
        </Select>
        <Input
          label="Chave Pix"
          placeholder={PIX_KEY_PLACEHOLDERS[f.pixKeyType]}
          inputMode={f.pixKeyType === "CPF" || f.pixKeyType === "CNPJ" || f.pixKeyType === "PHONE" ? "numeric" : f.pixKeyType === "EMAIL" ? "email" : "text"}
          autoCapitalize="off"
          value={f.pixKey}
          onChange={(e) => set("pixKey", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nome do titular"
            maxLength={25}
            value={f.pixHolderName}
            onChange={(e) => set("pixHolderName", e.target.value)}
            hint="Como no banco (até 25)."
          />
          <Input label="Cidade" maxLength={15} value={f.pixCity} onChange={(e) => set("pixCity", e.target.value)} hint="Até 15 letras." />
        </div>

        {pixPreview &&
          (pixPreview.payload ? (
            <div className="flex items-center gap-4 rounded-2xl bg-brand-50 p-3">
              <PixQr payload={pixPreview.payload} size={88} />
              <div className="text-sm">
                <p className="flex items-center gap-1.5 font-semibold text-brand-800">
                  <CheckCircle2 className="h-4 w-4" /> Pix válido
                </p>
                <p className="mt-1 text-xs text-brand-900/80">
                  QR de teste de R$ 1,00. Escaneie no app do seu banco para conferir se o nome do titular está certo.
                </p>
              </div>
            </div>
          ) : (
            <p className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {pixPreview.error}
            </p>
          ))}
      </Section>

      <Section title="Padrões dos orçamentos">
        <div>
          <p className="mb-2 text-sm font-medium text-ink-700">Sinal padrão</p>
          <div className="grid grid-cols-4 gap-2">
            {[0, 30, 50, 100].map((p) => (
              <Chip key={p} active={f.defaultDownPayment === p} onClick={() => set("defaultDownPayment", p)} className="justify-center">
                {p === 0 ? "Sem" : `${p}%`}
              </Chip>
            ))}
          </div>
        </div>
        <Textarea label="Garantia padrão" rows={2} value={f.defaultWarrantyText} onChange={(e) => set("defaultWarrantyText", e.target.value)} />
      </Section>

      <Section id="plano" title="Seu plano">
        <PlanCard billing={billing} email={profile.email} quotesUsed={profile.quotesCreatedCount} supportWhatsapp={supportWhatsapp} />
      </Section>

      <Section title="App no celular" subtitle="Acesse o Radar com um toque, como um app.">
        <InstallApp />
      </Section>

      <a href="/api/auth/logout?next=/login" className={buttonClass("ghost", "lg", "w-full text-ink-500")}>
        <LogOut className="h-5 w-5" /> Sair da conta
      </a>

      {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">{error}</p>}

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-ink-100 bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:pl-64">
        <div className="mx-auto max-w-2xl">
          <Button size="lg" block loading={saving} onClick={save}>
            <Save className="h-5 w-5" /> Salvar alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
