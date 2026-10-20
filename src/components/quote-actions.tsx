"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  CopyPlus,
  ExternalLink,
  MessageCircle,
  RotateCcw,
  Timer,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button, Sheet } from "@/components/ui";
import { buttonClass } from "@/lib/button-class";
import { useToast } from "@/components/toast";
import { apiFetch, errorMessage } from "@/lib/client-api";
import type { QuoteStatusValue } from "@/lib/quote";

export function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  const toast = useToast();
  return (
    <Button
      variant="outline"
      size="lg"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          toast("Link copiado!");
        } catch {
          toast("Não foi possível copiar. Segure o link para copiar.", "error");
        }
      }}
    >
      <Copy className="h-5 w-5" /> Copiar link
    </Button>
  );
}

export function WhatsAppButton({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass("primary", "lg", `bg-[#25D366] hover:bg-[#1ebe5b] shadow-none ${className ?? ""}`)}
    >
      <MessageCircle className="h-5 w-5" /> {label}
    </a>
  );
}

const EXTEND_OPTIONS = [
  { hours: 24, label: "+24 horas" },
  { hours: 72, label: "+3 dias" },
  { hours: 168, label: "+7 dias" },
];

export function QuoteActions({
  quoteId,
  slug,
  status,
  thanksHref,
}: {
  quoteId: string;
  slug: string;
  status: QuoteStatusValue;
  thanksHref: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [extendOpen, setExtendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function run(key: string, fn: () => Promise<unknown>, success: string) {
    setBusy(key);
    try {
      await fn();
      toast(success);
      router.refresh();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(null);
    }
  }

  const setStatus = (s: "APPROVED" | "REJECTED" | "SENT", msg: string) =>
    run(s, () => apiFetch(`/api/quotes/${quoteId}`, { method: "PATCH", body: { status: s } }), msg);

  const isOpen = status === "SENT" || status === "VIEWED" || status === "HOT" || status === "DRAFT";

  return (
    <div className="space-y-2.5">
      {isOpen && (
        <div className="grid grid-cols-2 gap-2.5">
          <Button size="lg" loading={busy === "APPROVED"} onClick={() => setStatus("APPROVED", "Orçamento marcado como aprovado!")}>
            <CheckCircle2 className="h-5 w-5" /> Aprovado
          </Button>
          <Button variant="danger" size="lg" loading={busy === "REJECTED"} onClick={() => setStatus("REJECTED", "Orçamento marcado como recusado.")}>
            <XCircle className="h-5 w-5" /> Recusado
          </Button>
        </div>
      )}

      {status === "APPROVED" && (
        <WhatsAppButton href={thanksHref} label="Agradecer e combinar próximos passos" className="w-full" />
      )}

      {(status === "REJECTED" || status === "APPROVED") && (
        <Button variant="outline" size="lg" block loading={busy === "SENT"} onClick={() => setStatus("SENT", "Orçamento reaberto.")}>
          <RotateCcw className="h-5 w-5" /> Reabrir proposta
        </Button>
      )}

      {status !== "APPROVED" && (
        <Button variant="outline" size="lg" block onClick={() => setExtendOpen(true)}>
          <Timer className="h-5 w-5" /> {status === "EXPIRED" ? "Renovar validade" : "Estender validade"}
        </Button>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <Link href={`/app/orcamentos/novo?from=${quoteId}`} className={buttonClass("outline", "lg")}>
          <CopyPlus className="h-5 w-5" /> Duplicar
        </Link>
        <a href={`/p/${slug}`} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "lg")}>
          <ExternalLink className="h-5 w-5" /> Ver como cliente
        </a>
      </div>

      <Button variant="ghost" size="md" block className="text-rose-600 hover:bg-rose-50" onClick={() => setDeleteOpen(true)}>
        <Trash2 className="h-4 w-4" /> Excluir orçamento
      </Button>

      <Sheet open={extendOpen} onClose={() => setExtendOpen(false)} title="Estender validade">
        <p className="mb-4 text-sm text-ink-500">A contagem regressiva na página do cliente será atualizada na hora.</p>
        <div className="grid gap-2.5">
          {EXTEND_OPTIONS.map((o) => (
            <Button
              key={o.hours}
              variant="outline"
              size="xl"
              loading={busy === `ext-${o.hours}`}
              onClick={async () => {
                await run(
                  `ext-${o.hours}`,
                  () => apiFetch(`/api/quotes/${quoteId}/extend`, { body: { extendHours: o.hours } }),
                  "Validade estendida!",
                );
                setExtendOpen(false);
              }}
            >
              {o.label}
            </Button>
          ))}
        </div>
      </Sheet>

      <Sheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Excluir orçamento?"
        footer={
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="secondary" size="lg" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="lg"
              className="bg-rose-600 hover:bg-rose-700"
              loading={busy === "delete"}
              onClick={async () => {
                setBusy("delete");
                try {
                  await apiFetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
                  toast("Orçamento excluído.");
                  router.replace("/app/orcamentos");
                  router.refresh();
                } catch (e) {
                  toast(errorMessage(e), "error");
                  setBusy(null);
                }
              }}
            >
              Excluir
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-600">
          O link deixará de funcionar para o cliente e todo o histórico do Radar será apagado. Essa ação não pode ser desfeita.
        </p>
      </Sheet>
    </div>
  );
}
