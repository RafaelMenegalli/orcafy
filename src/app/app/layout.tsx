import { requireUser } from "@/lib/auth";
import { BottomNav, SideNav } from "@/components/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh">
      <SideNav businessName={user.businessName} />
      <div className="pb-28 lg:pb-10 lg:pl-64">
        <div className="mx-auto max-w-2xl px-4 pt-safe">{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}
