import { NextRequest } from "next/server";
import { exec } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/api";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  await exec(`DELETE FROM notifications WHERE id = ?`, [Number((await params).id)]);
  return ok();
}
