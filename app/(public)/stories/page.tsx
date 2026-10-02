import Link from "next/link";
import Image from "next/image";
import { getPublishedStories } from "@/lib/public";
import { formatDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Stories" };

export default async function Page() {
  const stories = await getPublishedStories();
  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-28 pt-36 lg:px-12">
      <header className="mb-16">
        <p className="mb-4 text-[11px] tracking-[0.35em] text-gold uppercase">Stories</p>
        <h1 className="font-display text-5xl font-light md:text-7xl">Editorial Stories</h1>
      </header>

      {stories.length === 0 ? (
        <p className="text-mute">Stories are on their way — please check back soon.</p>
      ) : (
        <div className="space-y-16 lg:space-y-20">
          {stories.map((s, i) => (
            <Link
              key={s.id}
              href={`/stories/${s.slug}`}
              className={`group flex flex-col gap-8 md:items-center lg:gap-16 ${i % 2 ? "md:flex-row-reverse" : "md:flex-row"}`}
            >
              {/* Cover — 16:10 on mobile, fixed width on desktop */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-2 md:w-[45%] shrink-0">
                {s.cover_url && (
                  <Image
                    src={s.cover_url}
                    alt={s.title}
                    fill
                    sizes="(min-width:768px) 45vw, 100vw"
                    quality={82}
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                  />
                )}
              </div>

              {/* Meta */}
              <div className="flex flex-col justify-center md:w-[50%] md:py-8">
                {(s.location || s.event_date) && (
                  <p className="text-[11px] tracking-[0.3em] text-gold uppercase">
                    {[s.location, s.event_date && formatDate(s.event_date)].filter(Boolean).join(" · ")}
                  </p>
                )}
                <h2 className="mt-4 font-display text-3xl font-light leading-snug group-hover:text-gold transition-colors md:text-4xl">
                  {s.title}
                </h2>
                {s.description && (
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-mute line-clamp-3">{s.description}</p>
                )}
                <span className="mt-6 inline-block text-[11px] tracking-[0.25em] uppercase text-paper/80 group-hover:text-gold transition-colors">
                  Read the story →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
