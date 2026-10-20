/**
 * Gerador de BR Code (Pix estático) no padrão EMVCo MPM, conforme o
 * Manual de Padrões para Iniciação do Pix do Banco Central.
 * TypeScript puro, isomórfico (servidor e navegador).
 */

export type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM";

export type PixPayloadInput = {
  keyType: PixKeyType;
  key: string;
  holderName: string;
  city: string;
  amount?: number;
  txid?: string;
  description?: string;
};

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF, sem reflexão, sem XOR final). */
export function crc16ccitt(input: string): string {
  let crc = 0xffff;
  const bytes = new TextEncoder().encode(input);
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Remove acentos e caracteres fora do conjunto permitido pelo EMV. */
export function sanitizeEmvText(value: string, maxLength: number) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .,\-@/]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function tlv(id: string, value: string) {
  if (value.length > 99) throw new Error(`Campo EMV ${id} excede 99 caracteres.`);
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

const onlyDigits = (v: string) => v.replace(/\D/g, "");

export function isValidCpf(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export function isValidCnpj(cnpj: string) {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + Number(cnpj[i]) * w, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13]);
}

/** Normaliza a chave para o formato exigido no BR Code. Lança erro se inválida. */
export function normalizePixKey(type: PixKeyType, rawKey: string): string {
  const key = rawKey.trim();
  switch (type) {
    case "CPF": {
      const d = onlyDigits(key);
      if (!isValidCpf(d)) throw new Error("CPF inválido para chave Pix.");
      return d;
    }
    case "CNPJ": {
      const d = onlyDigits(key);
      if (!isValidCnpj(d)) throw new Error("CNPJ inválido para chave Pix.");
      return d;
    }
    case "EMAIL": {
      const e = key.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) || e.length > 77) throw new Error("E-mail inválido para chave Pix.");
      return e;
    }
    case "PHONE": {
      let d = onlyDigits(key);
      if (d.length === 10 || d.length === 11) d = `55${d}`;
      if (!/^55\d{10,11}$/.test(d)) throw new Error("Celular inválido. Use DDD + número (ex: 11999998888).");
      return `+${d}`;
    }
    case "RANDOM": {
      const r = key.toLowerCase();
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(r)) {
        throw new Error("Chave aleatória inválida (formato UUID esperado).");
      }
      return r;
    }
  }
}

/** txid: até 25 caracteres alfanuméricos. "***" quando não informado. */
export function sanitizeTxid(txid?: string) {
  const clean = (txid ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 25);
  return clean.length > 0 ? clean : "***";
}

export function buildPixPayload(input: PixPayloadInput): string {
  const key = normalizePixKey(input.keyType, input.key);
  const name = sanitizeEmvText(input.holderName, 25).toUpperCase();
  const city = sanitizeEmvText(input.city || "SAO PAULO", 15).toUpperCase();
  if (!name) throw new Error("Nome do titular Pix é obrigatório.");
  if (!city) throw new Error("Cidade do titular Pix é obrigatória.");

  let merchantAccount = tlv("00", "br.gov.bcb.pix") + tlv("01", key);
  if (input.description) {
    const desc = sanitizeEmvText(input.description, 72);
    // O campo 26 inteiro precisa caber em 99 caracteres.
    const room = 99 - merchantAccount.length - 4;
    if (desc && room > 0) merchantAccount += tlv("02", desc.slice(0, room));
  }

  let payload = tlv("00", "01") + tlv("26", merchantAccount) + tlv("52", "0000") + tlv("53", "986");

  if (input.amount !== undefined && input.amount > 0) {
    payload += tlv("54", input.amount.toFixed(2));
  }

  payload += tlv("58", "BR") + tlv("59", name) + tlv("60", city) + tlv("62", tlv("05", sanitizeTxid(input.txid)));

  payload += "6304";
  return payload + crc16ccitt(payload);
}

/** Valida o CRC de um payload existente. */
export function isValidPixPayload(payload: string) {
  if (payload.length < 8 || payload.slice(-8, -4) !== "6304") return false;
  return crc16ccitt(payload.slice(0, -4)) === payload.slice(-4).toUpperCase();
}

export function tryBuildPixPayload(
  input: PixPayloadInput,
): { payload: string; error: null } | { payload: null; error: string } {
  try {
    return { payload: buildPixPayload(input), error: null };
  } catch (e) {
    return { payload: null, error: e instanceof Error ? e.message : "Configuração Pix inválida." };
  }
}

export const PIX_KEY_LABELS: Record<PixKeyType, string> = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "E-mail",
  PHONE: "Celular",
  RANDOM: "Chave aleatória",
};

export const PIX_KEY_PLACEHOLDERS: Record<PixKeyType, string> = {
  CPF: "000.000.000-00",
  CNPJ: "00.000.000/0000-00",
  EMAIL: "voce@email.com",
  PHONE: "(11) 99999-8888",
  RANDOM: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
};
