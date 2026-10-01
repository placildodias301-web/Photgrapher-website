"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import Notice, { NoticeState, inputCls, btnCls, btnGhost } from "@/components/ui/Notice";

type Social = { id: number; platform_name: string; url: string; username: string | null; icon: string | null; enabled: boolean };
const lbl = "text-xs tracking-widest uppercase text-mute";
const SUGGESTIONS = ["Instagram", "YouTube", "Facebook", "Behance", "Pinterest", "Threads", "LinkedIn", "500px", "Flickr", "TikTok", "X"];

export default function SocialManager({ contact, initial }: { contact: { phone: string; whatsapp: string; public_email: string; location: string; maps_url: string }; initial: Social[] }) {
  const router = useRouter();
  const [c, setC] = useState(contact); const [cn, setCn] = useState<NoticeState>(null); const [cb, setCb] = useState(false);
  const [items, setItems] = useState(initial); const [n, setN] = useState<NoticeState>(null);
  const [add, setAdd] = useState({ platform_name: "", url: "", username: "" });

  async function saveContact(e: React.FormEvent) {
    e.preventDefault(); setCb(true); setCn(null);
    const r = await api("/api/contact-settings", "PUT", c); setCb(false);
    if (r.ok) { setCn({ kind: "success", text: "Contact details saved." }); router.refresh(); } else setCn({ kind: "error", text: r.data.error || "Couldn’t save." });
  }
  async function reload() {
    const r = await api("/api/socials", "GET");
    const list = (r.data as unknown as { items?: (Omit<Social, "enabled"> & { enabled: number })[] }).items;
    if (r.ok && list) setItems(list.map((i) => ({ ...i, enabled: !!i.enabled })));
    router.refresh();
  }
  async function patch(s: Social, body: Partial<Social>, msg?: string) {
    const r = await api(`/api/socials/${s.id}`, "PATCH", body);
    if (r.ok) { if (msg) setN({ kind: "success", text: msg }); await reload(); } else { setN({ kind: "error", text: r.data.error || "Couldn’t save." }); await reload(); }
  }
  async function move(i: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items]; const [it] = next.splice(i, 1); next.splice(to, 0, it); setItems(next);
    const r = await api("/api/socials/order", "PUT", { ids: next.map((x) => x.id) });
    if (!r.ok) { setN({ kind: "error", text: "Couldn’t save the order." }); await reload(); } else router.refresh();
  }
  async function del(s: Social) { if (!confirm(`Remove ${s.platform_name}?`)) return; const r = await api(`/api/socials/${s.id}`, "DELETE"); if (r.ok) { setN({ kind: "success", text: "Removed." }); await reload(); } else setN({ kind: "error", text: r.data.error || "Couldn’t remove." }); }
  async function create(e: React.FormEvent) {
    e.preventDefault(); const r = await api("/api/socials", "POST", { ...add, icon: add.platform_name.toLowerCase() });
    if (r.ok) { setAdd({ platform_name: "", url: "", username: "" }); setN({ kind: "success", text: "Platform added." }); await reload(); } else setN({ kind: "error", text: r.data.error || "Couldn’t add it." });
  }
  const setc = (k: keyof typeof c) => (e: React.ChangeEvent<HTMLInputElement>) => setC({ ...c, [k]: e.target.value });

  return (
    <div className="space-y-14">
      <form onSubmit={saveContact} className="max-w-2xl space-y-6">
        <h2 className="text-[11px] tracking-[0.3em] text-gold uppercase">Contact details</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block"><span className={lbl}>Phone</span><input className={`${inputCls} mt-2`} inputMode="tel" maxLength={40} value={c.phone} onChange={setc("phone")} /></label>
          <label className="block"><span className={lbl}>WhatsApp</span><input className={`${inputCls} mt-2`} inputMode="tel" maxLength={40} value={c.whatsapp} onChange={setc("whatsapp")} /></label>
        </div>
        <label className="block"><span className={lbl}>Public email (shown on the website)</span><input type="email" className={`${inputCls} mt-2`} placeholder="Not set yet" maxLength={255} value={c.public_email} onChange={setc("public_email")} /></label>
        <label className="block"><span className={lbl}>Location</span><input className={`${inputCls} mt-2`} maxLength={255} value={c.location} onChange={setc("location")} /></label>
        <label className="block"><span className={lbl}>Google Maps link (optional)</span><input className={`${inputCls} mt-2`} placeholder="https://maps.google.com/…" maxLength={500} value={c.maps_url} onChange={setc("maps_url")} /></label>
        <button disabled={cb} className={btnCls}>{cb ? "Saving…" : "Save contact details"}</button><Notice n={cn} />
      </form>

      <section className="space-y-6">
        <h2 className="text-[11px] tracking-[0.3em] text-gold uppercase">Social platforms</h2>
        <Notice n={n} />
        <ol className="space-y-2">
          {items.map((s, i) => (
            <li key={`${s.id}-${s.platform_name}-${s.url}-${s.username}`} className={`flex flex-wrap items-center gap-3 border border-line p-3 ${s.enabled ? "" : "opacity-60"}`}>
              <input aria-label="Platform" defaultValue={s.platform_name} maxLength={60} onBlur={(e) => e.target.value.trim() !== s.platform_name && patch(s, { platform_name: e.target.value.trim(), icon: e.target.value.trim().toLowerCase() }, "Saved.")} className={`${inputCls} max-w-[9rem]`} />
              <input aria-label="Link" defaultValue={s.url} maxLength={500} onBlur={(e) => e.target.value.trim() !== s.url && patch(s, { url: e.target.value.trim() }, "Saved.")} className={`${inputCls} max-w-xs`} />
              <input aria-label="Username" defaultValue={s.username ?? ""} placeholder="@handle" maxLength={120} onBlur={(e) => e.target.value.trim() !== (s.username ?? "") && patch(s, { username: e.target.value.trim() }, "Saved.")} className={`${inputCls} max-w-[10rem]`} />
              <div className="ml-auto flex flex-wrap gap-2">
                <button onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up" className={btnGhost}>↑</button>
                <button onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Move down" className={btnGhost}>↓</button>
                <button onClick={() => patch(s, { enabled: !s.enabled })} className={btnGhost}>{s.enabled ? "Disable" : "Enable"}</button>
                <button onClick={() => del(s)} className={`${btnGhost} hover:!border-red-400 hover:!text-red-400`}>Remove</button>
              </div>
            </li>
          ))}
        </ol>
        <form onSubmit={create} className="space-y-3 border-t border-line pt-6">
          <h3 className="text-sm">Add social platform</h3>
          <div className="flex flex-wrap gap-3">
            <input aria-label="Platform name" list="social-suggestions" required maxLength={60} placeholder="Platform, e.g. YouTube" value={add.platform_name} onChange={(e) => setAdd({ ...add, platform_name: e.target.value })} className={`${inputCls} max-w-[12rem]`} />
            <datalist id="social-suggestions">{SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
            <input aria-label="Link" required placeholder="https://…" value={add.url} onChange={(e) => setAdd({ ...add, url: e.target.value })} className={`${inputCls} max-w-xs`} />
            <input aria-label="Username" placeholder="@handle (optional)" maxLength={120} value={add.username} onChange={(e) => setAdd({ ...add, username: e.target.value })} className={`${inputCls} max-w-[12rem]`} />
            <button className={btnCls}>+ Add social platform</button>
          </div>
          <p className="text-xs text-mute">Any platform works — type its name and paste the link.</p>
        </form>
      </section>
    </div>
  );
}
