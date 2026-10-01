import Link from "next/link";
import { query } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import SocialManager from "./SocialManager";
export const dynamic = "force-dynamic";
export const metadata = { title: "Social & Contact" };
export default async function Page() {
  const [s, socials] = await Promise.all([getSiteSettings(), query<{ id: number; platform_name: string; url: string; username: string | null; icon: string | null; enabled: number }>(`SELECT id, platform_name, url, username, icon, enabled FROM social_platforms ORDER BY display_order, id`)]);
  return (<><h1 className="font-display text-4xl font-light mb-2">Social &amp; Contact</h1>
    <p className="text-sm text-mute mb-10">Your contact details and social links. They appear in the footer and on the Contact page. Your <Link href="/dashboard/settings/account" className="underline hover:text-gold">recovery email</Link> is private and set under Account &amp; Security.</p>
    <SocialManager contact={{ phone: s.phone ?? "", whatsapp: s.whatsapp ?? "", public_email: s.public_email ?? "", location: s.location ?? "", maps_url: s.maps_url ?? "" }} initial={socials.map((x) => ({ ...x, enabled: !!x.enabled }))} /></>);
}
