import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { quoteInclude, syncExpiration, quoteTotals } from "@/lib/data";
import { formatBRL } from "@/lib/money";
import { firstName } from "@/lib/format";
import { normalizePixKey } from "@/lib/pix";
import { getBaseUrl } from "@/lib/url";
import { PublicQuote, type ProviderDTO } from "@/components/public-quote";
import type { QuoteStatusValue } from "@/lib/quote";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  return prisma.quote.findUnique({
    where: { slug },
    include: {
      ...quoteInclude,
      user: {
        select: {
          name: true,
          businessName: true,
          whatsapp: true,
          logoUrl: true,
          bio: true,
          portfolioUrls: true,
          pixKeyType: true,
          pixKey: true,
          pixHolderName: true,
          pixCity: true,
        },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const q = await load(slug);
  if (!q) return { title: "Orçamento não encontrado", robots: { index: false } };
  const total = quoteTotals(q).total;
  return {
    title: `${q.title} · ${q.user.businessName}`,
    description: `Proposta para ${firstName(q.clientName)}: ${formatBRL(total)}. Veja os detalhes e aprove em um toque.`,
    robots: { index: false, follow: false },
    openGraph: {
      title: `Orçamento: ${q.title}`,
      description: `${q.user.businessName} preparou uma proposta de ${formatBRL(total)} para você.`,
    },
  };
}

export default async function PublicQuotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await load(slug);
  if (!found) notFound();
  const quote = await syncExpiration(found);
  const [session, baseUrl] = await Promise.all([getSession(), getBaseUrl()]);
  const u = quote.user;

  let pix: ProviderDTO["pix"] = null;
  if (u.pixKey && u.pixHolderName) {
    try {
      pix = {
        keyType: u.pixKeyType,
        key: normalizePixKey(u.pixKeyType, u.pixKey),
        holderName: u.pixHolderName,
        city: u.pixCity || "SAO PAULO",
      };
    } catch {
      pix = null;
    }
  }

  return (
    <PublicQuote
      isOwner={session?.sub === quote.userId}
      pageUrl={`${baseUrl}/p/${quote.slug}`}
      provider={{
        name: u.name,
        businessName: u.businessName,
        whatsapp: u.whatsapp,
        logoUrl: u.logoUrl,
        bio: u.bio,
        portfolioUrls: u.portfolioUrls,
        pix,
      }}
      quote={{
        slug: quote.slug,
        clientName: quote.clientName,
        title: quote.title,
        description: quote.description,
        deliveryTime: quote.deliveryTime,
        warrantyText: quote.warrantyText,
        discount: quote.discount,
        downPaymentPercent: quote.downPaymentPercent,
        status: quote.status as QuoteStatusValue,
        expiresAt: quote.expiresAt.toISOString(),
        approvedAt: quote.approvedAt?.toISOString() ?? null,
        createdAt: quote.createdAt.toISOString(),
        items: quote.items.map((i) => ({ id: i.id, name: i.name, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
        bumps: quote.bumps.map((b) => ({ id: b.id, name: b.name, description: b.description, price: b.price, selected: b.selected })),
      }}
    />
  );
}
