import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, queryOne } from "@/lib/db";
import { getSessionUser, verifyPassword } from "@/lib/auth";
import { logActivity, notify } from "@/lib/activity";

const schema = z.object({
  currentPassword: z.string().min(1, "Enter your current password to confirm."),
  display_name: z.string().trim().min(1).max(120),
  username: z.string().trim().min(3, "Username needs at least 3 characters.").max(64).regex(/^[a-zA-Z0-9._-]+$/, "Username can use letters, numbers, dots, dashes and underscores."),
  recovery_email: z.string().trim().max(255).email("That doesn’t look like a valid email.").or(z.literal("")),
});

export async function GET() {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const row = await queryOne<{ recovery_email: string | null }>(`SELECT recovery_email FROM users WHERE id=?`, [u.id]);
  return NextResponse.json({ ...u, recovery_email: row?.recovery_email ?? "" });
}

export async function PATCH(req: NextRequest) {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;

  const row = await queryOne<{ password_hash: string; recovery_email: string | null }>(
    `SELECT password_hash, recovery_email FROM users WHERE id=?`, [u.id]);
  if (!row || !(await verifyPassword(d.currentPassword, row.password_hash)))
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });

  if (d.username !== u.username) {
    const taken = await queryOne(`SELECT id FROM users WHERE username=? AND id<>?`, [d.username, u.id]);
    if (taken) return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  await query(`UPDATE users SET username=?, display_name=?, recovery_email=? WHERE id=?`,
    [d.username, d.display_name, d.recovery_email || null, u.id]);

  if (d.username !== u.username) { await notify({ type: "USERNAME_CHANGED", title: "Username changed" }); await logActivity("username_changed", "Username changed"); }
  if ((row.recovery_email ?? "") !== d.recovery_email) { await notify({ type: "RECOVERY_EMAIL_CHANGED", title: "Recovery email changed" }); await logActivity("recovery_email_changed", "Recovery email changed"); }
  return NextResponse.json({ ok: true });
}
