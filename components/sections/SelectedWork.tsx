import Link from "next/link";
import Image from "next/image";
import type { ShootCard } from "@/lib/public";
import { formatDate } from "@/lib/format";
import Reveal from "@/components/ui/Reveal";

// Compact 3-column card grid matching the reference design.
// Each card: uniform aspect-[3/2] image + metadata row below.
export default function SelectedWork({ items }: { items: ShootCard[] }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="work-h" className="mx-auto max-w-[1600px] px-6 py-24 lg:px-12 lg:py-32">
      <Reveal className="mb-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-[11px] tracking-[0.35em] text-gold uppercase">Portfolio</p>
          <h2 id="work-h" className="font-display text-4xl font-light md:text-5xl">Selected Work</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-mute">
            A collection of moments, emotions and stories captured across weddings, events, portraits and beyond.
          </p>
        </div>
        <Link href="/portfolio" className="text-[11px] tracking-[0.25em] uppercase text-paper/80 hover:text-gold shrink-0">
          View all →
        </Link>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s, i) => (
          <Reveal key={s.id} delay={i * 0.06}>
            <Link href={`/portfolio/${s.slug}`} data-cursor="view" className="group block bg-ink-2 hover:bg-ink-3 transition-colors">
              {/* Image */}
              <div className="relative aspect-[3/2] w-full overflow-hidden bg-ink-3">
                {s.cover_url && (
                  <Image
                    src={s.cover_url}
                    alt={s.name}
                    fill
                    sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                    quality={82}
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                  />
                )}
              </div>
              {/* Metadata below image */}
              <div className="p-4">
                <h3 className="font-display text-xl font-light group-hover:text-gold transition-colors">{s.name}</h3>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] tracking-[0.18em] uppercase text-mute">
                  <div className="flex items-center gap-3">
                    {s.category && <span className="text-gold/90">{s.category}</span>}
                    {s.location && (
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0" aria-hidden="true">
                          <path fillRule="evenodd" d="M8 1.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13h-5a.5.5 0 0 1-.46-.302l-.761-1.769c-.094-.219-.25-.423-.453-.619A5.98 5.98 0 0 1 2 6Z" clipRule="evenodd" />
                        </svg>
                        {s.location}
                      </span>
                    )}
                  </div>
                  {s.event_date && (
                    <span className="flex items-center gap-1 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0" aria-hidden>
                        <path d="M5.75 7.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM5 11.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0ZM10.25 7.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM9.5 11.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0ZM7.25 8.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0ZM8 11.25a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                        <path fillRule="evenodd" d="M4.75 1a.75.75 0 0 1 .75.75V3h5V1.75a.75.75 0 0 1 1.5 0V3h.75A2.25 2.25 0 0 1 15 5.25v7.5A2.25 2.25 0 0 1 12.75 15h-9.5A2.25 2.25 0 0 1 1 12.75v-7.5A2.25 2.25 0 0 1 3.25 3H4V1.75A.75.75 0 0 1 4.75 1Zm-1.5 5.5a.75.75 0 0 0 0 1.5h9.5a.75.75 0 0 0 0-1.5h-9.5Z" clipRule="evenodd" />
                      </svg>
                      {formatDate(s.event_date)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
