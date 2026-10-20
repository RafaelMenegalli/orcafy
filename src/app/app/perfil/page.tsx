import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Perfil" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser();
  const { welcome } = await searchParams;
  const support = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, "") || null;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Perfil" subtitle={user.email} />
      <ProfileForm
        welcome={welcome === "1"}
        supportWhatsapp={support}
        profile={{
          name: user.name,
          businessName: user.businessName,
          email: user.email,
          whatsapp: user.whatsapp,
          logoUrl: user.logoUrl,
          bio: user.bio,
          portfolioUrls: user.portfolioUrls,
          pixKeyType: user.pixKeyType,
          pixKey: user.pixKey,
          pixHolderName: user.pixHolderName,
          pixCity: user.pixCity,
          defaultDownPayment: user.defaultDownPayment,
          defaultWarrantyText: user.defaultWarrantyText,
          plan: user.plan,
          quotesCreatedCount: user.quotesCreatedCount,
        }}
      />
    </div>
  );
}
