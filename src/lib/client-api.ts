export class ClientApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  options: { method?: string; body?: unknown; keepalive?: boolean } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? (options.body ? "POST" : "GET"),
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      keepalive: options.keepalive,
      cache: "no-store",
    });
  } catch {
    throw new ClientApiError("Sem conexão. Verifique sua internet.", 0, "NETWORK");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
  if (!res.ok) {
    throw new ClientApiError(data.error ?? "Algo deu errado.", res.status, data.code);
  }
  return data as T;
}

export function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Algo deu errado.";
}
