import { cookies } from "next/headers";
import { randomBytes, randomUUID, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { query, queryOne } from "@/lib/db";

export const SESSION_COOKIE = "pascoal_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export type SessionUser = {
  id: number;
  username: string;
  display_name: string;
};

// ---------- Passwords ----------

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// ---------- Sessions (DB-backed, revocable) ----------
// Cookie value is `${sessionId}.${secret}`. Only sha256(secret) is stored,
// so a stolen DB dump alone can't be replayed as a valid cookie.

export async function createSession(
  userId: number,
  meta: { userAgent?: string; ip?: string } = {}
): Promise<string> {
  const id = randomUUID();
  const secret = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await query(
    `INSERT INTO sessions (id, user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userId, sha256(secret), meta.userAgent ?? null, meta.ip ?? null, expiresAt]
  );

  return `${id}.${secret}`;
}

export async function destroySession(cookieValue: string | undefined) {
  if (!cookieValue) return;
  const [id] = cookieValue.split(".");
  if (!id) return;
  await query(`DELETE FROM sessions WHERE id = ?`, [id]);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const [id, secret] = raw.split(".");
  if (!id || !secret) return null;

  const session = await queryOne<{
    user_id: number;
    token_hash: string;
    expires_at: string;
  }>(`SELECT user_id, token_hash, expires_at FROM sessions WHERE id = ?`, [id]);

  if (!session) return null;
  if (new Date(session.expires_at.replace(" ", "T") + "Z").getTime() < Date.now()) return null; // DB values are UTC
  if (session.token_hash !== sha256(secret)) return null;

  const user = await queryOne<SessionUser>(
    `SELECT id, username, display_name FROM users WHERE id = ?`,
    [session.user_id]
  );
  return user;
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}
