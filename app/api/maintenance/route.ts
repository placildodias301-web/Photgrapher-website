import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { logActivity, notify } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export async function PUT(req: NextRequest) {
  if (!(await getSessionUser())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const parsed = z.object({ enabled: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  await query(`UPDATE site_settings SET maintenance_mode=? WHERE id=1`, [parsed.data.enabled]);
  await notify({ type: "SETTINGS_CHANGED", title: `Maintenance mode ${parsed.data.enabled ? "turned on" : "turned off"}` });
  await logActivity("maintenance_mode", `Maintenance mode ${parsed.data.enabled ? "ON" : "OFF"}`);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
