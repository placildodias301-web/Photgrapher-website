import nodemailer from "nodemailer";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.EMAIL_HOST && process.env.EMAIL_FROM);
}

export type OutgoingEmail = {
  to: string; subject: string; text: string; fromName?: string;
  replyTo?: string; inReplyTo?: string; references?: string;
};

/** Sends via SMTP using the EMAIL_* variables. Throws if not configured or if delivery fails. */
export async function sendEmail(m: OutgoingEmail): Promise<{ messageId: string }> {
  if (!isEmailConfigured()) throw new Error("EMAIL_NOT_CONFIGURED");
  const port = Number(process.env.EMAIL_PORT) || 587;
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: process.env.EMAIL_USER ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD } : undefined,
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
  });
  const from = m.fromName ? { name: m.fromName, address: process.env.EMAIL_FROM! } : process.env.EMAIL_FROM!;
  const info = await transport.sendMail({
    from, to: m.to, subject: m.subject, text: m.text,
    replyTo: m.replyTo, inReplyTo: m.inReplyTo, references: m.references,
  });
  return { messageId: info.messageId };
}
