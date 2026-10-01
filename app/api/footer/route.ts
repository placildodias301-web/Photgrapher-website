import { NextRequest } from "next/server";
import { z } from "zod";
import { exec } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { logActivity } from "@/lib/activity";

export async function PUT(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  const parsed = z.object({ footer_description: z.string().trim().max(255), copyright_text: z.string().trim().max(255) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  await exec(`UPDATE site_settings SET footer_description=?, copyright_text=? WHERE id=1`, [parsed.data.footer_description || null, parsed.data.copyright_text || null]);
  await logActivity("footer_changed", "Footer updated");
  return ok();
}
