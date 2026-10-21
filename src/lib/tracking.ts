/** Parâmetros de campanha repassados ao checkout (a Cakto registra as UTMs na venda). */
export const TRACKING_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id", "src", "sck", "fbclid", "gclid", "ttclid"] as const;

export function pickTracking(params: URLSearchParams | Record<string, unknown>) {
  const get = (k: string) => (params instanceof URLSearchParams ? params.get(k) : params[k]);
  const out = new URLSearchParams();
  for (const k of TRACKING_PARAMS) {
    const v = get(k);
    if (typeof v === "string" && v) out.set(k, v.slice(0, 200));
  }
  return out;
}
