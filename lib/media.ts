import { exec, query, queryOne } from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
// Favicons commonly ship as .ico / .svg too.
export const ALLOWED_FAVICON_TYPES = [...ALLOWED_IMAGE_TYPES, "image/x-icon", "image/vnd.microsoft.icon", "image/svg+xml"];

export function validateImage(file: File, allowed = ALLOWED_IMAGE_TYPES): string | null {
  if (!allowed.includes(file.type)) return `"${file.name}" isn't a supported image type.`;
  if (file.size > MAX_IMAGE_BYTES) return `"${file.name}" is larger than 25 MB.`;
  if (file.size === 0) return `"${file.name}" is empty.`;
  return null;
}

export function validateVideo(file: File): string | null {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) return `"${file.name}" isn't a supported video type (use MP4, WebM or MOV).`;
  if (file.size > MAX_VIDEO_BYTES) return `"${file.name}" is larger than 500 MB.`;
  if (file.size === 0) return `"${file.name}" is empty.`;
  return null;
}

/** Store the file via the configured provider and record it in `media`. */
export async function createMedia(file: File, altText?: string | null): Promise<{ id: number; url: string }> {
  const kind = file.type.startsWith("video/") ? "video" : "image";
  const storage = await getStorageProvider();
  const up = await storage.upload(file);
  const res = await exec(
    `INSERT INTO media (file_name, file_url, mime_type, file_size, width, height, type, alt_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [file.name.slice(0, 250), up.url, up.mimeType, up.fileSize, up.width ?? null, up.height ?? null, kind, altText ?? null]
  );
  return { id: res.insertId, url: up.url };
}

const REFERENCES: [string, string, string][] = [
  ["site_settings", "logo_media_id", "Website logo"],
  ["site_settings", "favicon_media_id", "Favicon"],
  ["hero_slides", "media_id", "Homepage hero"],
  ["about_content", "profile_media_id", "About profile image"],
  ["shoots", "cover_media_id", "Shoot cover"],
  ["shoot_images", "media_id", "Shoot gallery"],
  ["albums", "cover_media_id", "Story cover"],
  ["album_images", "media_id", "Story gallery"],
  ["videos", "video_media_id", "Film"],
  ["videos", "thumbnail_media_id", "Film thumbnail"],
  ["services", "image_media_id", "Service image"],
];

/** Where (if anywhere) a media item is currently used. */
export async function getMediaUsage(mediaId: number): Promise<string[]> {
  const used: string[] = [];
  for (const [table, col, label] of REFERENCES) {
    const row = await queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM \`${table}\` WHERE \`${col}\` = ?`, [mediaId]);
    if (row && row.n > 0) used.push(label);
  }
  return used;
}

/** Delete the media row and its file, but only if nothing still references it. */
export async function deleteMediaIfUnused(mediaId: number): Promise<boolean> {
  if ((await getMediaUsage(mediaId)).length) return false;
  const m = await queryOne<{ file_url: string }>(`SELECT file_url FROM media WHERE id = ?`, [mediaId]);
  if (!m) return true;
  await exec(`DELETE FROM media WHERE id = ?`, [mediaId]);
  await (await getStorageProvider()).delete(m.file_url);
  return true;
}

/** media_id -> list of places it is used, for every media row (one query). */
export async function getUsageMap(): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  const sql = REFERENCES.map(([table, col, label]) => `SELECT \`${col}\` AS media_id, '${label}' AS label FROM \`${table}\` WHERE \`${col}\` IS NOT NULL`).join(" UNION ALL ");
  const rows = await query<{ media_id: number; label: string }>(sql);
  for (const r of rows) {
    const arr = map.get(r.media_id) ?? [];
    if (!arr.includes(r.label)) arr.push(r.label);
    map.set(r.media_id, arr);
  }
  return map;
}
