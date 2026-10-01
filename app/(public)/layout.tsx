import Navbar from "@/components/navigation/Navbar";
import Cursor from "@/components/ui/Cursor";
import Footer from "@/components/layout/Footer";
import { getSessionUser } from "@/lib/auth";
import { getNavigation, getSiteSettings, getSocials } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [s, nav, socials, user] = await Promise.all([getSiteSettings(), getNavigation(), getSocials(), getSessionUser()]);

  // Maintenance mode hides the site from visitors, never from the signed-in photographer.
  if (s.maintenance_mode && !user) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <p className="mb-4 text-[11px] tracking-[0.35em] text-gold uppercase">Back soon</p>
          <h1 className="font-display text-5xl font-light md:text-7xl">{s.site_name}</h1>
          <p className="mx-auto mt-6 max-w-md text-mute">The website is being refreshed. Please check back shortly.</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-paper focus:px-4 focus:py-2 focus:text-ink">Skip to content</a>
      <Cursor />
      <Navbar siteName={s.site_name} logoUrl={s.logo_url} items={nav} />
      <main id="main">{children}</main>
      <Footer s={s} nav={nav} socials={socials} />
    </>
  );
}
