import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Calculator, Check, ChevronDown, Crown, Eye, Lock, QrCode, Sparkles, Timer } from "lucide-react";
import { Logo } from "@/components/logo";
import { getSession } from "@/lib/auth";
import { buttonClass } from "@/lib/button-class";
import { FREE_QUOTE_LIMIT } from "@/lib/quote";
import { PRO_PRICE_LABEL } from "@/lib/plan";
import { cn } from "@/lib/format";

// Telas reais do sistema (capturadas com a conta de demonstração).
const SHOT = { width: 780, height: 1688 };

const steps = [
  {
    title: "Monte o orçamento em 60 segundos",
    text: "Puxe serviços do seu catálogo, ofereça extras e gere o link.",
    img: "/landing/prestador-orcamento.webp",
    alt: "Tela de criação de orçamento no Orçafy",
  },
  {
    title: "O cliente escolhe e paga o sinal",
    text: "Ele marca os extras, o total atualiza e o Pix do sinal sai pronto.",
    img: "/landing/cliente-pix.webp",
    alt: "Cliente pagando o sinal via Pix",
  },
  {
    title: "Você acompanha tudo ao vivo",
    text: "Saiba quando ele abriu, quanto tempo leu e a hora certa de chamar.",
    img: "/landing/prestador-radar.webp",
    alt: "Radar ao vivo mostrando a atividade do cliente",
  },
];

const benefits = [
  { icon: Sparkles, title: "Ticket maior", text: "Extras que o cliente adiciona com um toque." },
  { icon: QrCode, title: "Sinal na hora", text: "Pix direto na sua conta, sem intermediários." },
  { icon: Eye, title: "Radar de abertura", text: "Aviso quando o cliente abre e o que escolheu." },
  { icon: Timer, title: "Decisão mais rápida", text: "Proposta com prazo e contagem regressiva." },
  { icon: BadgeCheck, title: "Sua marca", text: "Logo, fotos dos seus trabalhos e garantia." },
  { icon: Calculator, title: "Preço certo", text: "Calculadora com custo, horas e margem." },
];

const faq = [
  { q: "Meu cliente precisa baixar algum app?", a: "Não. Ele abre o link que você manda no WhatsApp, direto no navegador do celular." },
  { q: "Para onde vai o dinheiro do sinal?", a: "Direto para a sua chave Pix. O Orçafy não passa pelo seu dinheiro." },
  { q: "Preciso de cartão para testar?", a: `Não. Os ${FREE_QUOTE_LIMIT} primeiros orçamentos são grátis, sem cartão.` },
  { q: "Posso cancelar o PRO?", a: "Sim, quando quiser. Não tem fidelidade nem multa." },
];

function Phone({ src, alt, className, priority }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <div className={cn("rounded-[2.2rem] bg-ink-900 p-2 shadow-2xl shadow-ink-900/20", className)}>
      <div className="overflow-hidden rounded-[1.75rem] bg-white">
        <Image src={src} alt={alt} width={SHOT.width} height={SHOT.height} priority={priority} sizes="(min-width: 768px) 300px, 80vw" className="h-auto w-full" />
      </div>
    </div>
  );
}

