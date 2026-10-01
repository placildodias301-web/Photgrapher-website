import { NextRequest } from "next/server";
import { exec, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { createMedia, deleteMediaIfUnused, validateImage } from "@/lib/media";
import { logActivity, notify } from "@/lib/activity";

const cur = async () => (await queryOne<{ id: number | null }>(`SELECT profile_media_id AS id FROM about_content WHERE id = 1`))?.id ?? null;

export async function POST(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return bad("Choose a photo.");
  const err = validateImage(file); if (err) return bad(err);
  try {
    const old = await cur();
    const m = await createMedia(file, "Portrait of the photographer");
    await exec(`UPDATE about_content SET profile_media_id = ? WHERE id = 1`, [m.id]);
    if (old) await deleteMediaIfUnused(old);
    await notify({ type: "SETTINGS_CHANGED", title: "About photo changed" });
    await logActivity("about_photo_changed", "About page photo changed");
    return ok({ url: m.url });
  } catch (e) { console.error(e); return bad("Upload failed. Please try again.", 500); }
}
export async function DELETE() {
  if (!(await getSessionUser())) return unauthorized();
  const old = await cur();
  await exec(`UPDATE about_content SET profile_media_id = NULL WHERE id = 1`);
  if (old) await deleteMediaIfUnused(old);
  await logActivity("about_photo_changed", "About page photo removed");
  return ok();
}
