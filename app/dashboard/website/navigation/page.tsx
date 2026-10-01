import { query } from "@/lib/db";
import NavManager from "./NavManager";
export const dynamic = "force-dynamic";
export const metadata = { title: "Navigation" };
export default async function Page() {
  const items = await query<{ id: number; label: string; href: string; visible: number }>(`SELECT id, label, href, visible FROM navigation_items ORDER BY display_order, id`);
  return (<><h1 className="font-display text-4xl font-light mb-2">Navigation</h1>
    <p className="text-sm text-mute mb-10">The menu at the top of your website and in the footer. Rename, reorder or hide items.</p>
    <NavManager initial={items.map((i) => ({ ...i, visible: !!i.visible }))} /></>);
}
