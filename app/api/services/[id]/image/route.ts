import { NextRequest } from "next/server";
import { exec, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { createMedia, deleteMediaIfUnused, validateImage } from "@/lib/media";

const cur = async (id: number) => (await queryOne<{ m: number | null }>(`SELECT image_media_id AS m FROM services WHERE id = ?`, [id]));

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const id = Number((await params).id);
  const old = await cur(id); if (!old) return bad("Service not found.", 404);
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return bad("Choose an image.");
  const err = validateImage(file); if (err) return bad(err);
  try {
    const m = await createMedia(file, null);
    await exec(`UPDATE services SET image_media_id = ? WHERE id = ?`, [m.id, id]);
    if (old.m) await deleteMediaIfUnused(old.m);
    return ok({ url: m.url });
  } catch (e) { console.error(e); return bad("Upload failed. Please try again.", 500); }
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const id = Number((await params).id);
  const old = await cur(id); if (!old) return bad("Service not found.", 404);
  await exec(`UPDATE services SET image_media_id = NULL WHERE id = ?`, [id]);
  if (old.m) await deleteMediaIfUnused(old.m);
  return ok();
}
