import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { exec, queryOne } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { bad } from "@/lib/api";
import { clientIp, isLimited, recordHit } from "@/lib/ratelimit";
import { logActivity, notify } from "@/lib/activity";

export async function POST(req: NextRequest) {
  const parsed = z.object({ token: z.string().min(20).max(200), password: z.string().min(10, "Use at least 10 characters.").max(200) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);

  const ip = clientIp(req);
  if (await isLimited("reset_ip", ip, 10, 3600)) return bad("Too many attempts. Please try again later.", 429);
  await recordHit("reset_ip", ip);

  const row = await queryOne<{ id: number; user_id: number }>(
    `SELECT id, user_id FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()`,
    [createHash("sha256").update(parsed.data.token).digest("hex")]);
  if (!row) return bad("This reset link is invalid or has expired. Please request a new one.", 400);

  await exec(`UPDATE users SET password_hash = ? WHERE id = ?`, [await hashPassword(parsed.data.password), row.user_id]);
  await exec(`UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL`, [row.user_id]);
  await exec(`DELETE FROM sessions WHERE user_id = ?`, [row.user_id]); // sign out everywhere
  await notify({ type: "PASSWORD_CHANGED", title: "Password reset", body: "The password was reset using the recovery email." });
  await logActivity("password_reset", "Password reset via recovery email");
  return NextResponse.json({ ok: true });
}
