import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { CONFIGS, isKind } from "@/lib/collections";
import NewCollectionForm from "./NewCollectionForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Add new" };

export default async function Page({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!isKind(kind)) notFound();
  const c = CONFIGS[kind];
  const categories = c.hasCategory ? await query<{ id: number; name: string }>(`SELECT id, name FROM categories WHERE enabled ORDER BY display_order, id`) : [];
  return (<><h1 className="font-display text-4xl font-light mb-2">Add new {c.label.toLowerCase()}</h1>
    <p className="text-sm text-mute mb-10">Fill in the details, choose a cover, and upload photos. You can add more later.</p>
    <NewCollectionForm kind={kind} label={c.label} hasCategory={c.hasCategory} categories={categories} /></>);
}
