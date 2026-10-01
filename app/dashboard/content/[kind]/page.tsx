import Link from "next/link";
import { notFound } from "next/navigation";
import { CONFIGS, isKind, listCollection } from "@/lib/collections";
import CollectionList from "./CollectionList";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  return { title: isKind(kind) ? CONFIGS[kind].plural : "Content" };
}

export default async function Page({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!isKind(kind)) notFound();
  const c = CONFIGS[kind];
  const items = await listCollection(kind);
  return (
    <>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-light">{kind === "shoots" ? "Shoots / Projects" : "Albums / Stories"}</h1>
          <p className="mt-2 text-sm text-mute">{kind === "shoots" ? "Each shoot gets its own page on your website automatically once published." : "Editorial stories and albums with a cover and gallery."}</p>
        </div>
        <Link href={`/dashboard/content/${kind}/new`} className="bg-paper px-6 py-3 text-[11px] tracking-[0.22em] uppercase text-ink hover:bg-gold transition-colors">Add new {c.label.toLowerCase()}</Link>
      </div>
      <CollectionList kind={kind} publicBase={c.publicBase} label={c.label.toLowerCase()}
        items={items.map((i) => ({ ...i, featured: !!i.featured, published: !!i.published }))} />
    </>
  );
}
