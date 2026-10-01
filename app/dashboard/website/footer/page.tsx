import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";
import FooterForm from "./FooterForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Footer" };
export default async function Page() {
  const s = await getSiteSettings();
  return (<><h1 className="font-display text-4xl font-light mb-2">Footer</h1>
    <p className="text-sm text-mute mb-10">The strip at the bottom of every page.</p>
    <FooterForm initial={{ footer_description: s.footer_description ?? "", copyright_text: s.copyright_text ?? "" }} siteName={s.site_name} />
    <ul className="mt-12 max-w-2xl space-y-3 border-t border-line pt-8 text-sm text-mute">
      <li>Logo and website name: <Link href="/dashboard/website/branding" className="underline hover:text-gold">Branding</Link></li>
      <li>Menu links: <Link href="/dashboard/website/navigation" className="underline hover:text-gold">Navigation</Link></li>
      <li>Phone, WhatsApp, email, location and social links: <Link href="/dashboard/website/social" className="underline hover:text-gold">Social &amp; Contact</Link></li>
    </ul></>);
}
