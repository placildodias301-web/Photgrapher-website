import { z } from "zod";
import { exec, query, queryOne } from "@/lib/db";
import { createMedia, deleteMediaIfUnused, validateImage } from "@/lib/media";
import { uniqueSlug } from "@/lib/slug";
import { logActivity, notify } from "@/lib/activity";

// Shoots (portfolio projects) and Stories (albums) share one structure, so one engine drives both.
export type Kind = "shoots" | "albums";

export const CONFIGS = {
  shoots: { table: "shoots", imageTable: "shoot_images", fk: "shoot_id", titleCol: "name", label: "Shoot", plural: "Shoots", publicBase: "/portfolio", hasCategory: true, relatedType: "shoot", createdType: "NEW_SHOOT_CREATED" },
  albums: { table: "albums", imageTable: "album_images", fk: "album_id", titleCol: "title", label: "Story", plural: "Stories", publicBase: "/stories", hasCategory: false, relatedType: "album", createdType: "NEW_STORY_CREATED" },
} as const;

export function isKind(k: string): k is Kind { return k === "shoots" || k === "albums"; }

export const collectionSchema = z.object({
  title: z.string().trim().min(1, "Please give it a name.").max(150),
  category_id: z.number().int().positive().nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  location: z.string().trim().max(150).nullable().optional(),
  event_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please use a valid date."), z.literal("")]).nullable().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});
export type CollectionInput = z.infer<typeof collectionSchema>;

export type CollectionImage = { id: number; media_id: number; url: string; width: number | null; height: number | null; alt_text: string | null; display_order: number };

export async function listCollection(kind: Kind) {
  const c = CONFIGS[kind];
  return query<{
    id: number; title: string; slug: string; location: string | null; event_date: string | null;
    featured: number; published: number; category: string | null; cover_url: string | null; image_count: number;
  }>(
    `SELECT t.id, t.${c.titleCol} AS title, t.slug, t.location, t.event_date, t.featured, t.published,
            ${c.hasCategory ? "cat.name" : "NULL"} AS category, m.file_url AS cover_url,
            (SELECT COUNT(*) FROM ${c.imageTable} i WHERE i.${c.fk} = t.id) AS image_count
       FROM ${c.table} t
       LEFT JOIN media m ON m.id = t.cover_media_id
       ${c.hasCategory ? "LEFT JOIN categories cat ON cat.id = t.category_id" : ""}
      ORDER BY t.created_at DESC, t.id DESC`
  );
}

export async function getCollection(kind: Kind, id: number) {
  const c = CONFIGS[kind];
  const row = await queryOne<{
    id: number; title: string; slug: string; category_id: number | null; description: string | null;
    location: string | null; event_date: string | null; featured: number; published: number;
    cover_media_id: number | null; cover_url: string | null;
  }>(
    `SELECT t.id, t.${c.titleCol} AS title, t.slug, ${c.hasCategory ? "t.category_id" : "NULL"} AS category_id,
            t.description, t.location, t.event_date, t.featured, t.published, t.cover_media_id, m.file_url AS cover_url
       FROM ${c.table} t LEFT JOIN media m ON m.id = t.cover_media_id WHERE t.id = ?`, [id]
  );
  if (!row) return null;
  const images = await query<CollectionImage>(
    `SELECT i.id, i.media_id, m.file_url AS url, m.width, m.height, m.alt_text, i.display_order
       FROM ${c.imageTable} i JOIN media m ON m.id = i.media_id
      WHERE i.${c.fk} = ? ORDER BY i.display_order, i.id`, [id]
  );
  return { ...row, images };
}

export async function addImages(kind: Kind, id: number, files: File[]) {
  const c = CONFIGS[kind];
  let added = 0;
  const failed: string[] = [];
  for (const file of files) {
    const err = validateImage(file);
    if (err) { failed.push(err); continue; }
    try {
      const media = await createMedia(file, null);
      const next = await queryOne<{ n: number | null }>(`SELECT MAX(display_order) AS n FROM ${c.imageTable} WHERE ${c.fk} = ?`, [id]);
      await exec(`INSERT INTO ${c.imageTable} (${c.fk}, media_id, display_order) VALUES (?, ?, ?)`, [id, media.id, (next?.n ?? -1) + 1]);
      added++;
    } catch (e) {
      console.error("Gallery upload failed", e);
      failed.push(`"${file.name}" failed to upload.`);
      await notify({ type: "UPLOAD_FAILED", title: "Photo upload failed", body: file.name, relatedType: c.relatedType, relatedId: id });
    }
  }
  if (added) {
    await notify({ type: "PHOTOS_UPLOADED", title: `${added} photo${added > 1 ? "s" : ""} uploaded`, relatedType: c.relatedType, relatedId: id });
    await logActivity("photos_uploaded", `${added} photo(s) uploaded to a ${c.label.toLowerCase()}`);
  }
  return { added, failed };
}

export async function setCoverFile(kind: Kind, id: number, file: File): Promise<string | null> {
  const c = CONFIGS[kind];
  const err = validateImage(file);
  if (err) return err;
  const old = await queryOne<{ cover_media_id: number | null }>(`SELECT cover_media_id FROM ${c.table} WHERE id = ?`, [id]);
  const media = await createMedia(file, null);
  await exec(`UPDATE ${c.table} SET cover_media_id = ? WHERE id = ?`, [media.id, id]);
  if (old?.cover_media_id) await deleteMediaIfUnused(old.cover_media_id);
  return null;
}

export async function createCollection(kind: Kind, input: CollectionInput, cover: File | null, gallery: File[]) {
  const c = CONFIGS[kind];
  const slug = await uniqueSlug(c.table, input.title);
  const cols = [c.titleCol, "slug", "description", "location", "event_date", "featured", "published", ...(c.hasCategory ? ["category_id"] : [])];
  const vals: unknown[] = [input.title, slug, input.description || null, input.location || null, input.event_date || null, !!input.featured, !!input.published, ...(c.hasCategory ? [input.category_id ?? null] : [])];
  const res = await exec(`INSERT INTO ${c.table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`, vals);
  const id = res.insertId;
  const problems: string[] = [];
  if (cover) { try { const e = await setCoverFile(kind, id, cover); if (e) problems.push(e); } catch (e) { console.error(e); problems.push("The cover image failed to upload."); } }
  const g = gallery.length ? await addImages(kind, id, gallery) : { added: 0, failed: [] as string[] };
  problems.push(...g.failed);
  await notify({ type: c.createdType, title: `New ${c.label.toLowerCase()} created: ${input.title}`, relatedType: c.relatedType, relatedId: id });
  await logActivity("project_created", `New ${c.label.toLowerCase()} created: ${input.title}`);
  if (input.published) await logActivity("project_published", `${c.label} published: ${input.title}`);
  return { id, slug, added: g.added, problems };
}

export async function updateCollection(kind: Kind, id: number, input: CollectionInput) {
  const c = CONFIGS[kind];
  const before = await queryOne<{ published: number; title: string }>(`SELECT published, ${c.titleCol} AS title FROM ${c.table} WHERE id = ?`, [id]);
  if (!before) return false;
  const sets = [`${c.titleCol} = ?`, "description = ?", "location = ?", "event_date = ?", "featured = ?", "published = ?", ...(c.hasCategory ? ["category_id = ?"] : [])];
  const vals: unknown[] = [input.title, input.description || null, input.location || null, input.event_date || null, !!input.featured, !!input.published, ...(c.hasCategory ? [input.category_id ?? null] : []), id];
  await exec(`UPDATE ${c.table} SET ${sets.join(", ")} WHERE id = ?`, vals);
  if (!!before.published !== !!input.published) {
    await logActivity(input.published ? "project_published" : "project_unpublished", `${c.label} ${input.published ? "published" : "unpublished"}: ${input.title}`);
  } else {
    await logActivity("project_updated", `${c.label} updated: ${input.title}`);
  }
  return true;
}

export async function deleteCollection(kind: Kind, id: number) {
  const c = CONFIGS[kind];
  const row = await queryOne<{ title: string; cover_media_id: number | null }>(`SELECT ${c.titleCol} AS title, cover_media_id FROM ${c.table} WHERE id = ?`, [id]);
  if (!row) return false;
  const imgs = await query<{ media_id: number }>(`SELECT media_id FROM ${c.imageTable} WHERE ${c.fk} = ?`, [id]);
  await exec(`DELETE FROM ${c.table} WHERE id = ?`, [id]); // image rows cascade
  for (const m of [row.cover_media_id, ...imgs.map((i) => i.media_id)]) if (m) await deleteMediaIfUnused(m);
  await logActivity("project_deleted", `${c.label} deleted: ${row.title}`);
  return true;
}

export async function removeImage(kind: Kind, id: number, imageId: number) {
  const c = CONFIGS[kind];
  const img = await queryOne<{ media_id: number }>(`SELECT media_id FROM ${c.imageTable} WHERE id = ? AND ${c.fk} = ?`, [imageId, id]);
  if (!img) return false;
  await exec(`DELETE FROM ${c.imageTable} WHERE id = ?`, [imageId]);
  await deleteMediaIfUnused(img.media_id);
  await logActivity("photo_deleted", `Photo deleted from a ${c.label.toLowerCase()}`);
  return true;
}

export async function replaceImage(kind: Kind, id: number, imageId: number, file: File): Promise<string | null | "notfound"> {
  const c = CONFIGS[kind];
  const img = await queryOne<{ media_id: number }>(`SELECT media_id FROM ${c.imageTable} WHERE id = ? AND ${c.fk} = ?`, [imageId, id]);
  if (!img) return "notfound";
  const err = validateImage(file);
  if (err) return err;
  const media = await createMedia(file, null);
  await exec(`UPDATE ${c.imageTable} SET media_id = ? WHERE id = ?`, [media.id, imageId]);
  await deleteMediaIfUnused(img.media_id);
  await logActivity("photo_replaced", `Photo replaced in a ${c.label.toLowerCase()}`);
  return null;
}

export async function reorderImages(kind: Kind, id: number, ids: number[]) {
  const c = CONFIGS[kind];
  for (let i = 0; i < ids.length; i++) await exec(`UPDATE ${c.imageTable} SET display_order = ? WHERE id = ? AND ${c.fk} = ?`, [i, ids[i], id]);
}

export async function setCoverFromImage(kind: Kind, id: number, imageId: number) {
  const c = CONFIGS[kind];
  const img = await queryOne<{ media_id: number }>(`SELECT media_id FROM ${c.imageTable} WHERE id = ? AND ${c.fk} = ?`, [imageId, id]);
  if (!img) return false;
  const old = await queryOne<{ cover_media_id: number | null }>(`SELECT cover_media_id FROM ${c.table} WHERE id = ?`, [id]);
  await exec(`UPDATE ${c.table} SET cover_media_id = ? WHERE id = ?`, [img.media_id, id]);
  if (old?.cover_media_id && old.cover_media_id !== img.media_id) await deleteMediaIfUnused(old.cover_media_id);
  return true;
}

export async function updateImageAlt(kind: Kind, id: number, imageId: number, alt: string) {
  const c = CONFIGS[kind];
  await exec(`UPDATE media m JOIN ${c.imageTable} i ON i.media_id = m.id SET m.alt_text = ? WHERE i.id = ? AND i.${c.fk} = ?`, [alt || null, imageId, id]);
}

/** Parse the string fields of the multipart create form into the same shape as the JSON schema. */
export function parseFormFields(fd: FormData): unknown {
  const s = (k: string) => { const v = fd.get(k); return typeof v === "string" ? v : ""; };
  const cat = Number(s("category_id"));
  return {
    title: s("title"), description: s("description") || null, location: s("location") || null,
    event_date: s("event_date"), category_id: Number.isInteger(cat) && cat > 0 ? cat : null,
    featured: s("featured") === "true", published: s("published") === "true",
  };
}
