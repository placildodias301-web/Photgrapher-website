import { query } from "@/lib/db";
import CategoriesManager from "./CategoriesManager";
export const dynamic = "force-dynamic";
export const metadata = { title: "Categories" };

export default async function Page() {
  const items = await query<{ id: number; name: string; enabled: number; shoot_count: number }>(
    `SELECT c.id, c.name, c.enabled, (SELECT COUNT(*) FROM shoots s WHERE s.category_id = c.id) AS shoot_count
       FROM categories c ORDER BY c.display_order, c.id`);
  return (<><h1 className="font-display text-4xl font-light mb-2">Categories</h1>
    <p className="text-sm text-mute mb-10">Categories group your shoots and power the filters on your portfolio. Add as many as you like.</p>
    <CategoriesManager initial={items.map((i) => ({ ...i, enabled: !!i.enabled }))} /></>);
}
