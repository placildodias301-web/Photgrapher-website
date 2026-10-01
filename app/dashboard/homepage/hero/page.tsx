import { query } from "@/lib/db";
import { getHomepageSettings } from "@/lib/settings";
import HeroManager from "./HeroManager";
export const dynamic = "force-dynamic";
export const metadata = { title: "Homepage hero" };

export default async function Page() {
  const [settings, slides] = await Promise.all([
    getHomepageSettings(),
    query<{ id: number; url: string; alt_text: string | null; active: number }>(
      `SELECT h.id, h.alt_text, h.active, m.file_url AS url FROM hero_slides h JOIN media m ON m.id=h.media_id ORDER BY h.display_order, h.id`),
  ]);
  return (<><h1 className="font-display text-4xl font-light mb-2">Homepage hero</h1>
    <p className="text-sm text-mute mb-10">The large slideshow at the top of your homepage. Upload photos, put them in order, and choose how fast they change.</p>
    <HeroManager initialSettings={settings} initialSlides={slides.map((s) => ({ ...s, active: !!s.active }))} /></>);
}
