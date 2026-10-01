import { NextRequest, NextResponse } from "next/server";
import { exec, query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, unauthorized } from "@/lib/api";
import { socialSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";



export async function GET() {
  if (!(await getSessionUser())) return unauthorized();
  return NextResponse.json({ items: await query(`SELECT id, platform_name, url, username, icon, enabled FROM social_platforms ORDER BY display_order, id`) });
}
export async function POST(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  const parsed = socialSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  const d = parsed.data;
  const next = await queryOne<{ n: number | null }>(`SELECT MAX(display_order) AS n FROM social_platforms`);
  const r = await exec(`INSERT INTO social_platforms (platform_name, url, username, icon, display_order, enabled) VALUES (?,?,?,?,?,?)`,
    [d.platform_name, d.url, d.username || null, d.icon || null, (next?.n ?? -1) + 1, d.enabled ?? true]);
  await logActivity("social_added", `Social platform added: ${d.platform_name}`);
  return NextResponse.json({ ok: true, id: r.insertId });
}
