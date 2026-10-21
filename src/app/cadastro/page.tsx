import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { Logo } from "@/components/logo";
import { AuthForm } from "@/components/auth-form";
import { PRO_PRICE_LABEL } from "@/lib/plan";

export const metadata = { title: "Criar conta" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ plano?: string }> }) {
  const { plano } = await searchParams;
  const pro = plano === "pro";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-5 pb-10 pt-safe">
      <Link href="/" className="mt-8 self-start">
        <Logo />
      </Link>
      <div className="mt-8 animate-fade-up">
        {pro ? (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight">Assine o Orçafy PRO</h1>
            <p className="mt-1 text-sm text-ink-500">Crie sua conta e siga direto para o pagamento.</p>
            <div className="mt-5 rounded-2xl bg-ink-900 p-4 text-white">
              <p className="flex items-center gap-2 font-bold">
                <Crown className="h-5 w-5 text-amber-400" /> PRO · {PRO_PRICE_LABEL}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-ink-300">
                {["Orçamentos ilimitados", "Radar ao vivo e sinal via Pix", "Sem fidelidade"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-brand-400" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight">Crie sua conta grátis</h1>
            <p className="mt-1 text-sm text-ink-500">Seu primeiro orçamento interativo sai em 60 segundos.</p>
          </>
        )}
        <div className="mt-7">
          <AuthForm mode="register" pro={pro} />
        </div>
      </div>
    </main>
  );
}
