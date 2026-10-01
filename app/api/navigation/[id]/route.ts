import { NextRequest } from "next/server";
import { exec } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { navSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const parsed = navSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  const id = Number((await params).id), d = parsed.data;
  if (d.label !== undefined) await exec(`UPDATE navigation_items SET label = ? WHERE id = ?`, [d.label, id]);
  if (d.href !== undefined) await exec(`UPDATE navigation_items SET href = ? WHERE id = ?`, [d.href, id]);
  if (d.visible !== undefined) await exec(`UPDATE navigation_items SET visible = ? WHERE id = ?`, [d.visible, id]);
  await logActivity("navigation_changed", "Menu updated");
  return ok();
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  await exec(`DELETE FROM navigation_items WHERE id = ?`, [Number((await params).id)]);
  await logActivity("navigation_changed", "Menu item removed");
  return ok();
}
