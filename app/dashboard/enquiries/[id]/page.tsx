import Link from "next/link";
import { notFound } from "next/navigation";
import { exec, query, queryOne } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email";
import { toIso } from "@/lib/format";
import type { EnquiryStatus } from "@/lib/enquiry-status";
import EnquiryDetail from "./EnquiryDetail";
export const dynamic = "force-dynamic";
export const metadata = { title: "Enquiry" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const e = await queryOne<{ id: number; name: string; email: string; phone: string | null; event_type: string | null; event_date: string | null; location: string | null; budget: string | null; status: EnquiryStatus; created_at: string }>(
    `SELECT id, name, email, phone, event_type, event_date, location, budget, status, created_at FROM enquiries WHERE id = ?`, [id]);
  if (!e) notFound();

  // Opening it counts as reading it: New -> Viewed, and its notifications are marked read.
  if (e.status === "new") { await exec(`UPDATE enquiries SET status = 'viewed' WHERE id = ? AND status = 'new'`, [id]); e.status = "viewed"; }
  await exec(`UPDATE notifications SET is_read = TRUE WHERE related_type = 'enquiry' AND related_id = ? AND is_read = FALSE`, [id]);

  const messages = await query<{ id: number; sender: "photographer" | "customer"; body: string; created_at: string; delivery_status: string }>(
    `SELECT id, sender, body, created_at, delivery_status FROM messages WHERE enquiry_id = ? ORDER BY id`, [id]);
  return (
    <>
      <Link href="/dashboard/enquiries" className="text-xs tracking-[0.2em] uppercase text-mute hover:text-gold">← All enquiries</Link>
      <h1 className="mt-4 mb-10 font-display text-4xl font-light">{e.name}</h1>
      <EnquiryDetail emailReady={isEmailConfigured()} enquiry={{ ...e, created_at: toIso(e.created_at) }} messages={messages.map((m) => ({ ...m, created_at: toIso(m.created_at) }))} />
    </>
  );
}
