import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getSession } from "./auth";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export function json<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export async function requireApiUserId() {
  const session = await getSession();
  if (!session) throw new ApiError(401, "Sessão expirada. Faça login novamente.", "UNAUTHORIZED");
  return session.sub;
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "Corpo da requisição inválido.");
  }
  return schema.parse(raw);
}

export function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return json({ error: err.message, code: err.code }, err.status);
  }
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return json({ error: first?.message ?? "Dados inválidos.", issues: err.issues }, 422);
  }
  console.error(err);
  return json({ error: "Erro interno. Tente novamente em instantes." }, 500);
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

export function route<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      return handleError(err);
    }
  };
}
