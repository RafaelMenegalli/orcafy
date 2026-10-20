import { WifiOff } from "lucide-react";

export const metadata = { title: "Sem conexão" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100">
        <WifiOff className="h-8 w-8 text-ink-500" />
      </div>
      <h1 className="text-xl font-bold">Você está sem internet</h1>
      <p className="max-w-xs text-sm text-ink-500">
        O Orçafy precisa de conexão para mostrar o Radar em tempo real. Assim que a rede voltar, é só recarregar.
      </p>
    </main>
  );
}
