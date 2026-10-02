import { query } from "@/lib/db";
import NavManager from "./NavManager";
export const dynamic = "force-dynamic";
export const metadata = { title: "Navigation" };

const BUILT_IN = [
  { label: "Home", href: "/" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Stories", href: "/stories" },
  { label: "Films", href: "/films" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

export default async function Page() {
  const [items, customPages] = await Promise.all([
    query<{ id: number; label: string; href: string; visible: number }>(`SELECT id, label, href, visible FROM navigation_items ORDER BY display_order, id`),
    query<{ title: string; slug: string }>(`SELECT title, slug FROM custom_pages WHERE published = TRUE ORDER BY title`),
  ]);
  const knownPages = [
    ...BUILT_IN,
    ...customPages.map((p) => ({ label: p.title, href: `/${p.slug}` })),
  ];
  return (
    <>
      <h1 className="font-display text-4xl font-light mb-2">Navigation</h1>
      <p className="text-sm text-mute mb-10">The menu at the top of your website and in the footer. Rename, reorder or hide items.</p>
      <NavManager initial={items.map((i) => ({ ...i, visible: !!i.visible }))} knownPages={knownPages} />
    </>
  );
}

