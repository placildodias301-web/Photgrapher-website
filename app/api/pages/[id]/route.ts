import { NextRequest, NextResponse } from "next/server";
import { exec, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { pageSchema, updatePage } from "@/lib/pages";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const row = await queryOne(`SELECT id, title, slug, content, published FROM custom_pages WHERE id = ?`, [Number((await params).id)]);
  return row ? NextResponse.json(row) : bad("Page not found.", 404);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const id = Number((await params).id);
  const parsed = pageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  const ok2 = await updatePage(id, parsed.data);
  if (!ok2) return bad("Page not found.", 404);
  const row = await queryOne<{ slug: string }>(`SELECT slug FROM custom_pages WHERE id = ?`, [id]);
  await logActivity("page_updated", `Page updated: ${parsed.data.title}`);
  if (row) revalidatePath(`/${row.slug}`);
  return ok();
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const id = Number((await params).id);
  const row = await queryOne<{ title: string; slug: string }>(`SELECT title, slug FROM custom_pages WHERE id = ?`, [id]);
  if (!row) return bad("Page not found.", 404);
  await exec(`DELETE FROM custom_pages WHERE id = ?`, [id]);
  await logActivity("page_deleted", `Page deleted: ${row.title}`);
  revalidatePath(`/${row.slug}`);
  return ok();
}
