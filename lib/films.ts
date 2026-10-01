import { z } from "zod";
import { exec, query, queryOne } from "@/lib/db";
import { createMedia, deleteMediaIfUnused, validateImage, validateVideo } from "@/lib/media";
import { uniqueSlug } from "@/lib/slug";
import { logActivity, notify } from "@/lib/activity";

export const filmSchema = z.object({
  title: z.string().trim().min(1, "Please give the film a title.").max(150),
  category: z.string().trim().max(60).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  location: z.string().trim().max(150).nullable().optional(),
  event_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please use a valid date."), z.literal("")]).nullable().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});
export type FilmInput = z.infer<typeof filmSchema>;

export async function listFilms() {
  return query<{ id: number; title: string; slug: string; category: string | null; location: string | null; event_date: string | null; description: string | null; featured: number; published: number; video_url: string | null; thumb_url: string | null }>(
    `SELECT v.id, v.title, v.slug, v.category, v.location, v.event_date, v.description, v.featured, v.published,
            vm.file_url AS video_url, tm.file_url AS thumb_url
       FROM videos v LEFT JOIN media vm ON vm.id = v.video_media_id LEFT JOIN media tm ON tm.id = v.thumbnail_media_id
      ORDER BY v.created_at DESC, v.id DESC`);
}

export async function createFilm(input: FilmInput, video: File, thumb: File | null): Promise<{ id: number } | { error: string }> {
  const ve = validateVideo(video); if (ve) return { error: ve };
  if (thumb) { const te = validateImage(thumb); if (te) return { error: te }; }
  const slug = await uniqueSlug("videos", input.title);
  const res = await exec(
    `INSERT INTO videos (title, slug, description, category, location, event_date, featured, published) VALUES (?,?,?,?,?,?,?,?)`,
    [input.title, slug, input.description || null, input.category || null, input.location || null, input.event_date || null, !!input.featured, !!input.published]);
  const id = res.insertId;
  try {
    const vm = await createMedia(video, null);
    await exec(`UPDATE videos SET video_media_id = ? WHERE id = ?`, [vm.id, id]);
    if (thumb) { const tm = await createMedia(thumb, input.title); await exec(`UPDATE videos SET thumbnail_media_id = ? WHERE id = ?`, [tm.id, id]); }
  } catch (e) {
    console.error("Film upload failed", e);
    await exec(`DELETE FROM videos WHERE id = ?`, [id]);
    await notify({ type: "UPLOAD_FAILED", title: "Video upload failed", body: video.name });
    return { error: "The video failed to upload. Please try again." };
  }
  await notify({ type: "VIDEO_UPLOADED", title: `Film uploaded: ${input.title}`, relatedType: "film", relatedId: id });
  await logActivity("film_uploaded", `Film uploaded: ${input.title}`);
  return { id };
}

export async function updateFilm(id: number, input: FilmInput) {
  const before = await queryOne<{ published: number }>(`SELECT published FROM videos WHERE id = ?`, [id]);
  if (!before) return false;
  await exec(`UPDATE videos SET title=?, description=?, category=?, location=?, event_date=?, featured=?, published=? WHERE id=?`,
    [input.title, input.description || null, input.category || null, input.location || null, input.event_date || null, !!input.featured, !!input.published, id]);
  await logActivity(!!before.published !== !!input.published ? (input.published ? "film_published" : "film_unpublished") : "film_updated", `Film ${!!before.published !== !!input.published ? (input.published ? "published" : "unpublished") : "updated"}: ${input.title}`);
  return true;
}

export async function replaceFilmMedia(id: number, kind: "video" | "thumbnail", file: File): Promise<string | null | "notfound"> {
  const col = kind === "video" ? "video_media_id" : "thumbnail_media_id";
  const row = await queryOne<{ old: number | null }>(`SELECT ${col} AS old FROM videos WHERE id = ?`, [id]);
  if (!row) return "notfound";
  const err = kind === "video" ? validateVideo(file) : validateImage(file);
  if (err) return err;
  const m = await createMedia(file, null);
  await exec(`UPDATE videos SET ${col} = ? WHERE id = ?`, [m.id, id]);
  if (row.old) await deleteMediaIfUnused(row.old);
  await logActivity("film_updated", `Film ${kind} replaced`);
  return null;
}

export async function deleteFilm(id: number) {
  const row = await queryOne<{ title: string; v: number | null; t: number | null }>(`SELECT title, video_media_id AS v, thumbnail_media_id AS t FROM videos WHERE id = ?`, [id]);
  if (!row) return false;
  await exec(`DELETE FROM videos WHERE id = ?`, [id]);
  for (const m of [row.v, row.t]) if (m) await deleteMediaIfUnused(m);
  await logActivity("film_deleted", `Film deleted: ${row.title}`);
  return true;
}
