import Link from "next/link";
import Image from "next/image";
import type { ShootCard } from "@/lib/public";
import Reveal from "@/components/ui/Reveal";

// Alternating full-width / two-up editorial rhythm instead of a repetitive grid.
export default function SelectedWork({ items }: { items: ShootCard[] }) {
  if (!items.length) return null;
  const [first, ...rest] = items;
  return (
    <section aria-labelledby="work-h" className="mx-auto max-w-[1600px] px-6 py-24 lg:px-12 lg:py-36">
      <Reveal className="mb-14 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-4 text-[11px] tracking-[0.35em] text-gold uppercase">Portfolio</p><h2 id="work-h" className="font-display text-4xl font-light md:text-6xl">Selected Work</h2></div>
        <Link href="/portfolio" className="text-[11px] tracking-[0.25em] uppercase text-paper/80 hover:text-gold">View all →</Link>
      </Reveal>

      <Reveal>
        <Link href={`/portfolio/${first.slug}`} data-cursor="view" className="group relative block aspect-[16/9] w-full overflow-hidden bg-ink-2">
          {first.cover_url && <Image src={first.cover_url} alt={first.name} fill sizes="100vw" quality={82} className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 lg:p-12">
            {first.category && <p className="mb-2 text-[11px] tracking-[0.3em] text-gold uppercase">{first.category}</p>}
            <h3 className="font-display text-3xl font-light md:text-5xl">{first.name}</h3>
          </div>
        </Link>
      </Reveal>

      {rest.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {rest.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.08}>
              <Link href={`/portfolio/${s.slug}`} data-cursor="view" className="group relative block aspect-[3/4] w-full overflow-hidden bg-ink-2">
                {s.cover_url && <Image src={s.cover_url} alt={s.name} fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" quality={80} className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  {s.category && <p className="mb-1 text-[10px] tracking-[0.25em] text-gold uppercase">{s.category}</p>}
                  <h3 className="font-display text-xl font-light">{s.name}</h3>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
