"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import Notice, { NoticeState } from "@/components/ui/Notice";

const field = "w-full bg-transparent border-b border-line focus:border-gold py-3 outline-none transition-colors placeholder:text-mute/60";
const empty = { name: "", email: "", phone: "", event_type: "", event_date: "", location: "", message: "", website: "" };

export default function ContactForm() {
  const [v, setV] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [n, setN] = useState<NoticeState>(null);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setN(null);
    const r = await api("/api/enquiries", "POST", v); setBusy(false);
    if (r.ok) { setDone(true); setV(empty); } else setN({ kind: "error", text: r.data.error || "Something went wrong. Please try again." });
  }

  if (done) return (
    <div className="border border-gold/40 bg-ink-2 p-8">
      <p className="font-display text-2xl mb-2">Thank you</p>
      <p className="text-paper/75">Your message has been sent. I&apos;ll get back to you soon.</p>
      <button onClick={() => setDone(false)} className="mt-6 text-[11px] tracking-[0.25em] uppercase text-gold hover:text-paper">Send another message →</button>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {/* Honeypot: hidden from people, tempting to bots */}
      <div aria-hidden className="absolute left-[-9999px]" tabIndex={-1}>
        <label>Leave this field empty<input tabIndex={-1} autoComplete="off" value={v.website} onChange={set("website")} /></label>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Name *</span><input required maxLength={150} autoComplete="name" className={`${field} mt-2`} value={v.name} onChange={set("name")} /></label>
        <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Email *</span><input type="email" required maxLength={255} autoComplete="email" className={`${field} mt-2`} value={v.email} onChange={set("email")} /></label>
        <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Phone</span><input maxLength={40} autoComplete="tel" className={`${field} mt-2`} value={v.phone} onChange={set("phone")} /></label>
        <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Event type</span><input maxLength={80} placeholder="Wedding, portrait…" className={`${field} mt-2`} value={v.event_type} onChange={set("event_type")} /></label>
        <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Event date</span><input type="date" className={`${field} mt-2`} value={v.event_date} onChange={set("event_date")} /></label>
        <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Location</span><input maxLength={150} className={`${field} mt-2`} value={v.location} onChange={set("location")} /></label>
      </div>
      <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Message *</span><textarea required rows={5} maxLength={5000} className={`${field} mt-2`} value={v.message} onChange={set("message")} /></label>
      <button disabled={busy} className="bg-paper px-8 py-4 text-[11px] tracking-[0.28em] uppercase text-ink transition-colors hover:bg-gold disabled:opacity-50">{busy ? "Sending…" : "Send message"}</button>
      <Notice n={n} />
    </form>
  );
}
