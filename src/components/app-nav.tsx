"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Package, Plus, Radar, UserRound, LogOut } from "lucide-react";
import { cn } from "@/lib/format";
import { Logo } from "@/components/logo";

const tabs = [
  { href: "/app", label: "Radar", icon: Radar, exact: true },
  { href: "/app/orcamentos", label: "Orçamentos", icon: FileText },
  { href: "/app/orcamentos/novo", label: "Novo", icon: Plus, primary: true },
  { href: "/app/catalogo", label: "Catálogo", icon: Package },
  { href: "/app/perfil", label: "Perfil", icon: UserRound },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href === "/app/orcamentos") return pathname.startsWith(href) && !pathname.startsWith("/app/orcamentos/novo");
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 backdrop-blur pb-safe lg:hidden">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {tabs.map((t) => {
          const active = isActive(pathname, t.href, t.exact);
          if (t.primary) {
            return (
              <Link key={t.href} href={t.href} className="flex items-center justify-center" aria-label="Novo orçamento">
                <span
                  className={cn(
                    "-mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition active:scale-95",
                    active && "ring-4 ring-brand-100",
                  )}
                >
                  <Plus className="h-7 w-7" strokeWidth={2.5} />
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition",
                active ? "text-brand-700" : "text-ink-500",
              )}
            >
              <t.icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.9} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SideNav({ businessName }: { businessName: string }) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-ink-100 bg-white px-4 py-6 lg:flex">
      <Link href="/app" className="px-2">
        <Logo />
      </Link>
      <p className="mt-1 truncate px-2 text-xs text-ink-500">{businessName}</p>
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {tabs.map((t) => {
          const active = isActive(pathname, t.href, t.exact);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                t.primary
                  ? "mb-2 bg-brand-600 text-white hover:bg-brand-700"
                  : active
                    ? "bg-ink-100 text-ink-900"
                    : "text-ink-600 hover:bg-ink-50",
              )}
            >
              <t.icon className="h-5 w-5" />
              {t.primary ? "Novo orçamento" : t.label}
            </Link>
          );
        })}
      </nav>
      <a
        href="/api/auth/logout?next=/login"
        className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-ink-500 hover:bg-ink-50"
      >
        <LogOut className="h-5 w-5" /> Sair
      </a>
    </aside>
  );
}
