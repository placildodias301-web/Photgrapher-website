import Link from "next/link";
import type { FilmCard } from "@/lib/public";
import Reveal from "@/components/ui/Reveal";

export default function FeaturedFilms({ items }: { items: FilmCard[] }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="films-h" className="bg-ink-2 py-24 lg:py-36">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
        <Reveal className="mb-14 flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-4 text-[11px] tracking-[0.35em] text-gold uppercase">Films</p><h2 id="films-h" className="font-display text-4xl font-light md:text-6xl">Featured Films</h2></div>
          <Link href="/films" className="text-[11px] tracking-[0.25em] uppercase text-paper/80 hover:text-gold">View all →</Link>
        </Reveal>
        <div className={`grid gap-8 ${items.length === 1 ? "" : "md:grid-cols-2"} ${items.length >= 3 ? "lg:grid-cols-3" : ""}`}>
          {items.map((f, i) => (
            <Reveal key={f.id} delay={i * 0.08}>
              <Link href="/films" className="group relative block aspect-video w-full overflow-hidden bg-ink-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {f.thumb_url && <img src={f.thumb_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                <span className="absolute inset-0 grid place-items-center bg-ink/30 transition-colors group-hover:bg-ink/10"><span className="grid h-14 w-14 place-items-center rounded-full border border-paper/70">▶</span></span>
                <span className="absolute bottom-0 left-0 p-5 font-display text-xl font-light">{f.title}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
