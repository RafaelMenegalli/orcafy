import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/url";
import { FREE_QUOTE_LIMIT } from "@/lib/quote";
import { PageHeader } from "@/components/page-header";
import { QuoteBuilder, type QuoteDraft } from "@/components/quote-builder";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo orçamento" };

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const user = await requireUser();
  const { from } = await searchParams;

  const [catalog, source, baseUrl] = await Promise.all([
    prisma.catalogItem.findMany({
      where: { userId: user.id },
      orderBy: [{ isBumpDefault: "asc" }, { createdAt: "desc" }],
      select: { id: true, name: true, description: true, finalPrice: true, isBumpDefault: true },
    }),
    from
      ? prisma.quote.findFirst({
          where: { id: from, userId: user.id },
          include: { items: { orderBy: { id: "asc" } }, bumps: { orderBy: { id: "asc" } } },
        })
      : null,
    getBaseUrl(),
  ]);

  const draft: QuoteDraft | null = source
    ? {
        clientName: source.clientName,
        clientWhatsapp: source.clientWhatsapp,
        title: source.title,
        description: source.description ?? "",
        deliveryTime: source.deliveryTime,
        warrantyText: source.warrantyText ?? "",
        discount: source.discount,
        downPaymentPercent: source.downPaymentPercent,
        items: source.items.map((i) => ({ name: i.name, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
        bumps: source.bumps.map((b) => ({ name: b.name, description: b.description, price: b.price })),
      }
    : null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        back="/app/orcamentos"
        title={source ? "Duplicar orçamento" : "Novo orçamento"}
        subtitle={source ? `Baseado no orçamento de ${source.clientName}` : "Pronto para enviar em 60 segundos"}
      />
      <QuoteBuilder
        catalog={catalog}
        draft={draft}
        baseUrl={baseUrl}
        defaults={{
          downPaymentPercent: user.defaultDownPayment,
          warrantyText: user.defaultWarrantyText ?? "",
        }}
        user={{ name: user.name, businessName: user.businessName, hasPix: Boolean(user.pixKey) }}
        limitReached={user.plan === "FREE" && user.quotesCreatedCount >= FREE_QUOTE_LIMIT}
      />
    </div>
  );
}
