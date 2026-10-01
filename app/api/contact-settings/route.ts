import { NextRequest } from "next/server";
import { z } from "zod";
import { exec } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { httpUrl } from "@/lib/validation";
import { logActivity, notify } from "@/lib/activity";

const phone = z.string().trim().max(40).regex(/^[0-9+()\-.\s]*$/, "Phone numbers can only use digits, spaces, + and dashes.");
const schema = z.object({
  phone, whatsapp: phone,
  public_email: z.union([z.string().trim().max(255).email("That doesn’t look like a valid email."), z.literal("")]),
  location: z.string().trim().max(255),
  maps_url: z.union([httpUrl, z.literal("")]),
});

export async function PUT(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  const d = parsed.data;
  await exec(`UPDATE site_settings SET phone=?, whatsapp=?, public_email=?, location=?, maps_url=? WHERE id=1`,
    [d.phone || null, d.whatsapp || null, d.public_email || null, d.location || null, d.maps_url || null]);
  await notify({ type: "SETTINGS_CHANGED", title: "Contact details changed" });
  await logActivity("contact_changed", "Contact details changed");
  return ok();
}
