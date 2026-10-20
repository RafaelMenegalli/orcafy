import Link from "next/link";
import { Logo } from "@/components/logo";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-5 pb-10 pt-safe">
      <Link href="/" className="mt-8 self-start">
        <Logo />
      </Link>
      <div className="mt-10 animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight">Bem-vindo de volta</h1>
        <p className="mt-1 text-sm text-ink-500">Entre para ver quem abriu seus orçamentos.</p>
        <div className="mt-8">
          <AuthForm mode="login" next={next} />
        </div>
      </div>
    </main>
  );
}
