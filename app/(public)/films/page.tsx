import { getPublishedFilms } from "@/lib/public";
import FilmCard from "./FilmCard";
export const dynamic = "force-dynamic";
export const metadata = { title: "Films" };

export default async function Page() {
  const films = await getPublishedFilms();
  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-28 pt-36 lg:px-12">
      <header className="mb-16"><p className="mb-4 text-[11px] tracking-[0.35em] text-gold uppercase">Films</p><h1 className="font-display text-5xl font-light md:text-7xl">Cinematic Films</h1></header>
      {films.length === 0 ? <p className="text-mute">Films are on their way — please check back soon.</p> : (
        <div className="grid gap-10 md:grid-cols-2">{films.map((f) => <FilmCard key={f.id} film={f} />)}</div>
      )}
    </div>
  );
}
