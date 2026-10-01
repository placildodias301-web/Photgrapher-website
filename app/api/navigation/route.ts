import { NextRequest, NextResponse } from "next/server";
import { exec, query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, unauthorized } from "@/lib/api";
import { navSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";

export async function GET() {
  if (!(await getSessionUser())) return unauthorized();
  return NextResponse.json({ items: await query(`SELECT id, label, href, visible FROM navigation_items ORDER BY display_order, id`) });
}
export async function POST(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  const parsed = navSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  const next = await queryOne<{ n: number | null }>(`SELECT MAX(display_order) AS n FROM navigation_items`);
  const r = await exec(`INSERT INTO navigation_items (label, href, display_order, visible) VALUES (?, ?, ?, ?)`, [parsed.data.label, parsed.data.href, (next?.n ?? -1) + 1, parsed.data.visible ?? true]);
  await logActivity("navigation_changed", `Menu item added: ${parsed.data.label}`);
  return NextResponse.json({ ok: true, id: r.insertId });
}
