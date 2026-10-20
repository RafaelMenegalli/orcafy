import "server-only";
import { prisma } from "./prisma";
import { getSession } from "./auth";
import { ApiError } from "./api";
import { quoteInclude, syncExpiration } from "./data";

/** Carrega o orçamento público e indica se quem acessa é o próprio dono (pré-visualização). */
export async function loadPublicQuote(slug: string) {
  const found = await prisma.quote.findUnique({ where: { slug }, include: quoteInclude });
  if (!found) throw new ApiError(404, "Orçamento não encontrado.");
  const quote = await syncExpiration(found);
  const session = await getSession();
  const isOwner = session?.sub === quote.userId;
  return { quote, isOwner };
}

export const OPEN_STATUSES = ["DRAFT", "SENT", "VIEWED", "HOT"] as const;

export function isOpenStatus(status: string) {
  return (OPEN_STATUSES as readonly string[]).includes(status);
}
