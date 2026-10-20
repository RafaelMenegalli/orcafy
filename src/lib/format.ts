import { twMerge } from "tailwind-merge";

export const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** Normaliza WhatsApp para DDI+DDD+número (ex: 5511999998888). */
export function normalizeWhatsapp(raw: string) {
  let d = onlyDigits(raw);
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return d;
}

export function isValidWhatsapp(raw: string) {
  return /^\d{12,15}$/.test(normalizeWhatsapp(raw));
}

export function formatPhone(raw: string) {
  const d = onlyDigits(raw);
  const local = d.startsWith("55") && d.length >= 12 ? d.slice(2) : d;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return raw;
}

/** Máscara progressiva para input de telefone brasileiro. */
export function maskPhoneInput(raw: string) {
  let d = onlyDigits(raw);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function whatsappLink(phone: string, text?: string) {
  const base = `https://wa.me/${normalizeWhatsapp(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function timeAgo(date: Date | string | null | undefined) {
  if (!date) return "nunca";
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 10) return "agora";
  if (s < 60) return `há ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d} dia${d > 1 ? "s" : ""}`;
  return new Date(date).toLocaleDateString("pt-BR");
}

export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m < 60) return rest ? `${m}min ${rest}s` : `${m}min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}min`;
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  });
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Junta classes resolvendo conflitos do Tailwind (a última vence). */
export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(" "));
}
