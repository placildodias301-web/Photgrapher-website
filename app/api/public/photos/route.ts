import { NextRequest, NextResponse } from "next/server";
import { getPortfolioPhotos } from "@/lib/public";

// Public: feeds "Load more" on the portfolio page.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Math.min(Math.max(Number(sp.get("page")) || 1, 1), 500);
  const category = /^[a-z0-9-]{1,60}$/.test(sp.get("category") ?? "") ? sp.get("category")! : undefined;
  const { items } = await getPortfolioPhotos({ category, page, pageSize: 24 });
  return NextResponse.json({ items: items.map((p) => ({ id: p.id, url: p.url, width: p.width, height: p.height, alt: p.alt, title: p.title, category: p.category, href: `/portfolio/${p.slug}` })) },
    { headers: { "Cache-Control": "public, max-age=30" } });
}
