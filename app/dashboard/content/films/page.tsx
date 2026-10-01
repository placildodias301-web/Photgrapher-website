import { query } from "@/lib/db";
import { listFilms } from "@/lib/films";
import FilmsManager from "./FilmsManager";
export const dynamic = "force-dynamic";
export const metadata = { title: "Films / Videos" };

export default async function Page() {
  const [films, cats] = await Promise.all([listFilms(), query<{ name: string }>(`SELECT name FROM categories WHERE enabled ORDER BY display_order, id`)]);
  return (<><h1 className="font-display text-4xl font-light mb-2">Films / Videos</h1>
    <p className="text-sm text-mute mb-10">Upload wedding films and reels. Videos never autoplay on your website, so pages stay fast.</p>
    <FilmsManager categories={cats.map((c) => c.name)} initial={films.map((f) => ({ ...f, featured: !!f.featured, published: !!f.published, event_date: f.event_date ?? "" }))} /></>);
}
