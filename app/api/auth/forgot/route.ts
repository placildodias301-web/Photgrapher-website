import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { exec, queryOne } from "@/lib/db";
import { bad } from "@/lib/api";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { clientIp, isLimited, recordHit } from "@/lib/ratelimit";
import { getSiteSettings } from "@/lib/settings";

const GENERIC = { ok: true, message: "If that email matches the recovery email on the account, a reset link is on its way. It expires in 30 minutes." };

export async function POST(req: NextRequest) {
  const parsed = z.object({ email: z.string().trim().max(255).email("Enter a valid email address.") }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  const email = parsed.data.email.toLowerCase();

  const ip = clientIp(req);
  if ((await isLimited("forgot_ip", ip, 5, 3600)) || (await isLimited("forgot_email", email, 3, 3600))) return bad("Too many requests. Please try again in an hour.", 429);
  await recordHit("forgot_ip", ip); await recordHit("forgot_email", email);

  if (!isEmailConfigured()) return bad("Password reset by email isn’t set up on this website yet. Please contact your developer.", 503);

  // Reset links must point at the real site, never at a Host header an attacker controls.
  const base = process.env.SITE_URL || (process.env.NODE_ENV !== "production" ? req.nextUrl.origin : "");
  if (!base) { console.error("SITE_URL is not set; refusing to build a password reset link."); return bad("Password reset isn’t configured correctly. Please contact your developer.", 503); }

  const user = await queryOne<{ id: number }>(`SELECT id FROM users WHERE LOWER(recovery_email) = ?`, [email]);
  if (user) {
    const token = randomBytes(32).toString("hex");
    await exec(`UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL`, [user.id]);
    await exec(`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, NOW() + INTERVAL 30 MINUTE)`, [user.id, createHash("sha256").update(token).digest("hex")]);
    const site = await getSiteSettings();
    try {
      await sendEmail({
        to: email, fromName: site.site_name, subject: `Reset your ${site.site_name} dashboard password`,
        text: `Someone asked to reset the dashboard password for ${site.site_name}.\n\nOpen this link within 30 minutes to choose a new password:\n${base}/reset-password?token=${token}\n\nIf this wasn't you, ignore this email. Your password won't change.`,
      });
    } catch (e) { console.error("Reset email failed", e); }
  }
  return NextResponse.json(GENERIC);
}
