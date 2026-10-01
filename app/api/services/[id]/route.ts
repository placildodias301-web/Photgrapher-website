import { NextRequest } from "next/server";
import { z } from "zod";
import { exec, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { deleteMediaIfUnused } from "@/lib/media";
import { logActivity } from "@/lib/activity";

const patch = z.object({ name: z.string().trim().min(1, "Enter a service name.").max(120).optional(), description: z.string().trim().max(3000).nullable().optional(), published: z.boolean().optional() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const id = Number((await params).id);
  const parsed = patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  const d = parsed.data;
  if (d.name !== undefined) await exec(`UPDATE services SET name = ? WHERE id = ?`, [d.name, id]);
  if (d.description !== undefined) await exec(`UPDATE services SET description = ? WHERE id = ?`, [d.description || null, id]);
  if (d.published !== undefined) await exec(`UPDATE services SET published = ? WHERE id = ?`, [d.published, id]);
  await logActivity("service_updated", "Service updated");
  return ok();
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const id = Number((await params).id);
  const s = await queryOne<{ name: string; image_media_id: number | null }>(`SELECT name, image_media_id FROM services WHERE id = ?`, [id]);
  if (!s) return bad("Service not found.", 404);
  await exec(`DELETE FROM services WHERE id = ?`, [id]);
  if (s.image_media_id) await deleteMediaIfUnused(s.image_media_id);
  await logActivity("service_deleted", `Service deleted: ${s.name}`);
  return ok();
}
