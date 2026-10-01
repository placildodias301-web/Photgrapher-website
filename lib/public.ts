import { query, queryOne } from "@/lib/db";

// ---------- About ----------
export type About = { name: string | null; title: string | null; heading: string | null; biography: string | null; location: string | null; quote: string | null; profile_url: string | null };
export async function getAbout(): Promise<About> {
  const row = await queryOne<About>(
    `SELECT a.name, a.title, a.heading, a.biography, a.location, a.quote, m.file_url AS profile_url
       FROM about_content a LEFT JOIN media m ON m.id = a.profile_media_id WHERE a.id = 1`);
  return row ?? { name: null, title: null, heading: null, biography: null, location: null, quote: null, profile_url: null };
}

// ---------- Services ----------
export type Service = { id: number; name: string; description: string | null; image_url: string | null };
export const getServices = () => query<Service>(
  `SELECT s.id, s.name, s.description, m.file_url AS image_url FROM services s LEFT JOIN media m ON m.id = s.image_media_id
    WHERE s.published ORDER BY s.display_order, s.id`);

// ---------- Shoots / portfolio ----------
export type ShootCard = { id: number; name: string; slug: string; category: string | null; location: string | null; event_date: string | null; cover_url: string | null; cover_w: number | null; cover_h: number | null };

const SHOOT_CARD = `s.id, s.name, s.slug, c.name AS category, s.location, s.event_date,
   COALESCE(cm.file_url, (SELECT m2.file_url FROM shoot_images si2 JOIN media m2 ON m2.id = si2.media_id WHERE si2.shoot_id = s.id ORDER BY si2.display_order, si2.id LIMIT 1)) AS cover_url,
   cm.width AS cover_w, cm.height AS cover_h`;
const SHOOT_FROM = `FROM shoots s LEFT JOIN categories c ON c.id = s.category_id LEFT JOIN media cm ON cm.id = s.cover_media_id`;

export const getFeaturedShoots = (limit = 5) =>
  query<ShootCard>(`SELECT ${SHOOT_CARD} ${SHOOT_FROM} WHERE s.published AND s.featured ORDER BY s.event_date DESC, s.id DESC LIMIT ?`, [limit]);
export const getLatestShoots = (limit = 5) =>
  query<ShootCard>(`SELECT ${SHOOT_CARD} ${SHOOT_FROM} WHERE s.published ORDER BY s.event_date DESC, s.id DESC LIMIT ?`, [limit]);

export async function getSelectedWork(limit = 5): Promise<ShootCard[]> {
  const featured = await getFeaturedShoots(limit);
  return featured.length ? featured : getLatestShoots(limit); // nothing featured yet: show the newest
}

