import { z } from "zod";
import { isValidWhatsapp, normalizeWhatsapp } from "./format";

const trimmed = (max: number, label: string) =>
  z.string().trim().max(max, `${label}: máximo de ${max} caracteres.`);

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label}: máximo de ${max} caracteres.`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const whatsapp = z
  .string()
  .trim()
  .refine(isValidWhatsapp, "WhatsApp inválido. Use DDD + número.")
  .transform(normalizeWhatsapp);

const money = z.coerce.number().min(0, "Valor não pode ser negativo.").max(10_000_000, "Valor muito alto.");

// Imagens: URL https ou data URL de imagem (upload redimensionado no navegador, ~até 400KB).
const imageRef = z
  .string()
  .trim()
  .max(600_000, "Imagem muito grande.")
  .refine((v) => /^https:\/\/\S+$/i.test(v) || /^data:image\/(png|jpeg|webp);base64,/.test(v), "Imagem inválida.");

export const registerSchema = z.object({
  name: trimmed(80, "Nome").min(2, "Informe seu nome."),
  businessName: trimmed(80, "Nome do negócio").min(2, "Informe o nome do seu negócio."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  whatsapp,
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres.").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const catalogItemSchema = z.object({
  name: trimmed(100, "Nome").min(2, "Dê um nome ao serviço/produto."),
  description: optionalText(400, "Descrição"),
  costMaterial: money.default(0),
  costLaborHours: z.coerce.number().min(0).max(10_000).default(0),
  hourlyRate: money.default(0),
  profitMargin: z.coerce.number().min(0).max(95, "Margem máxima de 95%.").default(30),
  finalPrice: money.refine((v) => v > 0, "Informe o preço final."),
  isBumpDefault: z.boolean().default(false),
});

const quoteItemSchema = z.object({
  name: trimmed(120, "Item").min(1, "Nome do item obrigatório."),
  description: optionalText(300, "Descrição do item"),
  quantity: z.coerce.number().int().min(1, "Quantidade mínima 1.").max(10_000),
  unitPrice: money,
});

const quoteBumpSchema = z.object({
  name: trimmed(120, "Opcional").min(1, "Nome do opcional obrigatório."),
  description: optionalText(300, "Descrição do opcional"),
  price: money.refine((v) => v > 0, "Opcional precisa ter preço."),
});

export const quoteSchema = z.object({
  clientName: trimmed(80, "Cliente").min(2, "Informe o nome do cliente."),
  clientWhatsapp: whatsapp,
  title: trimmed(120, "Título").min(3, "Dê um título ao orçamento."),
  description: optionalText(1000, "Descrição"),
  deliveryTime: trimmed(80, "Prazo").min(2, "Informe o prazo de entrega."),
  warrantyText: optionalText(300, "Garantia"),
  discount: money.default(0),
  downPaymentPercent: z.coerce.number().int().min(0).max(100),
  validityHours: z.coerce.number().int().min(1).max(24 * 90),
  items: z.array(quoteItemSchema).min(1, "Adicione pelo menos 1 item.").max(50),
  bumps: z.array(quoteBumpSchema).max(6, "Máximo de 6 opcionais.").default([]),
});

export const quoteStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "SENT"]),
});

export const quoteExtendSchema = z.object({
  extendHours: z.coerce.number().int().min(1).max(24 * 90),
});

export const profileSchema = z.object({
  name: trimmed(80, "Nome").min(2, "Informe seu nome."),
  businessName: trimmed(80, "Nome do negócio").min(2, "Informe o nome do negócio."),
  whatsapp,
  logoUrl: imageRef.optional().nullable().or(z.literal("")).transform((v) => (v ? v : null)),
  bio: optionalText(400, "Bio"),
  portfolioUrls: z.array(imageRef).max(4, "Máximo de 4 fotos no portfólio.").default([]),
  pixKeyType: z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"]),
  pixKey: optionalText(80, "Chave Pix"),
  pixHolderName: optionalText(25, "Titular Pix"),
  pixCity: optionalText(15, "Cidade Pix"),
  defaultDownPayment: z.coerce.number().int().min(0).max(100),
  defaultWarrantyText: optionalText(300, "Garantia padrão"),
});

export const trackSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("VIEWED"), device: z.string().max(40).optional(), referrer: z.string().max(200).optional() }),
  z.object({
    type: z.literal("TIME_SPENT"),
    seconds: z.coerce.number().int().min(0).max(60),
    final: z.boolean().default(false),
    sessionSeconds: z.coerce.number().int().min(0).max(24 * 3600).optional(),
  }),
  z.object({ type: z.literal("PIX_OPENED"), amount: z.coerce.number().min(0).optional() }),
  z.object({ type: z.literal("PIX_COPIED"), amount: z.coerce.number().min(0).optional() }),
]);

export const bumpToggleSchema = z.object({
  bumpId: z.string().min(1),
  selected: z.boolean(),
});

export type QuoteInput = z.infer<typeof quoteSchema>;
export type CatalogItemInput = z.infer<typeof catalogItemSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
