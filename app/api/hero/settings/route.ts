import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { logActivity, notify } from "@/lib/activity";
import { revalidatePath } from "next/cache";

const opt = (max: number) => z.string().trim().max(max).nullable().optional();
const schema = z.object({
  hero_enabled: z.boolean(),
  hero_autoplay: z.boolean(),
  // Bounded on purpose: no flicker-fast or stuck-forever slideshows.
  hero_interval_ms: z.number().int().min(3000, "Minimum is 3 seconds.").max(8000, "Maximum is 8 seconds."),
  hero_label: opt(120), hero_title: opt(255), hero_description: opt(500),
  hero_cta_primary_text: opt(60), hero_cta_primary_link: opt(255),
  hero_cta_secondary_text: opt(60), hero_cta_secondary_link: opt(255),
  hero_location_text: opt(120),
});

export async function PUT(req: NextRequest) {
  if (!(await getSessionUser())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;
  await query(
    `UPDATE homepage_settings SET hero_enabled=?, hero_autoplay=?, hero_interval_ms=?, hero_label=?, hero_title=?,
       hero_description=?, hero_cta_primary_text=?, hero_cta_primary_link=?, hero_cta_secondary_text=?,
       hero_cta_secondary_link=?, hero_location_text=? WHERE id=1`,
    [d.hero_enabled, d.hero_autoplay, d.hero_interval_ms, d.hero_label || null, d.hero_title || null,
     d.hero_description || null, d.hero_cta_primary_text || null, d.hero_cta_primary_link || null,
     d.hero_cta_secondary_text || null, d.hero_cta_secondary_link || null, d.hero_location_text || null]
  );
  await notify({ type: "HERO_CHANGED", title: "Homepage hero updated" });
  await logActivity("hero_changed", "Homepage hero settings updated");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
