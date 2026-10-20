import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { CatalogManager } from "@/components/catalog-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Catálogo" };

export default async function CatalogPage() {
  const user = await requireUser();
  const items = await prisma.catalogItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      costMaterial: true,
      costLaborHours: true,
      hourlyRate: true,
      profitMargin: true,
      finalPrice: true,
      isBumpDefault: true,
    },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Catálogo" subtitle="Preços calculados com custo, horas e margem." />
      <CatalogManager items={items} />
    </div>
  );
}
