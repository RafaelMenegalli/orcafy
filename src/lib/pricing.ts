import { round2 } from "./money";

export type CostInput = {
  costMaterial: number;
  costLaborHours: number;
  hourlyRate: number;
  profitMargin: number; // % sobre o preço de venda
};

/**
 * Preço sugerido por margem real (não markup):
 * preço = custo / (1 - margem). Ex.: custo 70, margem 30% -> 100 (lucro 30 = 30% do preço).
 */
export function calculatePrice(input: CostInput) {
  const material = Math.max(0, input.costMaterial || 0);
  const labor = Math.max(0, input.costLaborHours || 0) * Math.max(0, input.hourlyRate || 0);
  const totalCost = material + labor;
  const margin = Math.min(Math.max(input.profitMargin || 0, 0), 95);
  const suggestedPrice = margin > 0 ? totalCost / (1 - margin / 100) : totalCost;
  return {
    material: round2(material),
    labor: round2(labor),
    totalCost: round2(totalCost),
    margin,
    suggestedPrice: round2(suggestedPrice),
    profit: round2(suggestedPrice - totalCost),
  };
}

/** Lucro e margem efetiva de um preço praticado. */
export function effectiveMargin(totalCost: number, finalPrice: number) {
  if (finalPrice <= 0) return { profit: round2(-totalCost), marginPct: 0 };
  const profit = finalPrice - totalCost;
  return { profit: round2(profit), marginPct: round2((profit / finalPrice) * 100) };
}

/** Arredonda para cima até um valor "comercial". */
export function roundCommercial(price: number) {
  if (price <= 0) return 0;
  if (price < 20) return Math.ceil(price);
  if (price < 200) return Math.ceil(price / 5) * 5;
  return Math.ceil(price / 10) * 10;
}
