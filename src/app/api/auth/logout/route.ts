import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

function safeNext(url: URL) {
  const next = url.searchParams.get("next") ?? "/login";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/login";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const res = NextResponse.redirect(new URL(safeNext(url), url.origin));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
