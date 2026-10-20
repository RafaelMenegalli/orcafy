"use client";

import { useEffect, useState } from "react";
import { Download, Share, Smartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <p className="flex items-center gap-2 text-sm text-brand-700">
        <CheckCircle2 className="h-4 w-4" /> App instalado na tela inicial.
      </p>
    );
  }

  if (deferred) {
    return (
      <Button
        variant="dark"
        size="lg"
        block
        onClick={async () => {
          await deferred.prompt();
          const choice = await deferred.userChoice;
          if (choice.outcome === "accepted") setInstalled(true);
          setDeferred(null);
        }}
      >
        <Download className="h-5 w-5" /> Instalar Orçafy no celular
      </Button>
    );
  }

  return (
    <div className="flex gap-3 text-sm text-ink-600">
      <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" />
      {isIos ? (
        <p>
          No Safari, toque em <Share className="inline h-4 w-4" /> <strong>Compartilhar</strong> e depois em{" "}
          <strong>Adicionar à Tela de Início</strong>.
        </p>
      ) : (
        <p>
          No Chrome, abra o menu <strong>⋮</strong> e toque em <strong>Instalar app</strong> ou{" "}
          <strong>Adicionar à tela inicial</strong>.
        </p>
      )}
    </div>
  );
}
