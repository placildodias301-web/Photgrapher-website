import type { MetadataRoute } from "next";
import { getSitemapSlugs } from "@/lib/public";
import { toIso } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const { shoots, stories } = await getSitemapSlugs();
  const staticPages = ["", "/portfolio", "/stories", "/films", "/about", "/services", "/contact"];
  return [
    ...staticPages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...shoots.map((s) => ({ url: `${base}/portfolio/${s.slug}`, lastModified: toIso(s.updated_at), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...stories.map((s) => ({ url: `${base}/stories/${s.slug}`, lastModified: toIso(s.updated_at), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
