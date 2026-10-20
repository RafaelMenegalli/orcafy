import { requireUser } from "@/lib/auth";
import { caktoConfig } from "@/lib/billing";
import { isProActive } from "@/lib/plan";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Perfil" };

function checkoutHref(email: string, name: string) {
  const url = new URL(caktoConfig.checkoutUrl);
  url.searchParams.set("email", email);
  url.searchParams.set("name", name);
  return url.toString();
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string; pro?: string }> }) {
  const user = await requireUser();
  const { welcome, pro } = await searchParams;
  const support = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, "") || null;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Perfil" subtitle={user.email} />
      <ProfileForm
        welcome={welcome === "1"}
        supportWhatsapp={support}
        billing={{
          isPro: isProActive(user),
          planStatus: user.planStatus,
          planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
          checkoutHref: checkoutHref(user.email, user.name),
          justPaid: pro === "1",
        }}
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
          quotesCreatedCount: user.quotesCreatedCount,
        }}
      />
    </div>
  );
}
