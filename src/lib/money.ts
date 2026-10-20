export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (n: number) => brl.format(Number.isFinite(n) ? n : 0);

/** "1.234,56" | "1234.56" | "1234,5" -> 1234.56 */
export function parseMoney(input: string | number): number {
  if (typeof input === "number") return Number.isFinite(input) ? input : 0;
  const s = input.trim().replace(/[R$\s]/g, "");
  if (!s) return 0;
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

/** 1234.5 -> "1234,50" (para preencher inputs editáveis) */
export function toMoneyInput(n: number) {
  if (!Number.isFinite(n) || n === 0) return "";
  return n.toFixed(2).replace(".", ",");
}
