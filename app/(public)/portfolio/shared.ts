import type { PhotoItem } from "@/lib/public";
import type { Photo } from "@/components/gallery/types";

export const PORTFOLIO_PAGE_SIZE = 24;
export const toGridPhoto = (p: PhotoItem): Photo => ({ id: p.id, url: p.url, width: p.width, height: p.height, alt: p.alt, title: p.title, category: p.category, href: `/portfolio/${p.slug}` });
