import { createHash } from "crypto";
import { exec, queryOne } from "@/lib/db";

const h = (s: string) => createHash("sha256").update(s).digest("hex");

/** Best-effort client IP. Behind a proxy/CDN make sure it sets x-forwarded-for. */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function isLimited(bucket: string, key: string, max: number, windowSec: number): Promise<boolean> {
  const row = await queryOne<{ n: number }>(
    `SELECT COUNT(*) AS n FROM rate_limit_events WHERE bucket=? AND key_hash=? AND created_at > (NOW() - INTERVAL ? SECOND)`,
    [bucket, h(key), windowSec]
  );
  return (row?.n ?? 0) >= max;
}

export async function recordHit(bucket: string, key: string) {
  await exec(`INSERT INTO rate_limit_events (bucket, key_hash) VALUES (?, ?)`, [bucket, h(key)]);
  // Housekeeping: occasionally purge old events and expired sessions.
  if (Math.random() < 0.02) {
    await exec(`DELETE FROM rate_limit_events WHERE created_at < (NOW() - INTERVAL 1 DAY)`);
    await exec(`DELETE FROM sessions WHERE expires_at < NOW()`);
    await exec(`DELETE FROM password_reset_tokens WHERE expires_at < (NOW() - INTERVAL 1 DAY)`);
  }
}

export async function clearHits(bucket: string, key: string) {
  await exec(`DELETE FROM rate_limit_events WHERE bucket=? AND key_hash=?`, [bucket, h(key)]);
}
