import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import { Bell } from "@/components/dashboard/NotificationCenter";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Middleware only checks a cookie exists; this is the real check against the DB.
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const s = await getSiteSettings();
  return (
    <div className="min-h-dvh bg-ink">
      <Sidebar siteName={s.site_name} displayName={user.display_name} />
      <main className="lg:pl-64">
        <div className="hidden lg:flex items-center justify-end gap-3 border-b border-line px-10 py-3">
          <Link href="/" target="_blank" className="border border-line px-4 py-2 text-[11px] tracking-[0.2em] uppercase hover:border-gold hover:text-gold transition-colors">View website ↗</Link>
          <Bell />
        </div>
        <div className="mx-auto max-w-5xl px-5 py-10 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
