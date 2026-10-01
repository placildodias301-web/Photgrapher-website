import { NextRequest, NextResponse } from "next/server";
import { exec, query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { unauthorized } from "@/lib/api";
import { notificationHref } from "@/lib/notify-links";
import { toIso } from "@/lib/format";

export async function GET(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 20, 1), 200);
  const rows = await query<{ id: number; type: string; title: string; body: string | null; related_type: string | null; related_id: number | null; is_read: number; created_at: string }>(
    `SELECT id, type, title, body, related_type, related_id, is_read, created_at FROM notifications ORDER BY id DESC LIMIT ?`, [limit]);
  const unread = (await queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM notifications WHERE is_read = FALSE`))?.n ?? 0;
  return NextResponse.json({
    unread,
    items: rows.map((r) => ({ id: r.id, title: r.title, body: r.body, read: !!r.is_read, created_at: toIso(r.created_at), href: notificationHref(r) })),
  });
}

// DELETE /api/notifications?scope=read clears everything already read.
export async function DELETE(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  if (req.nextUrl.searchParams.get("scope") === "read") await exec(`DELETE FROM notifications WHERE is_read = TRUE`);
  return NextResponse.json({ ok: true });
}
