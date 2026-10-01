import { notFound } from "next/navigation";
import Link from "next/link";
import { getStoryBySlug } from "@/lib/public";
import { formatDate } from "@/lib/format";
import PhotoGrid from "@/components/gallery/PhotoGrid";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const s = await getStoryBySlug((await params).slug);
  return { title: s ? s.title : "Not found", description: s?.description ?? undefined };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const story = await getStoryBySlug((await params).slug);
  if (!story) notFound();
  const photos = story.images.map((img) => ({ ...img, title: story.title }));
  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-28 pt-36 lg:px-12">
      <Link href="/stories" className="text-xs tracking-[0.25em] uppercase text-mute hover:text-gold">← Stories</Link>
      <header className="mt-6 mb-14 max-w-3xl">
        <h1 className="font-display text-5xl font-light md:text-7xl">{story.title}</h1>
        <p className="mt-5 text-sm tracking-wide text-mute">{[story.location, story.event_date && formatDate(story.event_date)].filter(Boolean).join(" · ")}</p>
        {story.description && <p className="mt-8 max-w-2xl whitespace-pre-wrap leading-relaxed text-paper/80">{story.description}</p>}
      </header>
      {photos.length === 0 ? <p className="text-mute">This story’s gallery is on its way.</p> : <PhotoGrid initial={photos} total={photos.length} pageSize={photos.length} captions={false} />}
    </div>
  );
}
