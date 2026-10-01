import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { exec, queryOne } from "@/lib/db";
import { bad } from "@/lib/api";
import { cleanText } from "@/lib/validation";
import { logActivity, notify } from "@/lib/activity";

// Receives customer email replies from an inbound-email service (Postmark, Mailgun, SendGrid, or a small
// forwarding script). Protected by a shared secret sent in the x-webhook-secret header.
const schema = z.object({
  from: z.string().min(3).max(500),
  subject: z.string().max(500).optional().default(""),
  text: z.string().min(1).max(200_000),
  messageId: z.string().max(255).optional(),
  inReplyTo: z.string().max(255).optional(),
  references: z.string().max(4000).optional(),
});

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Drop quoted history so only the customer's new text is stored. */
function stripQuoted(text: string): string {
  const out: string[] = [];
  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    if (/^On .+ wrote:\s*$/i.test(line.trim()) || /^-{2,}\s*Original Message/i.test(line.trim())) break;
    if (line.trim().startsWith(">")) continue;
    out.push(line);
  }
  return out.join("\n").trim();
}

export async function POST(req: NextRequest) {
  const secret = process.env.INBOUND_EMAIL_SECRET;
  if (!secret) return bad("Inbound email isn’t enabled.", 503);
  if (!safeEqual(req.headers.get("x-webhook-secret") ?? "", secret)) return bad("Unauthorized.", 401);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid payload.");
  const d = parsed.data;

  if (d.messageId && (await queryOne(`SELECT id FROM messages WHERE message_id_header = ?`, [d.messageId]))) return NextResponse.json({ ok: true, duplicate: true });

  // Match the thread: subject tag first, then Message-ID headers.
  let enquiryId: number | null = null;
  const tag = /\[#ENQ-(\d+)\]/i.exec(d.subject);
  if (tag) enquiryId = Number(tag[1]);
  if (!enquiryId) {
    for (const ref of [d.inReplyTo, ...(d.references?.split(/\s+/) ?? [])].filter(Boolean) as string[]) {
      const m = await queryOne<{ enquiry_id: number }>(`SELECT enquiry_id FROM messages WHERE message_id_header = ?`, [ref]);
      if (m) { enquiryId = m.enquiry_id; break; }
    }
  }
  if (!enquiryId) return bad("No matching enquiry.", 404);

  const enq = await queryOne<{ name: string; email: string; status: string }>(`SELECT name, email, status FROM enquiries WHERE id = ?`, [enquiryId]);
  if (!enq) return bad("No matching enquiry.", 404);
  const sender = (/<([^>]+)>/.exec(d.from)?.[1] ?? d.from).trim().toLowerCase();
  if (sender !== enq.email.toLowerCase()) return bad("Sender doesn’t match this enquiry.", 422);

  const body = cleanText(stripQuoted(d.text), 10000);
  if (!body) return NextResponse.json({ ok: true, empty: true });

  await exec(`INSERT INTO messages (enquiry_id, sender, body, subject, message_id_header, delivery_status) VALUES (?, 'customer', ?, ?, ?, 'received')`,
    [enquiryId, body, cleanText(d.subject, 255) || null, d.messageId ?? null]);
  if (enq.status !== "cancelled") await exec(`UPDATE enquiries SET status = 'customer_replied' WHERE id = ?`, [enquiryId]);
  await notify({ type: "CUSTOMER_REPLIED", title: `${enq.name} replied`, body: body.slice(0, 140), relatedType: "enquiry", relatedId: enquiryId });
  await logActivity("customer_replied", `${enq.name} replied to their enquiry`);
  return NextResponse.json({ ok: true });
}
