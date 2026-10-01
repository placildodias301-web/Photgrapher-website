import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exec, query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, unauthorized } from "@/lib/api";
import { uniqueSlug } from "@/lib/slug";
import { logActivity } from "@/lib/activity";

export async function GET() {
  if (!(await getSessionUser())) return unauthorized();
  const items = await query(`SELECT c.id, c.name, c.slug, c.enabled, c.display_order,
      (SELECT COUNT(*) FROM shoots s WHERE s.category_id = c.id) AS shoot_count FROM categories c ORDER BY c.display_order, c.id`);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  const parsed = z.object({ name: z.string().trim().min(1, "Enter a category name.").max(60) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  const dup = await queryOne(`SELECT id FROM categories WHERE LOWER(name) = LOWER(?)`, [parsed.data.name]);
  if (dup) return bad("You already have a category with that name.", 409);
  const next = await queryOne<{ n: number | null }>(`SELECT MAX(display_order) AS n FROM categories`);
  const r = await exec(`INSERT INTO categories (name, slug, display_order) VALUES (?, ?, ?)`, [parsed.data.name, await uniqueSlug("categories", parsed.data.name), (next?.n ?? -1) + 1]);
  await logActivity("category_created", `Category added: ${parsed.data.name}`);
  return NextResponse.json({ ok: true, id: r.insertId });
}
