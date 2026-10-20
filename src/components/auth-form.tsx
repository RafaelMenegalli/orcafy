"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { apiFetch, errorMessage } from "@/lib/client-api";
import { maskPhoneInput } from "@/lib/format";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", businessName: "", email: "", whatsapp: "", password: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === "whatsapp" ? maskPhoneInput(e.target.value) : e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await apiFetch("/api/auth/login", { body: { email: form.email, password: form.password } });
      } else {
        await apiFetch("/api/auth/register", { body: form });
      }
      const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : mode === "register" ? "/app/perfil?welcome=1" : "/app";
      router.replace(dest);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" && (
        <>
          <Input label="Seu nome" autoComplete="name" required value={form.name} onChange={set("name")} placeholder="Rafael Souza" />
          <Input
            label="Nome do negócio"
            required
            value={form.businessName}
            onChange={set("businessName")}
            placeholder="Ex: RS Estética Automotiva"
          />
          <Input
            label="WhatsApp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={form.whatsapp}
            onChange={set("whatsapp")}
            placeholder="(11) 99999-8888"
            hint="Seus clientes vão falar com você por aqui."
          />
        </>
      )}
      <Input
        label="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={form.email}
        onChange={set("email")}
        placeholder="voce@email.com"
      />
      <Input
        label="Senha"
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        required
        minLength={mode === "register" ? 6 : 1}
        value={form.password}
        onChange={set("password")}
        placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"}
      />

      {error && <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">{error}</p>}

      <Button type="submit" size="xl" block loading={loading}>
        {mode === "login" ? "Entrar" : "Criar conta grátis"} {!loading && <ArrowRight className="h-5 w-5" />}
      </Button>

      <p className="text-center text-sm text-ink-600">
        {mode === "login" ? (
          <>
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-semibold text-brand-700">
              Criar grátis
            </Link>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-brand-700">
              Entrar
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
