"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { About } from "@/lib/public";
import { api, uploadWithProgress } from "@/lib/client";
import { FilePicker, Progress } from "@/components/ui/Controls";
import Notice, { NoticeState, inputCls, btnCls, btnGhost } from "@/components/ui/Notice";

const lbl = "text-xs tracking-widest uppercase text-mute";

export default function AboutForm({ initial }: { initial: About }) {
  const router = useRouter();
  const [v, setV] = useState({ name: initial.name ?? "", title: initial.title ?? "", heading: initial.heading ?? "", biography: initial.biography ?? "", location: initial.location ?? "", quote: initial.quote ?? "" });
  const [img, setImg] = useState(initial.profile_url);
  const [pct, setPct] = useState<number | null>(null);
  const [n, setN] = useState<NoticeState>(null); const [busy, setBusy] = useState(false);
  const [pn, setPn] = useState<NoticeState>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setN(null);
    const r = await api("/api/about", "PUT", v); setBusy(false);
    if (r.ok) { setN({ kind: "success", text: "Saved. The About page is updated." }); router.refresh(); } else setN({ kind: "error", text: r.data.error || "Couldn’t save." });
  }
  async function upload(f: File) {
    setPn(null); setPct(0);
    const fd = new FormData(); fd.append("file", f);
    const r = await uploadWithProgress("/api/about/image", fd, setPct); setPct(null);
    if (r.ok && r.data.url) { setImg(r.data.url); setPn({ kind: "success", text: "Photo updated." }); router.refresh(); } else setPn({ kind: "error", text: r.data.error || "Upload failed." });
  }
  async function remove() {
    if (!confirm("Remove your About photo?")) return;
    const r = await api("/api/about/image", "DELETE");
    if (r.ok) { setImg(null); setPn({ kind: "success", text: "Photo removed." }); router.refresh(); } else setPn({ kind: "error", text: r.data.error || "Couldn’t remove it." });
  }
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  return (
    <div className="max-w-2xl space-y-12">
      <section className="space-y-4">
        <h2 className="text-[11px] tracking-[0.3em] text-gold uppercase">Profile photo</h2>
        <div className="flex flex-wrap items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img ? <img src={img} alt="Current profile" className="h-40 w-32 object-cover" /> : <div className="grid h-40 w-32 place-items-center bg-ink-3 text-xs text-mute">No photo</div>}
          <div className="flex flex-wrap gap-2"><FilePicker label={img ? "Replace photo" : "Upload photo"} onFiles={(f) => upload(f[0])} />{img && <button onClick={remove} className={btnGhost}>Remove</button>}</div>
        </div>
        <Progress pct={pct} /><Notice n={pn} />
      </section>
      <form onSubmit={save} className="space-y-6">
        <h2 className="text-[11px] tracking-[0.3em] text-gold uppercase">Your story</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block"><span className={lbl}>Your name</span><input className={`${inputCls} mt-2`} maxLength={120} value={v.name} onChange={set("name")} /></label>
          <label className="block"><span className={lbl}>Professional title</span><input className={`${inputCls} mt-2`} maxLength={150} value={v.title} onChange={set("title")} /></label>
        </div>
        <label className="block"><span className={lbl}>Page heading</span><input className={`${inputCls} mt-2`} maxLength={150} value={v.heading} onChange={set("heading")} /></label>
        <label className="block"><span className={lbl}>Biography (leave a blank line between paragraphs)</span><textarea rows={9} className={`${inputCls} mt-2`} maxLength={8000} value={v.biography} onChange={set("biography")} /></label>
        <label className="block"><span className={lbl}>Location</span><input className={`${inputCls} mt-2`} maxLength={150} value={v.location} onChange={set("location")} /></label>
        <label className="block"><span className={lbl}>Quote (optional)</span><input className={`${inputCls} mt-2`} maxLength={400} value={v.quote} onChange={set("quote")} /></label>
        <button disabled={busy} className={btnCls}>{busy ? "Saving…" : "Save changes"}</button><Notice n={n} />
      </form>
    </div>
  );
}
