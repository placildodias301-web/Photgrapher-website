import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { CONFIGS, getCollection, isKind } from "@/lib/collections";
import EditCollection from "./EditCollection";
export const dynamic = "force-dynamic";
export const metadata = { title: "Edit" };

export default async function Page({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (!isKind(kind) || !Number.isInteger(Number(id))) notFound();
  const item = await getCollection(kind, Number(id));
  if (!item) notFound();
  const c = CONFIGS[kind];
  const categories = c.hasCategory ? await query<{ id: number; name: string }>(`SELECT id, name FROM categories WHERE enabled OR id = ? ORDER BY display_order, id`, [item.category_id]) : [];
  return (
    <>
      <Link href={`/dashboard/content/${kind}`} className="text-xs tracking-[0.2em] uppercase text-mute hover:text-gold">← All {c.plural.toLowerCase()}</Link>
      <h1 className="mt-4 mb-10 font-display text-4xl font-light">{item.title}</h1>
      <EditCollection kind={kind} label={c.label} publicBase={c.publicBase} hasCategory={c.hasCategory} categories={categories}
        item={{ ...item, featured: !!item.featured, published: !!item.published, event_date: item.event_date ?? "" }} />
    </>
  );
}
