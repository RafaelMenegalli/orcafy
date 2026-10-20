import { firstName } from "./format";
import { formatBRL } from "./money";

const fmtDeadline = (d: Date | string) =>
  new Date(d).toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

export function sendQuoteMessage(p: {
  clientName: string;
  providerName: string;
  businessName: string;
  title: string;
  url: string;
  total: number;
  expiresAt: Date | string;
}) {
  return [
    `Olá, ${firstName(p.clientName)}! Aqui é ${firstName(p.providerName)}, da ${p.businessName}. 👋`,
    ``,
    `Preparei seu orçamento de *${p.title}* (${formatBRL(p.total)}).`,
    `É só tocar no link para ver os detalhes, escolher opcionais e aprovar:`,
    p.url,
    ``,
    `⏳ Válido até ${fmtDeadline(p.expiresAt)}.`,
  ].join("\n");
}

export function followUpMessage(p: { clientName: string; title: string; url: string; expiresAt: Date | string }) {
  return [
    `Oi, ${firstName(p.clientName)}! Tudo bem?`,
    `Vi que você deu uma olhada no orçamento de *${p.title}*. Ficou alguma dúvida que eu possa esclarecer?`,
    ``,
    `Consigo manter esse valor até ${fmtDeadline(p.expiresAt)}. O link é este: ${p.url}`,
  ].join("\n");
}

export function approvedThanksMessage(p: { clientName: string; title: string }) {
  return `Oi, ${firstName(p.clientName)}! Recebi a aprovação do orçamento de *${p.title}*. Muito obrigado pela confiança! 🙌 Já vou organizar tudo e te passo os próximos passos.`;
}

export function clientApprovedMessage(p: { providerName: string; title: string; downPayment: number; url: string }) {
  return [
    `Olá, ${firstName(p.providerName)}! Acabei de aprovar o orçamento de *${p.title}*.`,
    p.downPayment > 0 ? `Já fiz o Pix do sinal de ${formatBRL(p.downPayment)}. Segue o comprovante:` : `Podemos combinar os próximos passos?`,
    ``,
    p.url,
  ].join("\n");
}

export function clientQuestionMessage(p: { providerName: string; title: string; url: string }) {
  return `Olá, ${firstName(p.providerName)}! Estou vendo o orçamento de *${p.title}* e tenho uma dúvida: \n\n(${p.url})`;
}

export function clientExpiredMessage(p: { providerName: string; title: string; url: string }) {
  return `Olá, ${firstName(p.providerName)}! O orçamento de *${p.title}* expirou, mas ainda tenho interesse. Consegue renovar pra mim? (${p.url})`;
}
