import Link from "next/link";
import { getPortfolioCategories, getPortfolioPhotos } from "@/lib/public";
import PhotoGrid from "@/components/gallery/PhotoGrid";
import { PORTFOLIO_PAGE_SIZE, toGridPhoto } from "./shared";
export const dynamic = "force-dynamic";
export const metadata = { title: "Portfolio" };

export default async function Page({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const [cats, { items, total }] = await Promise.all([
    getPortfolioCategories(),
    getPortfolioPhotos({ category, page: 1, pageSize: PORTFOLIO_PAGE_SIZE }),
  ]);
  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-28 pt-36 lg:px-12">
      <header className="mb-12">
        <p className="mb-4 text-[11px] tracking-[0.35em] text-gold uppercase">Portfolio</p>
        <h1 className="font-display text-5xl font-light md:text-7xl">Selected Work</h1>
      </header>
      <nav aria-label="Filter by category" className="mb-12 flex flex-wrap gap-3">
        <Link href="/portfolio" className={`border px-4 py-2 text-[11px] tracking-[0.2em] uppercase transition-colors ${!category ? "border-gold text-gold" : "border-line text-mute hover:text-paper"}`}>All</Link>
        {cats.map((c) => (
          <Link key={c.id} href={`/portfolio?category=${c.slug}`} className={`border px-4 py-2 text-[11px] tracking-[0.2em] uppercase transition-colors ${category === c.slug ? "border-gold text-gold" : "border-line text-mute hover:text-paper"}`}>{c.name}</Link>
        ))}
      </nav>
      {items.length === 0 ? (
        <p className="text-mute">Photos are on their way — please check back soon.</p>
      ) : (
        <PhotoGrid initial={items.map(toGridPhoto)} total={total} pageSize={PORTFOLIO_PAGE_SIZE} fetchMore={async (page) => {
          "use server";
          const r = await getPortfolioPhotos({ category, page, pageSize: PORTFOLIO_PAGE_SIZE });
          return r.items.map(toGridPhoto);
        }} />
      )}
    </div>
  );
}
