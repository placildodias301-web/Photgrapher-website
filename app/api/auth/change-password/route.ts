import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { queryOne, query } from "@/lib/db";
import { getSessionUser, hashPassword, verifyPassword, SESSION_COOKIE } from "@/lib/auth";
import { logActivity, notify } from "@/lib/activity";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10, "Use at least 10 characters.").max(200),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const row = await queryOne<{ password_hash: string }>(
    `SELECT password_hash FROM users WHERE id = ?`,
    [user.id]
  );
  if (!row || !(await verifyPassword(parsed.data.currentPassword, row.password_hash))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  }

  await query(`UPDATE users SET password_hash = ? WHERE id = ?`, [
    await hashPassword(parsed.data.newPassword),
    user.id,
  ]);
  // Sign out every other device/session; keep this one.
  const currentId = req.cookies.get(SESSION_COOKIE)?.value.split(".")[0] ?? "";
  await query(`DELETE FROM sessions WHERE user_id = ? AND id <> ?`, [user.id, currentId]);
  await notify({ type: "PASSWORD_CHANGED", title: "Password changed", body: "Other signed-in devices were signed out." });
  await logActivity("password_changed", "Password changed");
  return NextResponse.json({ ok: true });
}
