import { query } from "@/lib/db";
import ServicesManager from "./ServicesManager";
export const dynamic = "force-dynamic";
export const metadata = { title: "Services" };
export default async function Page() {
  const items = await query<{ id: number; name: string; description: string | null; published: number; image_url: string | null }>(
    `SELECT s.id, s.name, s.description, s.published, m.file_url AS image_url FROM services s LEFT JOIN media m ON m.id = s.image_media_id ORDER BY s.display_order, s.id`);
  return (<><h1 className="font-display text-4xl font-light mb-2">Services</h1>
    <p className="text-sm text-mute mb-10">What you offer. Edit the wording, add a photo to each, and put them in the order you like.</p>
    <ServicesManager initial={items.map((i) => ({ ...i, published: !!i.published }))} /></>);
}
