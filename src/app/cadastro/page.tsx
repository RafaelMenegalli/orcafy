import Link from "next/link";
import { Logo } from "@/components/logo";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-5 pb-10 pt-safe">
      <Link href="/" className="mt-8 self-start">
        <Logo />
      </Link>
      <div className="mt-8 animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight">Crie sua conta grátis</h1>
        <p className="mt-1 text-sm text-ink-500">Seu primeiro orçamento interativo sai em 60 segundos.</p>
        <div className="mt-7">
          <AuthForm mode="register" />
        </div>
      </div>
    </main>
  );
}
