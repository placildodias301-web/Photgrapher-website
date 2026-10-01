import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exec } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { getAbout } from "@/lib/public";
import { logActivity, notify } from "@/lib/activity";

const o = (max: number) => z.string().trim().max(max).nullable().optional();
const schema = z.object({ name: o(120), title: o(150), heading: o(150), biography: o(8000), location: o(150), quote: o(400) });

export async function GET() {
  if (!(await getSessionUser())) return unauthorized();
  return NextResponse.json(await getAbout());
}
export async function PUT(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  const d = parsed.data;
  await exec(`UPDATE about_content SET name=?, title=?, heading=?, biography=?, location=?, quote=? WHERE id=1`,
    [d.name || null, d.title || null, d.heading || null, d.biography || null, d.location || null, d.quote || null]);
  await notify({ type: "SETTINGS_CHANGED", title: "About page updated" });
  await logActivity("about_updated", "About page updated");
  return ok();
}
