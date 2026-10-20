import { formatBRL } from "./money";
import { formatDuration, firstName } from "./format";

export type RadarEventType = "VIEWED" | "TIME_SPENT" | "BUMP_TOGGLED" | "PIX_OPENED" | "PIX_COPIED" | "APPROVED";

export type RadarEvent = {
  id: string;
  type: RadarEventType;
  metadata: string | null;
  createdAt: string;
  quote: { id: string; title: string; clientName: string; slug: string };
};

export function parseMeta(metadata: string | null): Record<string, unknown> {
  if (!metadata) return {};
  try {
    const v = JSON.parse(metadata);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const ordinal = (n: number) => `${n}ª`;

/** Frase legível para o feed do Radar. */
export function describeEvent(e: { type: RadarEventType; metadata: string | null }, clientName: string) {
  const who = firstName(clientName);
  const m = parseMeta(e.metadata);
  switch (e.type) {
    case "VIEWED": {
      const n = Number(m.viewNumber ?? 0);
      const device = typeof m.device === "string" ? ` pelo ${m.device}` : "";
      return n > 1 ? `${who} abriu o orçamento pela ${ordinal(n)} vez${device}` : `${who} abriu o orçamento${device}`;
    }
    case "TIME_SPENT":
      return `${who} ficou ${formatDuration(Number(m.seconds ?? 0))} lendo a proposta`;
    case "BUMP_TOGGLED": {
      const name = String(m.bumpName ?? "um opcional");
      const price = Number(m.price ?? 0);
      return m.selected
        ? `${who} adicionou “${name}” (+${formatBRL(price)})`
        : `${who} removeu “${name}”`;
    }
    case "PIX_OPENED":
      return `${who} abriu o Pix do sinal${m.amount ? ` de ${formatBRL(Number(m.amount))}` : ""}`;
    case "PIX_COPIED":
      return `${who} copiou o código Pix — pagamento a caminho`;
    case "APPROVED":
      return `${who} APROVOU o orçamento${m.total ? ` de ${formatBRL(Number(m.total))}` : ""}!`;
  }
}

export const EVENT_TONE: Record<RadarEventType, { bg: string; fg: string }> = {
  VIEWED: { bg: "bg-violet-100", fg: "text-violet-700" },
  TIME_SPENT: { bg: "bg-sky-100", fg: "text-sky-700" },
  BUMP_TOGGLED: { bg: "bg-amber-100", fg: "text-amber-700" },
  PIX_OPENED: { bg: "bg-orange-100", fg: "text-orange-700" },
  PIX_COPIED: { bg: "bg-orange-100", fg: "text-orange-700" },
  APPROVED: { bg: "bg-brand-100", fg: "text-brand-700" },
};