export default async function Home() {
  const session = await getSession();
  const startHref = session ? "/app/orcamentos/novo" : "/cadastro";

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/90 backdrop-blur pt-safe">
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
                Começar grátis
              </Link>
            </div>
          )}
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-gradient-to-b from-brand-50 to-white" />
          <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 pb-16 pt-10 md:grid-cols-[1.1fr_1fr] md:pt-16">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                <Check className="h-3.5 w-3.5" /> Para prestadores de serviço
              </span>
              <h1 className="mt-4 text-[2.25rem] font-extrabold leading-[1.08] tracking-tight text-ink-900 md:text-[3.2rem]">
                Orçamentos que <span className="text-brand-600">fecham sozinhos.</span>
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-ink-600 md:text-lg">
                Mande um link profissional pelo WhatsApp. Seu cliente escolhe extras, aprova e paga o sinal no Pix, e você
                acompanha tudo ao vivo.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href={startHref} className={buttonClass("primary", "xl")}>
                  Começar grátis <ArrowRight className="h-5 w-5" />
                </Link>
                <a href="/assinar" className={buttonClass("outline", "xl")}>
                  <Crown className="h-5 w-5 text-amber-500" /> Assinar PRO · {PRO_PRICE_LABEL}
                </a>
              </div>
              <p className="mt-3 text-sm text-ink-500">
                {FREE_QUOTE_LIMIT} orçamentos grátis · Sem cartão · Cancele quando quiser
              </p>
            </div>
            <Phone src="/landing/cliente-proposta.webp" alt="Proposta interativa vista pelo cliente no celular" className="mx-auto w-full max-w-[290px] md:max-w-[310px]" priority />
          </div>
        </section>

        {/* Como funciona */}
        <section className="border-t border-ink-100 bg-ink-50/60">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <h2 className="text-center text-2xl font-extrabold tracking-tight md:text-3xl">Como funciona</h2>
            <div className="mt-10 grid gap-12 md:grid-cols-3 md:gap-8">
              {steps.map((s, i) => (
                <div key={s.title} className="flex flex-col items-center text-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
                  <h3 className="mt-3 text-lg font-bold md:min-h-[3.5rem]">{s.title}</h3>
                  <p className="mt-1 max-w-xs text-sm leading-relaxed text-ink-600 md:min-h-[2.5rem]">{s.text}</p>
                  <Phone src={s.img} alt={s.alt} className="mt-6 w-full max-w-[210px] md:max-w-[250px]" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-center text-2xl font-extrabold tracking-tight md:text-3xl">Tudo para fechar mais, sem insistir</h2>
          <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 md:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  <b.icon className="h-5 w-5 text-brand-600" />
                </span>
                <div>
                  <h3 className="font-bold">{b.title}</h3>
                  <p className="text-sm text-ink-600">{b.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="scroll-mt-20 border-t border-ink-100 bg-ink-50/60">
          <div className="mx-auto max-w-3xl px-4 py-16">
            <h2 className="text-center text-2xl font-extrabold tracking-tight md:text-3xl">Comece grátis ou vá direto para o PRO</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="flex flex-col rounded-3xl bg-white p-6 ring-1 ring-ink-200">
                <p className="font-semibold text-ink-600">Grátis</p>
                <p className="mt-1 text-3xl font-extrabold">R$ 0</p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink-700">
                  {[`${FREE_QUOTE_LIMIT} orçamentos para testar`, "Todas as funções incluídas", "Sem cartão de crédito"].map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check className="h-5 w-5 shrink-0 text-brand-600" /> {t}
                    </li>
                  ))}
                </ul>
                <Link href={startHref} className={buttonClass("outline", "lg", "mt-6 w-full")}>
                  Começar grátis
                </Link>
              </div>
              <div className="flex flex-col rounded-3xl bg-ink-900 p-6 text-white">
                <p className="flex items-center gap-2 font-semibold text-brand-300">
                  <Crown className="h-4 w-4 text-amber-400" /> PRO
                </p>
                <p className="mt-1 text-3xl font-extrabold">
                  R$ 29<span className="text-base font-medium text-ink-400">/mês</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink-200">
                  {["Orçamentos ilimitados", "Todas as funções incluídas", "Sem fidelidade, cancele quando quiser"].map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check className="h-5 w-5 shrink-0 text-brand-400" /> {t}
                    </li>
                  ))}
                </ul>
                <a href="/assinar" className={buttonClass("primary", "lg", "mt-6 w-full")}>
                  Assinar PRO agora <ArrowRight className="h-5 w-5" />
                </a>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-ink-400">
                  <Lock className="h-3.5 w-3.5" /> Pagamento seguro pela Cakto
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Perguntas */}
        <section className="mx-auto max-w-2xl px-4 py-16">
          <h2 className="text-center text-2xl font-extrabold tracking-tight md:text-3xl">Perguntas frequentes</h2>
          <div className="mt-8 divide-y divide-ink-100 rounded-2xl ring-1 ring-ink-100">
            {faq.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-ink-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Chamada final */}
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-12 text-center text-white">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Seu próximo orçamento já pode fechar sozinho.</h2>
            <p className="mt-2 text-brand-100">Teste agora, direto no seu celular.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={startHref} className={buttonClass("primary", "xl", "bg-white text-brand-700 shadow-none hover:bg-brand-50")}>
                Começar grátis <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="/assinar" className={buttonClass("outline", "xl", "bg-transparent text-white ring-white/40 hover:bg-white/10")}>
                Assinar PRO
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-100 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 text-xs text-ink-500">
          <Logo className="text-base" />
          <p>© {new Date().getFullYear()} Orçafy · Orçamentos que fecham sozinhos</p>
        </div>
      </footer>
    </div>
  );
}
