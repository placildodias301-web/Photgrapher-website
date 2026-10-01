import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exec } from "@/lib/db";
import { bad } from "@/lib/api";
import { cleanText } from "@/lib/validation";
import { clientIp, isLimited, recordHit } from "@/lib/ratelimit";
import { logActivity, notify } from "@/lib/activity";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(150),
  email: z.string().trim().max(255).email("Please enter a valid email address."),
  phone: z.string().trim().max(40).regex(/^[0-9+()\-.\s]*$/, "Phone numbers can only use digits, spaces, + and dashes.").optional().or(z.literal("")),
  event_type: z.string().trim().max(80).optional().or(z.literal("")),
  event_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a valid date."), z.literal("")]).optional(),
  location: z.string().trim().max(150).optional().or(z.literal("")),
  budget: z.string().trim().max(80).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Please tell us a little about what you have in mind.").max(5000),
  website: z.string().max(200).optional(), // honeypot: real visitors never fill this in
});

// Public endpoint: the website contact form.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  const d = parsed.data;

  // Bots fill hidden fields. Pretend it worked so they don't adapt, but store nothing.
  if (d.website) return NextResponse.json({ ok: true });

  const ip = clientIp(req);
  if (await isLimited("enquiry", ip, 5, 3600)) return bad("You’ve sent several messages recently. Please try again in a little while, or contact us on WhatsApp.", 429);
  await recordHit("enquiry", ip);

  const name = cleanText(d.name, 150), message = cleanText(d.message, 5000);
  const res = await exec(
    `INSERT INTO enquiries (name, email, phone, event_type, event_date, location, budget, message) VALUES (?,?,?,?,?,?,?,?)`,
    [name, d.email.toLowerCase(), cleanText(d.phone ?? "", 40) || null, cleanText(d.event_type ?? "", 80) || null, d.event_date || null,
     cleanText(d.location ?? "", 150) || null, cleanText(d.budget ?? "", 80) || null, message]);
  await exec(`INSERT INTO messages (enquiry_id, sender, body, delivery_status) VALUES (?, 'customer', ?, 'received')`, [res.insertId, message]);
  await notify({ type: "NEW_ENQUIRY", title: `New enquiry from ${name}`, body: message.slice(0, 140), relatedType: "enquiry", relatedId: res.insertId });
  await logActivity("enquiry_received", `New enquiry received from ${name}`);
  return NextResponse.json({ ok: true });
}
