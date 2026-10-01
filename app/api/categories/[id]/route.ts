import { NextRequest } from "next/server";
import { z } from "zod";
import { exec, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { logActivity } from "@/lib/activity";

const patch = z.object({ name: z.string().trim().min(1).max(60).optional(), enabled: z.boolean().optional() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const id = Number((await params).id);
  const parsed = patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid request.");
  if (parsed.data.name !== undefined) {
    const dup = await queryOne(`SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id <> ?`, [parsed.data.name, id]);
    if (dup) return bad("You already have a category with that name.", 409);
    await exec(`UPDATE categories SET name = ? WHERE id = ?`, [parsed.data.name, id]);
  }
  if (parsed.data.enabled !== undefined) await exec(`UPDATE categories SET enabled = ? WHERE id = ?`, [parsed.data.enabled, id]);
  await logActivity("category_updated", "Category updated");
  return ok();
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const id = Number((await params).id);
  const c = await queryOne<{ name: string }>(`SELECT name FROM categories WHERE id = ?`, [id]);
  if (!c) return bad("Category not found.", 404);
  await exec(`DELETE FROM categories WHERE id = ?`, [id]); // shoots keep existing, category becomes empty
  await logActivity("category_deleted", `Category deleted: ${c.name}`);
  return ok();
}
