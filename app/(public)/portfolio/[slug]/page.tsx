import { notFound } from "next/navigation";
import Link from "next/link";
import { getShootBySlug } from "@/lib/public";
import { formatDate } from "@/lib/format";
import PhotoGrid from "@/components/gallery/PhotoGrid";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const s = await getShootBySlug((await params).slug);
  return { title: s ? s.name : "Not found", description: s?.description ?? undefined };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const shoot = await getShootBySlug((await params).slug);
  if (!shoot) notFound();
  const photos = shoot.images.map((img) => ({ ...img, title: shoot.name, category: shoot.category, href: undefined }));
  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-28 pt-36 lg:px-12">
      <Link href="/portfolio" className="text-xs tracking-[0.25em] uppercase text-mute hover:text-gold">← Portfolio</Link>
      <header className="mt-6 mb-14 max-w-3xl">
        {shoot.category && <p className="mb-4 text-[11px] tracking-[0.35em] text-gold uppercase">{shoot.category}</p>}
        <h1 className="font-display text-5xl font-light md:text-7xl">{shoot.name}</h1>
        <p className="mt-5 text-sm tracking-wide text-mute">{[shoot.location, shoot.event_date && formatDate(shoot.event_date)].filter(Boolean).join(" · ")}</p>
        {shoot.description && <p className="mt-8 max-w-2xl whitespace-pre-wrap leading-relaxed text-paper/80">{shoot.description}</p>}
      </header>
      {photos.length === 0 ? <p className="text-mute">The gallery for this project is on its way.</p> : <PhotoGrid initial={photos} total={photos.length} pageSize={photos.length} captions={false} />}
    </div>
  );
}
