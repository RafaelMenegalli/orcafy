import Link from "next/link";
import { ArrowRight, Check, Eye, Flame, QrCode, Sparkles, Timer, Zap } from "lucide-react";
import { Logo } from "@/components/logo";
import { getSession } from "@/lib/auth";
import { buttonClass } from "@/lib/button-class";

const features = [
  {
    icon: Timer,
    title: "Orçamento em 60 segundos",
    text: "Monte a proposta pelo celular puxando itens do seu catálogo com preço calculado. Sem PDF, sem planilha.",
  },
  {
    icon: Eye,
    title: "Radar de abertura ao vivo",
    text: "Saiba na hora em que o cliente abriu, quantas vezes voltou e quanto tempo ficou lendo. Chame no momento certo.",
  },
  {
    icon: Sparkles,
    title: "Opcionais que aumentam o ticket",
    text: "Ofereça extras como “Entrega Expressa” com um toque. O cliente marca e o total atualiza na hora.",
  },
  {
    icon: QrCode,
    title: "Sinal via Pix na aprovação",
    text: "QR Code e Pix Copia e Cola gerados no padrão do Banco Central, direto na sua chave. Sem taxa.",
  },
];

export default async function Home() {
  const session = await getSession();

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/85 backdrop-blur pt-safe">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Logo />
          {session ? (
            <Link href="/app" className={buttonClass("dark", "sm")}>
              Abrir painel
            </Link>
          ) : (
            <div className="flex items-center gap-1">
              <Link href="/login" className={buttonClass("ghost", "sm")}>
                Entrar
              </Link>
              <Link href="/cadastro" className={buttonClass("primary", "sm")}>
                Criar conta
              </Link>
            </div>
          )}
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-brand-50 to-white" />
          <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-2 md:pt-20">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                <Zap className="h-3.5 w-3.5" /> Para prestadores de serviço e makers
              </span>
              <h1 className="mt-4 text-[2.1rem] font-extrabold leading-[1.1] tracking-tight text-ink-900 md:text-5xl">
                Mande o orçamento.
                <br />
                Veja o cliente abrir.
                <br />
                <span className="text-brand-600">Receba o sinal no Pix.</span>
              </h1>
              <p className="mt-4 max-w-md text-base text-ink-600 md:text-lg">
                O Orçafy transforma seu orçamento em uma página interativa que avisa quando o cliente está pronto para
                fechar — e cobra o sinal na hora.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href={session ? "/app/orcamentos/novo" : "/cadastro"} className={buttonClass("primary", "xl")}>
                  Criar meu primeiro orçamento <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
              <p className="mt-3 text-sm text-ink-500">Grátis para os 5 primeiros orçamentos. Sem cartão.</p>
            </div>

            {/* Ilustração do produto */}
            <div className="relative mx-auto w-full max-w-[320px]" aria-hidden>
              <div className="rounded-[2.2rem] bg-ink-900 p-2.5 shadow-2xl">
                <div className="overflow-hidden rounded-[1.8rem] bg-ink-50">
                  <div className="bg-white px-4 pb-4 pt-6">
                    <p className="text-xs text-ink-500">Olá, Mariana 👋</p>
                    <p className="mt-1 font-bold text-ink-900">Polimento Técnico + Higienização</p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between text-ink-600">
                        <span>Polimento técnico</span>
                        <span className="font-medium text-ink-900">R$ 450,00</span>
                      </div>
                      <div className="flex justify-between text-ink-600">
                        <span>Higienização interna</span>
                        <span className="font-medium text-ink-900">R$ 280,00</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex items-center justify-between rounded-xl bg-white p-3 ring-2 ring-brand-500">
                      <div>
                        <p className="text-sm font-semibold">Vitrificação de faróis</p>
                        <p className="text-xs text-brand-700">+ R$ 120,00</p>
                      </div>
                      <span className="flex h-6 w-11 items-center rounded-full bg-brand-600 px-0.5">
                        <span className="ml-auto h-5 w-5 rounded-full bg-white" />
                      </span>
                    </div>
                    <div className="rounded-xl bg-brand-600 p-3 text-center text-sm font-bold text-white">
                      Aprovar e pagar sinal · R$ 425,00
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -left-6 top-16 flex animate-fade-up items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold shadow-card ring-1 ring-ink-100 [animation-delay:300ms]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100">
                  <Flame className="h-4 w-4 text-orange-600" />
                </span>
                Mariana abriu pela 3ª vez
              </div>
              <div className="absolute -right-4 bottom-20 flex animate-fade-up items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold shadow-card ring-1 ring-ink-100 [animation-delay:600ms]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100">
                  <QrCode className="h-4 w-4 text-brand-700" />
                </span>
                Copiou o Pix!
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Feito para fechar mais, falando menos.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl bg-ink-50 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                  <f.icon className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="mt-4 font-bold">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Planos simples</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl p-6 ring-1 ring-ink-200">
              <p className="font-semibold text-ink-600">Grátis</p>
              <p className="mt-1 text-3xl font-extrabold">R$ 0</p>
              <ul className="mt-5 space-y-2.5 text-sm text-ink-700">
                {["5 orçamentos interativos", "Radar de abertura em tempo real", "Sinal via Pix com QR Code", "Catálogo com calculadora de preço"].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="h-5 w-5 shrink-0 text-brand-600" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl bg-ink-900 p-6 text-white">
              <p className="font-semibold text-brand-300">PRO</p>
              <p className="mt-1 text-3xl font-extrabold">
                R$ 29<span className="text-base font-medium text-ink-400">/mês</span>
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-ink-200">
                {["Orçamentos ilimitados", "Tudo do plano Grátis", "Portfólio e marca na proposta", "Suporte prioritário no WhatsApp"].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="h-5 w-5 shrink-0 text-brand-400" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Link href={session ? "/app" : "/cadastro"} className={buttonClass("primary", "xl", "mt-8 w-full md:w-auto")}>
            Começar grátis agora <ArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-ink-100 py-8 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} Orçafy · Orçamentos que fecham sozinhos
      </footer>
    </div>
  );
}
