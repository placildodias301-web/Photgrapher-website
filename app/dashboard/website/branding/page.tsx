import { getSiteSettings } from "@/lib/settings";
import BrandingForm from "./BrandingForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Branding" };
export default async function Page() {
  return (<><h1 className="font-display text-4xl font-light mb-2">Branding</h1>
    <p className="text-sm text-mute mb-10">Your website name, logo and favicon. Changes appear on the public site straight away.</p>
    <BrandingForm initial={await getSiteSettings()} /></>);
}
