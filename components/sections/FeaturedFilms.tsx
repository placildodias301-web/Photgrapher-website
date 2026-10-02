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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f, i) => (
            <Reveal key={f.id} delay={i * 0.08}>
              <Link href="/films" className="group block bg-ink-2 hover:bg-ink-3 transition-colors">
                <div className="relative aspect-video w-full overflow-hidden bg-ink-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {f.thumb_url && <img src={f.thumb_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]" />}
                  <span className="absolute inset-0 grid place-items-center bg-ink/30 transition-colors group-hover:bg-ink/10">
                    <span className="grid h-14 w-14 place-items-center rounded-full border border-paper/70 text-sm">▶</span>
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-xl font-light group-hover:text-gold transition-colors">{f.title}</h3>
                  {f.category && <p className="mt-2 text-[11px] tracking-[0.18em] uppercase text-mute">{f.category}</p>}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
