import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createMedia, deleteMediaIfUnused, validateImage, ALLOWED_FAVICON_TYPES, ALLOWED_IMAGE_TYPES } from "@/lib/media";
import { logActivity, notify } from "@/lib/activity";
import { revalidatePath } from "next/cache";

const COLS: Record<string, { col: string; label: string; type: string }> = {
  logo: { col: "logo_media_id", label: "Logo", type: "LOGO_CHANGED" },
  favicon: { col: "favicon_media_id", label: "Favicon", type: "SETTINGS_CHANGED" },
};

async function current(col: string) {
  return (await queryOne<{ id: number | null }>(`SELECT ${col} AS id FROM site_settings WHERE id = 1`))?.id ?? null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const cfg = COLS[kind];
  if (!cfg) return NextResponse.json({ error: "Unknown asset." }, { status: 404 });
  if (!(await getSessionUser())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  const err = validateImage(file, kind === "favicon" ? ALLOWED_FAVICON_TYPES : ALLOWED_IMAGE_TYPES);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  try {
    const old = await current(cfg.col);
    const media = await createMedia(file, `${cfg.label}`);
    await query(`UPDATE site_settings SET ${cfg.col} = ? WHERE id = 1`, [media.id]);
    if (old) await deleteMediaIfUnused(old);
    await notify({ type: cfg.type, title: `${cfg.label} changed` });
    await logActivity(`${kind}_changed`, `${cfg.label} changed`);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, url: media.url });
  } catch (e) {
    console.error(`${cfg.label} upload failed`, e);
    await notify({ type: "UPLOAD_FAILED", title: `${cfg.label} upload failed`, body: file.name });
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const cfg = COLS[kind];
  if (!cfg) return NextResponse.json({ error: "Unknown asset." }, { status: 404 });
  if (!(await getSessionUser())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const old = await current(cfg.col);
  await query(`UPDATE site_settings SET ${cfg.col} = NULL WHERE id = 1`);
  if (old) await deleteMediaIfUnused(old);
  await notify({ type: cfg.type, title: `${cfg.label} removed` });
  await logActivity(`${kind}_removed`, `${cfg.label} removed`);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
