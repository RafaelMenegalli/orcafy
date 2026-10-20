"use client";

import { useCallback, useEffect, useRef } from "react";

function detectDevice() {
  const ua = navigator.userAgent;
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "celular";
  return "computador";
}

/**
 * Rastreamento do Radar na página pública:
 * - VIEWED uma vez por sessão da aba
 * - heartbeat de tempo visível a cada 15s (alimenta "está vendo agora")
 * - envio final via sendBeacon ao sair/ocultar a aba
 */
export function useQuoteTracking(slug: string, enabled: boolean) {
  const endpoint = `/api/public/quotes/${slug}/track`;
  const visibleSince = useRef<number | null>(null);
  const pendingMs = useRef(0);
  const sinceFinalMs = useRef(0);

  const send = useCallback(
    (body: Record<string, unknown>, beacon = false) => {
      const payload = JSON.stringify(body);
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }));
        return;
      }
      fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
    },
    [endpoint],
  );

  const track = useCallback(
    (type: "PIX_OPENED" | "PIX_COPIED", amount?: number) => {
      if (enabled) send({ type, amount });
    },
    [enabled, send],
  );

  useEffect(() => {
    if (!enabled) return;

    const viewKey = `orcafy:viewed:${slug}`;
    let alreadyViewed = false;
    try {
      alreadyViewed = sessionStorage.getItem(viewKey) === "1";
      sessionStorage.setItem(viewKey, "1");
    } catch {
      /* storage bloqueado: conta a visualização mesmo assim */
    }
    if (!alreadyViewed) {
      send({ type: "VIEWED", device: detectDevice(), referrer: document.referrer ? new URL(document.referrer).hostname : undefined });
    }

    const accumulate = () => {
      if (visibleSince.current !== null) {
        const now = Date.now();
        const delta = now - visibleSince.current;
        pendingMs.current += delta;
        sinceFinalMs.current += delta;
        visibleSince.current = now;
      }
    };

    const flush = (final: boolean) => {
      accumulate();
      const seconds = Math.min(60, Math.round(pendingMs.current / 1000));
      const sessionSeconds = Math.round(sinceFinalMs.current / 1000);
      if (seconds <= 0 && !final) return;
      pendingMs.current = 0;
      if (final) sinceFinalMs.current = 0;
      send({ type: "TIME_SPENT", seconds, final, sessionSeconds }, final);
    };

    if (document.visibilityState === "visible") visibleSince.current = Date.now();

    const heartbeat = setInterval(() => {
      if (document.visibilityState === "visible") flush(false);
    }, 15000);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush(true);
        visibleSince.current = null;
      } else {
        visibleSince.current = Date.now();
      }
    };
    const onPageHide = () => {
      if (visibleSince.current !== null) {
        flush(true);
        visibleSince.current = null;
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [enabled, slug, send]);

  return { track };
}
