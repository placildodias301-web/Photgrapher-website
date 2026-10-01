import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createMedia, deleteMediaIfUnused, validateImage } from "@/lib/media";
import { logActivity, notify } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const id = Number((await params).id);
  const slide = await queryOne<{ media_id: number }>(`SELECT media_id FROM hero_slides WHERE id = ?`, [id]);
  if (!slide) return NextResponse.json({ error: "Image not found." }, { status: 404 });
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file." }, { status: 400 });
  const err = validateImage(file);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  try {
    const media = await createMedia(file, null);
    await query(`UPDATE hero_slides SET media_id = ? WHERE id = ?`, [media.id, id]);
    await deleteMediaIfUnused(slide.media_id);
    await notify({ type: "HERO_CHANGED", title: "Hero image replaced" });
    await logActivity("hero_changed", "Hero image replaced");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch {
    await notify({ type: "UPLOAD_FAILED", title: "Hero image upload failed", body: file.name });
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
