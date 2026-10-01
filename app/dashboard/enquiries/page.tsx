import Link from "next/link";
import { query } from "@/lib/db";
import { STATUSES, STATUS_LABEL, STATUS_TONE, type EnquiryStatus } from "@/lib/enquiry-status";
import { formatDate, toIso } from "@/lib/format";
import LocalTime from "@/components/ui/LocalTime";
export const dynamic = "force-dynamic";
export const metadata = { title: "Enquiries" };

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const active = (STATUSES as readonly string[]).includes(status ?? "") ? (status as EnquiryStatus) : null;
  const [counts, rows] = await Promise.all([
    query<{ status: EnquiryStatus; n: number }>(`SELECT status, COUNT(*) AS n FROM enquiries GROUP BY status`),
    query<{ id: number; name: string; email: string; event_type: string | null; event_date: string | null; location: string | null; status: EnquiryStatus; created_at: string }>(
      `SELECT id, name, email, event_type, event_date, location, status, created_at FROM enquiries ${active ? "WHERE status = ?" : ""} ORDER BY created_at DESC, id DESC LIMIT 200`, active ? [active] : []),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const total = counts.reduce((a, c) => a + c.n, 0);
  const tab = (href: string, label: string, n: number, on: boolean) => (
    <Link key={label} href={href} aria-current={on ? "page" : undefined}
      className={`whitespace-nowrap border px-4 py-2 text-[11px] tracking-[0.18em] uppercase transition-colors ${on ? "border-gold text-gold" : "border-line text-mute hover:text-paper"}`}>{label} <span className="opacity-70">{n}</span></Link>
  );
  return (
    <>
      <h1 className="font-display text-4xl font-light mb-2">Enquiries</h1>
      <p className="text-sm text-mute mb-8">Messages from your website’s contact form.</p>
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2" role="navigation" aria-label="Filter by status">
        {tab("/dashboard/enquiries", "All", total, !active)}
        {STATUSES.map((s) => tab(`/dashboard/enquiries?status=${s}`, STATUS_LABEL[s], count(s), active === s))}
      </div>
      {rows.length === 0 ? (
        <div className="border border-dashed border-line p-14 text-center"><p className="font-display text-2xl">{active ? "Nothing here" : "No enquiries yet"}</p><p className="mt-2 text-sm text-mute">{active ? "No enquiries have this status." : "When someone fills in the contact form, it will appear here and you’ll get a notification."}</p></div>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/dashboard/enquiries/${r.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 hover:bg-ink-2 px-2 -mx-2">
                <span className={`inline-block w-36 shrink-0 border px-2 py-1 text-center text-[10px] tracking-[0.15em] uppercase ${STATUS_TONE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                <span className="min-w-40 flex-1">
                  <span className={`block ${r.status === "new" ? "font-medium" : ""}`}>{r.name}</span>
                  <span className="block text-xs text-mute">{[r.event_type, r.event_date && formatDate(r.event_date), r.location].filter(Boolean).join(" · ") || r.email}</span>
                </span>
                <span className="text-xs text-mute"><LocalTime iso={toIso(r.created_at)} relative /></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
