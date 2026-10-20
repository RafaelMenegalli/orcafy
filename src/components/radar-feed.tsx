"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, CheckCircle2, Clock, Copy, Eye, QrCode, Sparkles } from "lucide-react";
import { cn, timeAgo, firstName } from "@/lib/format";
import { describeEvent, EVENT_TONE, type RadarEvent, type RadarEventType } from "@/lib/radar";
import { useToast } from "@/components/toast";

type OnlineQuote = { id: string; title: string; clientName: string; lastViewedAt: string | null; viewsCount: number };

const ICONS: Record<RadarEventType, React.ComponentType<{ className?: string }>> = {
  VIEWED: Eye,
  TIME_SPENT: Clock,
  BUMP_TOGGLED: Sparkles,
  PIX_OPENED: QrCode,
  PIX_COPIED: Copy,
  APPROVED: CheckCircle2,
};

const NOTIFY_KEY = "orcafy:notify";

/** Navegadores bloqueiam vibração antes da primeira interação do usuário. */
function canVibrate() {
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  return typeof navigator.vibrate === "function" && (activation ? activation.hasBeenActive : true);
}

function playDing(strong: boolean) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = strong ? [660, 880, 1320] : [880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    /* áudio indisponível */
  }
}

export function RadarFeed({
  initialEvents,
  initialOnline,
  initialServerTime,
}: {
  initialEvents: RadarEvent[];
  initialOnline: OnlineQuote[];
  initialServerTime: string;
}) {
  const toast = useToast();
  const [events, setEvents] = useState(initialEvents);
  const [online, setOnline] = useState(initialOnline);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(true);
  const [notify, setNotify] = useState(false);
  const [, forceTick] = useState(0);
  const sinceRef = useRef(initialServerTime);
  const notifyRef = useRef(false);
  const knownRef = useRef(new Set(initialEvents.map((e) => e.id)));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTIFY_KEY) === "1";
      const granted = typeof Notification !== "undefined" && Notification.permission === "granted";
      setNotify(saved && granted);
      notifyRef.current = saved && granted;
    } catch {
      /* storage indisponível */
    }
  }, []);

  const announce = useCallback((newEvents: RadarEvent[]) => {
    const important = newEvents.filter((e) => e.type !== "TIME_SPENT");
    if (important.length === 0) return;
    const strong = important.some((e) => e.type === "APPROVED" || e.type === "PIX_COPIED");
    const top = important[0];
    const text = describeEvent(top, top.quote.clientName);
    toast(text, "info");
    if (canVibrate()) navigator.vibrate(strong ? [80, 60, 80] : 60);
    if (notifyRef.current) {
      playDing(strong);
      if (document.visibilityState !== "visible" && typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(strong ? "💰 Orçafy: oportunidade quente!" : "📡 Radar Orçafy", {
            body: text,
            icon: "/icons/192",
            tag: top.id,
          });
        } catch {
          /* alguns navegadores móveis exigem service worker para notificações */
        }
      }
    }
  }, [toast]);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/radar?since=${encodeURIComponent(sinceRef.current)}`, { cache: "no-store" });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error("radar");
        const data = (await res.json()) as { serverTime: string; events: RadarEvent[]; online: OnlineQuote[] };
        sinceRef.current = data.serverTime;
        setConnected(true);
        setOnline(data.online);
        const fresh = data.events.filter((e) => !knownRef.current.has(e.id));
        if (fresh.length > 0) {
          fresh.forEach((e) => knownRef.current.add(e.id));
          setEvents((prev) => [...fresh, ...prev].slice(0, 60));
          setFreshIds(new Set(fresh.map((e) => e.id)));
          announce(fresh);
        }
      } catch {
        setConnected(false);
      } finally {
        if (!stopped) timer = setTimeout(poll, document.visibilityState === "visible" ? 4000 : 15000);
      }
    }

    timer = setTimeout(poll, 4000);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        poll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    const tick = setInterval(() => forceTick((n) => n + 1), 10000);
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [announce]);

  async function toggleNotify() {
    if (notify) {
      setNotify(false);
      notifyRef.current = false;
      try {
        localStorage.setItem(NOTIFY_KEY, "0");
      } catch {}
      toast("Alertas desativados", "info");
      return;
    }
    if (typeof Notification === "undefined") {
      toast("Seu navegador não suporta notificações. Instale o app na tela inicial.", "error");
      return;
    }
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm !== "granted") {
      toast("Permissão negada. Ative as notificações nas configurações do navegador.", "error");
      return;
    }
    setNotify(true);
    notifyRef.current = true;
    try {
      localStorage.setItem(NOTIFY_KEY, "1");
    } catch {}
    playDing(false);
    toast("Alertas ativados! Você será avisado com som e notificação.");
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {connected && <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-brand-500" />}
            <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", connected ? "bg-brand-500" : "bg-ink-300")} />
          </span>
          <h2 className="text-base font-bold">Radar ao vivo</h2>
          {!connected && <span className="text-xs text-ink-500">reconectando…</span>}
        </div>
        <button
          type="button"
          onClick={toggleNotify}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition",
            notify ? "bg-brand-50 text-brand-700" : "bg-white text-ink-600 ring-1 ring-ink-200",
          )}
        >
          {notify ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          {notify ? "Alertas ligados" : "Ativar alertas"}
        </button>
      </div>

      {online.length > 0 && (
        <div className="mb-3 space-y-2">
          {online.map((q) => (
            <Link
              key={q.id}
              href={`/app/orcamentos/${q.id}`}
              className="flex items-center gap-3 rounded-2xl bg-brand-600 px-4 py-3 text-white shadow-lg shadow-brand-600/20 animate-fade-up"
            >
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-white" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{firstName(q.clientName)} está vendo seu orçamento agora</p>
                <p className="truncate text-xs text-brand-100">{q.title}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {events.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-ink-200 px-5 py-8 text-center">
          <Eye className="mx-auto h-7 w-7 text-ink-300" />
          <p className="mt-2 text-sm font-semibold text-ink-700">Nenhuma atividade ainda</p>
          <p className="mt-1 text-xs text-ink-500">Envie um orçamento e acompanhe aqui cada abertura, clique e Pix em tempo real.</p>
        </div>
      ) : (
        <ol className="relative space-y-2">
          {events.map((e) => {
            const Icon = ICONS[e.type];
            const tone = EVENT_TONE[e.type];
            return (
              <li key={e.id}>
                <Link
                  href={`/app/orcamentos/${e.quote.id}`}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-ink-100 transition hover:ring-ink-200",
                    freshIds.has(e.id) && "animate-fade-up ring-2 ring-brand-300",
                    e.type === "APPROVED" && "bg-brand-50 ring-brand-200",
                  )}
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tone.bg)}>
                    <Icon className={cn("h-[18px] w-[18px]", tone.fg)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm leading-snug text-ink-800", e.type === "APPROVED" && "font-bold text-brand-800")}>
                      {describeEvent(e, e.quote.clientName)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {e.quote.title} · <time suppressHydrationWarning>{timeAgo(e.createdAt)}</time>
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
