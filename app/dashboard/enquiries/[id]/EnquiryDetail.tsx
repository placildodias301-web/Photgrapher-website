"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { formatDate } from "@/lib/format";
import { STATUSES, STATUS_LABEL, STATUS_TONE, type EnquiryStatus } from "@/lib/enquiry-status";
import LocalTime from "@/components/ui/LocalTime";
import Notice, { NoticeState, inputCls, btnCls, btnGhost } from "@/components/ui/Notice";

type Enq = { id: number; name: string; email: string; phone: string | null; event_type: string | null; event_date: string | null; location: string | null; budget: string | null; status: EnquiryStatus; created_at: string };
type Msg = { id: number; sender: "photographer" | "customer"; body: string; created_at: string; delivery_status: string };

export default function EnquiryDetail({ enquiry, messages, emailReady }: { enquiry: Enq; messages: Msg[]; emailReady: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState(enquiry.status);
  const [reply, setReply] = useState(""); const [busy, setBusy] = useState(false);
  const [n, setN] = useState<NoticeState>(null);
  const lastSent = [...messages].reverse().find((m) => m.sender === "photographer");
  const wa = enquiry.phone?.replace(/\D/g, "");

  async function changeStatus(s: EnquiryStatus) {
    const prev = status; setStatus(s);
    const r = await api(`/api/enquiries/${enquiry.id}`, "PATCH", { status: s });
    if (!r.ok) { setStatus(prev); setN({ kind: "error", text: r.data.error || "Couldn’t update the status." }); } else router.refresh();
  }
  async function send(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setN(null);
    const r = await api(`/api/enquiries/${enquiry.id}/reply`, "POST", { body: reply }); setBusy(false);
    if (r.ok) { setReply(""); setStatus("replied"); setN({ kind: "success", text: `Reply sent to ${enquiry.email}.` }); router.refresh(); }
    else setN({ kind: "error", text: r.data.error || "The reply couldn’t be sent." });
  }
  async function del() {
    if (!confirm(`Delete ${enquiry.name}’s enquiry and its conversation? This can’t be undone.`)) return;
    const r = await api(`/api/enquiries/${enquiry.id}`, "DELETE");
    if (r.ok) router.push("/dashboard/enquiries"); else setN({ kind: "error", text: r.data.error || "Couldn’t delete." });
  }
  const row = (k: string, v: React.ReactNode) => v ? (<div><dt className="text-[10px] tracking-[0.25em] text-mute uppercase">{k}</dt><dd className="mt-1 text-sm">{v}</dd></div>) : null;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-10">
        <section aria-labelledby="conv-h">
          <h2 id="conv-h" className="mb-5 text-[11px] tracking-[0.3em] text-gold uppercase">Conversation</h2>
          <ol className="space-y-4">
            {messages.map((m) => (
              <li key={m.id} className={`max-w-[92%] border p-4 ${m.sender === "photographer" ? "ml-auto border-gold/40 bg-ink-2" : "border-line"}`}>
                <p className="mb-2 flex flex-wrap items-center justify-between gap-3 text-xs text-mute">
                  <span className="tracking-[0.15em] uppercase">{m.sender === "photographer" ? "You" : enquiry.name}</span>
                  <LocalTime iso={m.created_at} />
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
              </li>
            ))}
          </ol>
          {status === "replied" && lastSent && <p className="mt-4 text-sm text-emerald-300">✅ Replied · <LocalTime iso={lastSent.created_at} /></p>}
        </section>

        <form onSubmit={send} className="space-y-4" aria-labelledby="reply-h">
          <h2 id="reply-h" className="text-[11px] tracking-[0.3em] text-gold uppercase">Reply to {enquiry.name}</h2>
          {!emailReady && <Notice n={{ kind: "error", text: "Email isn’t set up on this website yet, so replies can’t be sent. Ask your developer to add the email settings." }} />}
          <p className="text-xs text-mute">Sent by email to {enquiry.email}.</p>
          <textarea aria-label="Your reply" rows={7} required maxLength={10000} value={reply} onChange={(e) => setReply(e.target.value)} className={inputCls} placeholder="Write your reply…" disabled={!emailReady} />
          <div className="flex items-center gap-4"><button disabled={busy || !emailReady || !reply.trim()} className={btnCls}>{busy ? "Sending…" : "Send reply"}</button></div>
          <Notice n={n} />
        </form>
      </div>

      <aside className="space-y-8 lg:sticky lg:top-8 lg:self-start">
        <div>
          <label htmlFor="status" className="text-[10px] tracking-[0.25em] text-mute uppercase">Status</label>
          <select id="status" value={status} onChange={(e) => changeStatus(e.target.value as EnquiryStatus)} className={`${inputCls} mt-2`}>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <span className={`mt-3 inline-block border px-2 py-1 text-[10px] tracking-[0.15em] uppercase ${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>
        </div>
        <dl className="space-y-5">
          {row("Received", <LocalTime iso={enquiry.created_at} />)}
          {row("Email", <a className="underline hover:text-gold" href={`mailto:${enquiry.email}`}>{enquiry.email}</a>)}
          {row("Phone", enquiry.phone && <span className="flex flex-wrap gap-3"><a className="underline hover:text-gold" href={`tel:${enquiry.phone.replace(/\s/g, "")}`}>{enquiry.phone}</a>{wa && <a className="underline hover:text-gold" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${wa}`}>WhatsApp</a>}</span>)}
          {row("Event", enquiry.event_type)}
          {row("Event date", formatDate(enquiry.event_date))}
          {row("Location", enquiry.location)}
          {row("Budget", enquiry.budget)}
        </dl>
        <button onClick={del} className={`${btnGhost} hover:!border-red-400 hover:!text-red-400`}>Delete enquiry</button>
      </aside>
    </div>
  );
}
