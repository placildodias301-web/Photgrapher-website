import { NextRequest } from "next/server";
import { z } from "zod";
import { exec, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { STATUSES, STATUS_LABEL } from "@/lib/enquiry-status";
import { logActivity } from "@/lib/activity";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const parsed = z.object({ status: z.enum(STATUSES) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid status.");
  const id = Number((await params).id);
  const e = await queryOne<{ name: string }>(`SELECT name FROM enquiries WHERE id = ?`, [id]);
  if (!e) return bad("Enquiry not found.", 404);
  await exec(`UPDATE enquiries SET status = ? WHERE id = ?`, [parsed.data.status, id]);
  await logActivity("enquiry_status", `${e.name}’s enquiry marked ${STATUS_LABEL[parsed.data.status]}`);
  return ok();
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const id = Number((await params).id);
  const e = await queryOne<{ name: string }>(`SELECT name FROM enquiries WHERE id = ?`, [id]);
  if (!e) return bad("Enquiry not found.", 404);
  await exec(`DELETE FROM enquiries WHERE id = ?`, [id]);
  await exec(`DELETE FROM notifications WHERE related_type = 'enquiry' AND related_id = ?`, [id]);
  await logActivity("enquiry_deleted", `Enquiry from ${e.name} deleted`);
  return ok();
}
