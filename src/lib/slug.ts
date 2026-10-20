import { randomInt } from "node:crypto";

const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"; // sem 0/o/1/l/i ambíguos

export function generateSlug(length = 7) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}
