import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCheckoutUrl } from "@/lib/billing";
import { pickTracking } from "@/lib/tracking";
import { isProActive } from "@/lib/plan";

export const dynamic = "force-dynamic";

/**
 * Atalho "Assinar PRO" da página de vendas:
 * - sem conta  → cadastro em modo PRO (depois volta para cá)
 * - já é PRO   → perfil
 * - logado     → checkout da Cakto com e-mail preenchido e UTMs da campanha
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tracking = pickTracking(url.searchParams);

  const session = await getSession();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.sub },
        select: { email: true, name: true, plan: true, planExpiresAt: true },
      })
    : null;

  if (!user) {
    const signup = new URL("/cadastro", url.origin);
    signup.searchParams.set("plano", "pro");
    tracking.forEach((v, k) => signup.searchParams.set(k, v));
    return NextResponse.redirect(signup);
  }

  if (isProActive(user)) {
    return NextResponse.redirect(new URL("/app/perfil#plano", url.origin));
  }

  return NextResponse.redirect(buildCheckoutUrl(user, tracking));
}
