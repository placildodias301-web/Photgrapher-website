import { query } from "@/lib/db";
import PagesManager from "./PagesManager";
export const dynamic = "force-dynamic";
export const metadata = { title: "Pages" };

export default async function Page() {
  const items = await query<{ id: number; title: string; slug: string; published: number }>(
    `SELECT id, title, slug, published FROM custom_pages ORDER BY updated_at DESC, id DESC`);
  return (<><h1 className="font-display text-4xl font-light mb-2">Pages</h1>
    <p className="text-sm text-mute mb-10 max-w-2xl">
      Extra one-off pages that aren&apos;t part of the main site (Home, Portfolio, Stories, Films, About,
      Services, Contact). Create one here, then go to Website → Navigation and add a menu item pointing to
      its address (shown below each page) so visitors can find it.
    </p>
    <PagesManager initial={items.map((i) => ({ ...i, published: !!i.published }))} /></>);
}
