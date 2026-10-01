import { NextRequest } from "next/server";
import { z } from "zod";
import { exec } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";

export async function POST(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  const parsed = z.union([z.object({ all: z.literal(true) }), z.object({ id: z.number().int() })]).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid request.");
  if ("all" in parsed.data) await exec(`UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE`);
  else await exec(`UPDATE notifications SET is_read = TRUE WHERE id = ?`, [parsed.data.id]);
  return ok();
}
