import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { queryOne } from "@/lib/db";
import {
  createSession,
  verifyPassword,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { logActivity, notify } from "@/lib/activity";
import { clearHits, clientIp, isLimited, recordHit } from "@/lib/ratelimit";

const schema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
  }
  const { username, password } = parsed.data;

  // Throttle guessing: per IP and per username, 15-minute window.
  const ip = clientIp(req);
  const uname = username.toLowerCase();
  if ((await isLimited("login_ip", ip, 20, 900)) || (await isLimited("login_user", uname, 5, 900))) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  const user = await queryOne<{ id: number; password_hash: string }>(
    `SELECT id, password_hash FROM users WHERE username = ?`,
    [username]
  );

  // Same message whether the user exists or not, to avoid username probing.
  const ok = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !ok) {
    await recordHit("login_ip", ip);
    await recordHit("login_user", uname);
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  const token = await createSession(user.id, {
    userAgent: req.headers.get("user-agent")?.slice(0, 250),
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  await clearHits("login_user", uname);
  await notify({
    type: "NEW_LOGIN",
    title: "New login",
    body: "Someone signed in to the dashboard.",
  });
  await logActivity("login", "Signed in to the dashboard");

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
