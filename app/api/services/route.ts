import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exec, query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, unauthorized } from "@/lib/api";
import { logActivity } from "@/lib/activity";

export async function GET() {
  if (!(await getSessionUser())) return unauthorized();
  return NextResponse.json({ items: await query(`SELECT s.id, s.name, s.description, s.published, m.file_url AS image_url FROM services s LEFT JOIN media m ON m.id=s.image_media_id ORDER BY s.display_order, s.id`) });
}
export async function POST(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  const parsed = z.object({ name: z.string().trim().min(1, "Enter a service name.").max(120), description: z.string().trim().max(3000).nullable().optional() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  const next = await queryOne<{ n: number | null }>(`SELECT MAX(display_order) AS n FROM services`);
  const r = await exec(`INSERT INTO services (name, description, display_order, published) VALUES (?, ?, ?, TRUE)`, [parsed.data.name, parsed.data.description || null, (next?.n ?? -1) + 1]);
  await logActivity("service_created", `Service added: ${parsed.data.name}`);
  return NextResponse.json({ ok: true, id: r.insertId });
}