export type PhotoItem = { id: number; url: string; width: number | null; height: number | null; alt: string | null; title: string; slug: string; category: string | null };
export async function getPortfolioPhotos(opts: { category?: string; page: number; pageSize: number }) {
  const where = `s.published ${opts.category ? "AND c.slug = ?" : ""}`;
  const args: unknown[] = opts.category ? [opts.category] : [];
  const total = (await queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM shoot_images si JOIN shoots s ON s.id = si.shoot_id LEFT JOIN categories c ON c.id = s.category_id WHERE ${where}`, args))?.n ?? 0;
  const items = await query<PhotoItem>(
    `SELECT si.id, m.file_url AS url, m.width, m.height, m.alt_text AS alt, s.name AS title, s.slug, c.name AS category
       FROM shoot_images si JOIN shoots s ON s.id = si.shoot_id JOIN media m ON m.id = si.media_id LEFT JOIN categories c ON c.id = s.category_id
      WHERE ${where} ORDER BY s.event_date DESC, s.id DESC, si.display_order, si.id LIMIT ? OFFSET ?`,
    [...args, opts.pageSize, (opts.page - 1) * opts.pageSize]);
  return { items, total };
}

export const getPortfolioCategories = () =>
  query<{ id: number; name: string; slug: string }>(
    `SELECT c.id, c.name, c.slug FROM categories c WHERE c.enabled AND EXISTS (SELECT 1 FROM shoots s WHERE s.category_id = c.id AND s.published) ORDER BY c.display_order, c.id`);

export type ShootDetail = ShootCard & { description: string | null; images: { id: number; url: string; width: number | null; height: number | null; alt: string | null }[] };
export async function getShootBySlug(slug: string): Promise<ShootDetail | null> {
  const s = await queryOne<ShootCard & { description: string | null }>(`SELECT ${SHOOT_CARD}, s.description ${SHOOT_FROM} WHERE s.slug = ? AND s.published`, [slug]);
  if (!s) return null;
  const images = await query<{ id: number; url: string; width: number | null; height: number | null; alt: string | null }>(
    `SELECT si.id, m.file_url AS url, m.width, m.height, m.alt_text AS alt FROM shoot_images si JOIN media m ON m.id = si.media_id WHERE si.shoot_id = ? ORDER BY si.display_order, si.id`, [s.id]);
  return { ...s, images };
}

// ---------- Stories ----------
export type StoryCard = { id: number; title: string; slug: string; description: string | null; location: string | null; event_date: string | null; cover_url: string | null; cover_w: number | null; cover_h: number | null };
const STORY_CARD = `a.id, a.title, a.slug, a.description, a.location, a.event_date,
   COALESCE(cm.file_url, (SELECT m2.file_url FROM album_images ai2 JOIN media m2 ON m2.id = ai2.media_id WHERE ai2.album_id = a.id ORDER BY ai2.display_order, ai2.id LIMIT 1)) AS cover_url,
   cm.width AS cover_w, cm.height AS cover_h`;
export const getPublishedStories = () =>
  query<StoryCard>(`SELECT ${STORY_CARD} FROM albums a LEFT JOIN media cm ON cm.id = a.cover_media_id WHERE a.published ORDER BY a.event_date DESC, a.id DESC`);
export async function getStoryBySlug(slug: string) {
  const a = await queryOne<StoryCard>(`SELECT ${STORY_CARD} FROM albums a LEFT JOIN media cm ON cm.id = a.cover_media_id WHERE a.slug = ? AND a.published`, [slug]);
  if (!a) return null;
  const images = await query<{ id: number; url: string; width: number | null; height: number | null; alt: string | null }>(
    `SELECT ai.id, m.file_url AS url, m.width, m.height, m.alt_text AS alt FROM album_images ai JOIN media m ON m.id = ai.media_id WHERE ai.album_id = ? ORDER BY ai.display_order, ai.id`, [a.id]);
  return { ...a, images };
}

// ---------- Films ----------
export type FilmCard = { id: number; title: string; slug: string; category: string | null; location: string | null; event_date: string | null; description: string | null; video_url: string | null; thumb_url: string | null };
const FILM = `v.id, v.title, v.slug, v.category, v.location, v.event_date, v.description, vm.file_url AS video_url, tm.file_url AS thumb_url
   FROM videos v LEFT JOIN media vm ON vm.id = v.video_media_id LEFT JOIN media tm ON tm.id = v.thumbnail_media_id`;
export const getPublishedFilms = () => query<FilmCard>(`SELECT ${FILM} WHERE v.published AND v.video_media_id IS NOT NULL ORDER BY v.event_date DESC, v.id DESC`);
export const getFeaturedFilms = (limit = 3) => query<FilmCard>(`SELECT ${FILM} WHERE v.published AND v.featured AND v.video_media_id IS NOT NULL ORDER BY v.event_date DESC, v.id DESC LIMIT ?`, [limit]);

// ---------- Sitemap ----------
export const getSitemapSlugs = async () => ({
  shoots: await query<{ slug: string; updated_at: string }>(`SELECT slug, updated_at FROM shoots WHERE published`),
  stories: await query<{ slug: string; updated_at: string }>(`SELECT slug, updated_at FROM albums WHERE published`),
});
