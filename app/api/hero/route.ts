import { NextRequest, NextResponse } from "next/server";
import { exec, query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createMedia, validateImage } from "@/lib/media";
import { logActivity, notify } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export async function GET() {
  if (!(await getSessionUser())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const slides = await query(
    `SELECT h.id, h.alt_text, h.active, h.display_order, m.file_url AS url
       FROM hero_slides h JOIN media m ON m.id = h.media_id ORDER BY h.display_order, h.id`
  );
  return NextResponse.json({ slides });
}

// Upload one or many images; each becomes a new slide at the end.
export async function POST(req: NextRequest) {
  if (!(await getSessionUser())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const files = (await req.formData()).getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "Choose at least one image." }, { status: 400 });

  const added: number[] = [];
  const failed: string[] = [];
  for (const file of files) {
    const err = validateImage(file);
    if (err) { failed.push(err); continue; }
    try {
      const media = await createMedia(file, null);
      const next = await queryOne<{ n: number | null }>(`SELECT MAX(display_order) AS n FROM hero_slides`);
      const res = await exec(
        `INSERT INTO hero_slides (media_id, alt_text, display_order, active) VALUES (?, ?, ?, TRUE)`,
        [media.id, file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), (next?.n ?? -1) + 1]
      );
      added.push(res.insertId);
    } catch {
      failed.push(`"${file.name}" failed to upload.`);
      await notify({ type: "UPLOAD_FAILED", title: "Hero image upload failed", body: file.name });
    }
  }
  if (added.length) {
    await notify({ type: "HERO_CHANGED", title: "Hero images changed", body: `${added.length} image(s) added` });
    await logActivity("hero_changed", `${added.length} hero image(s) added`);
    revalidatePath("/");
  }
  return NextResponse.json({ ok: added.length > 0, added: added.length, failed }, { status: added.length ? 200 : 400 });
}
