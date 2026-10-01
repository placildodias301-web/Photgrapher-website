import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { getSiteSettings } from "@/lib/settings";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-cormorant",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Brand name, description and favicon come from the CMS, so never cache statically.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: { default: s.site_name, template: `%s — ${s.site_name}` },
    description: s.site_description ?? undefined,
    icons: s.favicon_url ? { icon: s.favicon_url } : undefined,
    openGraph: { title: s.site_name, description: s.site_description ?? undefined, type: "website" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSiteSettings();
  const accent = s.accent_color && /^#[0-9a-fA-F]{6}$/.test(s.accent_color) ? s.accent_color : null;
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}
          style={accent ? ({ ["--accent" as string]: accent } as React.CSSProperties) : undefined}>
      <body>{children}</body>
    </html>
  );
}
