import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { buttonClass } from "@/lib/button-class";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100">
        <FileQuestion className="h-8 w-8 text-ink-500" />
      </div>
      <h1 className="text-xl font-bold">Página não encontrada</h1>
      <p className="max-w-xs text-sm text-ink-500">
        O link pode ter sido digitado errado ou o orçamento foi removido pelo prestador.
      </p>
      <Link href="/" className={buttonClass("dark", "lg")}>
        Ir para o início
      </Link>
    </main>
  );
}
