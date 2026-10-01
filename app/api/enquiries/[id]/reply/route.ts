import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exec, query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { bad, unauthorized } from "@/lib/api";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { getSiteSettings } from "@/lib/settings";
import { logActivity, notify } from "@/lib/activity";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const id = Number((await params).id);
  const parsed = z.object({ body: z.string().trim().min(1, "Write a reply first.").max(10000) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);

  const enq = await queryOne<{ name: string; email: string }>(`SELECT name, email FROM enquiries WHERE id = ?`, [id]);
  if (!enq) return bad("Enquiry not found.", 404);

  if (!isEmailConfigured()) {
    return bad("Email isn’t set up on this website yet, so the reply wasn’t sent. Ask your developer to add the email settings (EMAIL_HOST and EMAIL_FROM).", 503);
  }

  const site = await getSiteSettings();
  const thread = await query<{ message_id_header: string | null }>(`SELECT message_id_header FROM messages WHERE enquiry_id = ? AND message_id_header IS NOT NULL ORDER BY id`, [id]);
  const ids = thread.map((t) => t.message_id_header!).filter(Boolean);
  const subject = `Re: Your enquiry to ${site.site_name} [#ENQ-${id}]`;

  let messageId: string;
  try {
    ({ messageId } = await sendEmail({
      to: enq.email, subject, text: parsed.data.body, fromName: site.site_name,
      replyTo: process.env.EMAIL_REPLY_TO || undefined,
      inReplyTo: ids.at(-1), references: ids.length ? ids.join(" ") : undefined,
    }));
  } catch (e) {
    console.error("Reply email failed", e);
    return bad("The email couldn’t be sent, so nothing was recorded. Please check the email settings and try again.", 502);
  }

  await exec(`INSERT INTO messages (enquiry_id, sender, body, subject, message_id_header, delivery_status) VALUES (?, 'photographer', ?, ?, ?, 'sent')`,
    [id, parsed.data.body, subject, messageId]);
  await exec(`UPDATE enquiries SET status = 'replied' WHERE id = ?`, [id]);
  await notify({ type: "REPLY_SENT", title: `Reply sent to ${enq.name}`, relatedType: "enquiry", relatedId: id });
  await logActivity("reply_sent", `Replied to ${enq.name}’s enquiry`);
  return NextResponse.json({ ok: true });
}
