import { NextRequest } from "next/server";
import { exec } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { socialSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const parsed = socialSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  const id = Number((await params).id), d = parsed.data;
  if (d.platform_name !== undefined) await exec(`UPDATE social_platforms SET platform_name=? WHERE id=?`, [d.platform_name, id]);
  if (d.url !== undefined) await exec(`UPDATE social_platforms SET url=? WHERE id=?`, [d.url, id]);
  if (d.username !== undefined) await exec(`UPDATE social_platforms SET username=? WHERE id=?`, [d.username || null, id]);
  if (d.icon !== undefined) await exec(`UPDATE social_platforms SET icon=? WHERE id=?`, [d.icon || null, id]);
  if (d.enabled !== undefined) await exec(`UPDATE social_platforms SET enabled=? WHERE id=?`, [d.enabled, id]);
  await logActivity("social_updated", "Social platform updated");
  return ok();
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  await exec(`DELETE FROM social_platforms WHERE id = ?`, [Number((await params).id)]);
  await logActivity("social_removed", "Social platform removed");
  return ok();
}
