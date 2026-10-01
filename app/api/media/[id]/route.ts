import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { deleteMediaIfUnused, getMediaUsage } from "@/lib/media";
import { logActivity } from "@/lib/activity";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const id = Number((await params).id);
  const m = await queryOne<{ file_name: string }>(`SELECT file_name FROM media WHERE id = ?`, [id]);
  if (!m) return bad("File not found.", 404);
  const usage = await getMediaUsage(id);
  if (usage.length) return NextResponse.json({ error: `This file is currently used by ${usage.join(", ")}. Remove it there first.`, usage }, { status: 409 });
  await deleteMediaIfUnused(id);
  await logActivity("media_deleted", `File deleted: ${m.file_name}`);
  return ok();
}
