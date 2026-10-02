import Link from "next/link";
import { getPortfolioCategories, getPortfolioShoots } from "@/lib/public";
import ShootGrid from "@/components/gallery/ShootGrid";
export const dynamic = "force-dynamic";
export const metadata = { title: "Portfolio" };

const PAGE_SIZE = 9;

export default async function Page({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const [cats, { items, total }] = await Promise.all([
    getPortfolioCategories(),
    getPortfolioShoots({ category, page: 1, pageSize: PAGE_SIZE }),
  ]);

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-28 pt-36 lg:px-12">
      {/* Header */}
      <div className="relative mb-10">
        <header className="max-w-2xl">
          <h1 className="font-display text-5xl font-light md:text-7xl">Our Work</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-mute">
            A collection of moments, emotions and stories captured across weddings, events, portraits and beyond.
          </p>
        </header>
        {/* Tagline — right-aligned, desktop only */}
        <p className="absolute right-0 top-4 hidden text-[11px] tracking-[0.3em] uppercase text-mute lg:block">
          Real people&nbsp;/&nbsp;Authentic moments&nbsp;/&nbsp;Timeless stories
        </p>
      </div>

      {/* Category filters */}
      <nav aria-label="Filter by category" className="mb-10 flex flex-wrap gap-2">
        <Link
          href="/portfolio"
          className={`px-4 py-2 text-[11px] tracking-[0.2em] uppercase transition-colors border ${
            !category ? "border-gold bg-gold text-ink font-medium" : "border-line text-mute hover:text-paper"
          }`}
        >
          All
        </Link>
        {cats.map((c) => (
          <Link
            key={c.id}
            href={`/portfolio?category=${c.slug}`}
            className={`px-4 py-2 text-[11px] tracking-[0.2em] uppercase transition-colors border ${
              category === c.slug ? "border-gold bg-gold text-ink font-medium" : "border-line text-mute hover:text-paper"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      {/* Grid */}
      {items.length === 0 ? (
        <p className="text-mute">
          {category
            ? "No projects in this category yet — check back soon."
            : "Projects are on their way — please check back soon."}
        </p>
      ) : (
        <ShootGrid
          key={category || 'all'}
          initial={items}
          total={total}
          fetchMore={async (page) => {
            "use server";
            const r = await getPortfolioShoots({ category, page, pageSize: PAGE_SIZE });
            return r.items;
          }}
        />
      )}
    </div>
  );
}
