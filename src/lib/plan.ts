export type PlanLike = {
  plan: "FREE" | "PRO";
  planExpiresAt: Date | string | null;
};

/** PRO vale enquanto não expirar. Sem data de expiração = PRO sem prazo (ativado pelo admin). */
export function isProActive(u: PlanLike) {
  if (u.plan !== "PRO") return false;
  if (!u.planExpiresAt) return true;
  return new Date(u.planExpiresAt).getTime() > Date.now();
}

export const PRO_PRICE_LABEL = "R$ 29/mês";
