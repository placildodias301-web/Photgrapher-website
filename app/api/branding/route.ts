import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { logActivity, notify } from "@/lib/activity";
import { revalidatePath } from "next/cache";

const schema = z.object({
  site_name: z.string().trim().min(1).max(120),
  site_description: z.string().trim().max(255).nullable().optional(),
  copyright_text: z.string().trim().max(255).nullable().optional(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #c9a96e").nullable().optional().or(z.literal("")),
});

export async function GET() {
  if (!(await getSessionUser())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json(await getSiteSettings());
}

export async function PATCH(req: NextRequest) {
  if (!(await getSessionUser())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;

  const before = await getSiteSettings();
  await query(
    `UPDATE site_settings SET site_name=?, site_description=?, copyright_text=?, accent_color=? WHERE id=1`,
    [d.site_name, d.site_description || null, d.copyright_text || null, d.accent_color || null]
  );
  if (before.site_name !== d.site_name) {
    await notify({ type: "WEBSITE_NAME_CHANGED", title: "Website name changed", body: `“${before.site_name}” → “${d.site_name}”` });
    await logActivity("site_name_changed", `Website name changed to ${d.site_name}`);
  } else {
    await notify({ type: "SETTINGS_CHANGED", title: "Website settings changed" });
    await logActivity("settings_changed", "Branding settings updated");
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
