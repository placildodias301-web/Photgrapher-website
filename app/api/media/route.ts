import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, unauthorized } from "@/lib/api";
import { createMedia, getUsageMap, validateImage, validateVideo } from "@/lib/media";
import { logActivity, notify } from "@/lib/activity";

export type MediaRow = { id: number; file_name: string; file_url: string; mime_type: string; file_size: number; width: number | null; height: number | null; type: "image" | "video"; created_at: string };
const PAGE_SIZE = 36;

export async function GET(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type"), usage = sp.get("usage") ?? "", q = (sp.get("q") ?? "").trim(), page = Math.max(Number(sp.get("page")) || 1, 1);

  const where: string[] = []; const args: unknown[] = [];
  if (type === "image" || type === "video") { where.push("type = ?"); args.push(type); }
  if (q) { where.push("(file_name LIKE ? OR alt_text LIKE ?)"); args.push(`%${q}%`, `%${q}%`); }
  const rows = await query<MediaRow>(`SELECT id, file_name, file_url, mime_type, file_size, width, height, type, created_at FROM media ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY id DESC`, args);

  const usageMap = await getUsageMap();
  const groups: Record<string, (labels: string[]) => boolean> = {
    unused: (l) => l.length === 0,
    hero: (l) => l.includes("Homepage hero"),
    branding: (l) => l.includes("Website logo") || l.includes("Favicon"),
    profile: (l) => l.includes("About profile image"),
    shoots: (l) => l.some((x) => x.startsWith("Shoot")),
    stories: (l) => l.some((x) => x.startsWith("Story")),
    films: (l) => l.some((x) => x.startsWith("Film")),
    services: (l) => l.includes("Service image"),
  };
  const filtered = usage && groups[usage] ? rows.filter((r) => groups[usage](usageMap.get(r.id) ?? [])) : rows;
  const items = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => ({ ...r, used_by: usageMap.get(r.id) ?? [] }));
  return NextResponse.json({ items, total: filtered.length, page, pageSize: PAGE_SIZE });
}

// Upload files into the library without attaching them to anything yet.
export async function POST(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  const files = (await req.formData()).getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return bad("Choose at least one file.");
  let images = 0, videos = 0; const failed: string[] = [];
  for (const f of files) {
    const isVideo = f.type.startsWith("video/");
    const err = isVideo ? validateVideo(f) : validateImage(f);
    if (err) { failed.push(err); continue; }
    try { await createMedia(f, null); if (isVideo) videos++; else images++; }
    catch (e) { console.error(e); failed.push(`"${f.name}" failed to upload.`); await notify({ type: "UPLOAD_FAILED", title: "Upload failed", body: f.name }); }
  }
  if (images) { await notify({ type: "PHOTOS_UPLOADED", title: `${images} photo${images > 1 ? "s" : ""} added to the media library` }); await logActivity("media_uploaded", `${images} image(s) uploaded to the media library`); }
  if (videos) { await notify({ type: "VIDEO_UPLOADED", title: `${videos} video${videos > 1 ? "s" : ""} added to the media library` }); await logActivity("media_uploaded", `${videos} video(s) uploaded to the media library`); }
  return NextResponse.json({ ok: images + videos > 0, added: images + videos, failed }, { status: images + videos ? 200 : 400 });
}
