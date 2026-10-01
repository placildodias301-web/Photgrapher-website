import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

const schema = z.object({ ids: z.array(z.number().int()).min(1) });

export async function PUT(req: NextRequest) {
  if (!(await getSessionUser())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order." }, { status: 400 });
  for (let i = 0; i < parsed.data.ids.length; i++) {
    await query(`UPDATE hero_slides SET display_order = ? WHERE id = ?`, [i, parsed.data.ids[i]]);
  }
  await logActivity("hero_changed", "Hero images reordered");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
