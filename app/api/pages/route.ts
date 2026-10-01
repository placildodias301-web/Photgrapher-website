import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, unauthorized } from "@/lib/api";
import { createPage, pageSchema } from "@/lib/pages";
import { logActivity, notify } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export async function GET() {
  if (!(await getSessionUser())) return unauthorized();
  return NextResponse.json({ items: await query(`SELECT id, title, slug, published, updated_at FROM custom_pages ORDER BY updated_at DESC, id DESC`) });
}

export async function POST(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  const parsed = pageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  const r = await createPage(parsed.data);
  if (!r.ok) return bad(r.error, 409);
  await notify({ type: "SETTINGS_CHANGED", title: `New page created: ${parsed.data.title}` });
  await logActivity("page_created", `Page created: ${parsed.data.title}`);
  if (parsed.data.published) revalidatePath(`/${r.slug}`);
  return NextResponse.json({ ok: true, id: r.id, slug: r.slug });
}
