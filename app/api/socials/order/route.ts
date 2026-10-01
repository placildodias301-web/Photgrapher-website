import { NextRequest } from "next/server";
import { z } from "zod";
import { exec } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";

export async function PUT(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  const parsed = z.object({ ids: z.array(z.number().int()).min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid order.");
  for (let i = 0; i < parsed.data.ids.length; i++) await exec(`UPDATE social_platforms SET display_order = ? WHERE id = ?`, [i, parsed.data.ids[i]]);
  return ok();
}
