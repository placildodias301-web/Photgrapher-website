import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { deleteMediaIfUnused } from "@/lib/media";
import { logActivity, notify } from "@/lib/activity";
import { revalidatePath } from "next/cache";

const patch = z.object({ active: z.boolean().optional(), alt_text: z.string().trim().max(255).optional() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const id = Number((await params).id);
  const parsed = patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !Number.isInteger(id)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { active, alt_text } = parsed.data;
  if (active !== undefined) await query(`UPDATE hero_slides SET active = ? WHERE id = ?`, [active, id]);
  if (alt_text !== undefined) await query(`UPDATE hero_slides SET alt_text = ? WHERE id = ?`, [alt_text, id]);
  await notify({ type: "HERO_CHANGED", title: "Hero images changed" });
  await logActivity("hero_changed", active !== undefined ? `Hero image ${active ? "enabled" : "disabled"}` : "Hero image description updated");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const id = Number((await params).id);
  const slide = await queryOne<{ media_id: number }>(`SELECT media_id FROM hero_slides WHERE id = ?`, [id]);
  if (!slide) return NextResponse.json({ error: "Image not found." }, { status: 404 });
  await query(`DELETE FROM hero_slides WHERE id = ?`, [id]);
  await deleteMediaIfUnused(slide.media_id);
  await notify({ type: "HERO_CHANGED", title: "Hero image removed" });
  await logActivity("hero_changed", "Hero image removed");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
