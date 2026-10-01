"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, uploadWithProgress } from "@/lib/client";
import { formatDate } from "@/lib/format";
import { Badge, FilePicker, Progress } from "@/components/ui/Controls";
import Notice, { NoticeState, inputCls, btnCls, btnGhost } from "@/components/ui/Notice";

type Film = { id: number; title: string; slug: string; category: string | null; location: string | null; event_date: string; description: string | null; featured: boolean; published: boolean; video_url: string | null; thumb_url: string | null };
const lbl = "text-xs tracking-widest uppercase text-mute";
const empty = { title: "", category: "", event_date: "", location: "", description: "", featured: false, published: false };

export default function FilmsManager({ initial, categories }: { initial: Film[]; categories: string[] }) {
  const router = useRouter();
  const [films, setFilms] = useState(initial);
  const [editing, setEditing] = useState<Film | null>(null);
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(empty);
  const [video, setVideo] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [n, setN] = useState<NoticeState>(null);

  async function reload() {
    const r = await api("/api/films", "GET");
    const list = (r.data as unknown as { items?: (Omit<Film, "featured" | "published" | "event_date"> & { featured: number; published: number; event_date: string | null })[] }).items;
    if (r.ok && list) setFilms(list.map((f) => ({ ...f, featured: !!f.featured, published: !!f.published, event_date: f.event_date ?? "" })));
    router.refresh();
  }
  function startNew() { setEditing(null); setV(empty); setVideo(null); setThumb(null); setOpen(true); setN(null); }
  function startEdit(f: Film) {
    setEditing(f); setV({ title: f.title, category: f.category ?? "", event_date: f.event_date, location: f.location ?? "", description: f.description ?? "", featured: f.featured, published: f.published });
    setVideo(null); setThumb(null); setOpen(true); setN(null); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setN(null);
    if (!editing) {
      if (!video) return setN({ kind: "error", text: "Please choose a video file." });
      setPct(0);
      const fd = new FormData();
      Object.entries(v).forEach(([k, val]) => fd.append(k, String(val)));
      fd.append("video", video); if (thumb) fd.append("thumbnail", thumb);
      const r = await uploadWithProgress("/api/films", fd, setPct); setPct(null);
      if (!r.ok) return setN({ kind: "error", text: r.data.error || "Upload failed." });
      setN({ kind: "success", text: "Film uploaded." }); setOpen(false);
    } else {
      const r = await api(`/api/films/${editing.id}`, "PATCH", v);
      if (!r.ok) return setN({ kind: "error", text: r.data.error || "Couldn’t save." });
      for (const [kind, file] of [["video", video], ["thumbnail", thumb]] as const) {
        if (!file) continue;
        setPct(0);
        const fd = new FormData(); fd.append("file", file);
        const u = await uploadWithProgress(`/api/films/${editing.id}/${kind}`, fd, setPct); setPct(null);
        if (!u.ok) return setN({ kind: "error", text: u.data.error || `The ${kind} failed to upload.` });
      }
      setN({ kind: "success", text: "Film saved." }); setOpen(false);
    }
    await reload();
  }
  async function remove(f: Film) {
    if (!confirm(`Delete “${f.title}”? The video file will be removed.`)) return;
    const r = await api(`/api/films/${f.id}`, "DELETE");
    if (r.ok) { setN({ kind: "success", text: "Film deleted." }); await reload(); } else setN({ kind: "error", text: r.data.error || "Couldn’t delete." });
  }
  async function togglePub(f: Film) {
    const r = await api(`/api/films/${f.id}`, "PATCH", { title: f.title, category: f.category, description: f.description, location: f.location, event_date: f.event_date, featured: f.featured, published: !f.published });
    if (r.ok) await reload(); else setN({ kind: "error", text: r.data.error || "Couldn’t update." });
  }

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  return (
    <div className="space-y-10">
      {!open && <button onClick={startNew} className={btnCls}>Add film</button>}
      {open && (
        <form onSubmit={submit} className="max-w-2xl space-y-6 border border-line p-6">
          <h2 className="text-[11px] tracking-[0.3em] text-gold uppercase">{editing ? `Edit “${editing.title}”` : "Add film"}</h2>
          <label className="block"><span className={lbl}>Title</span><input required maxLength={150} className={`${inputCls} mt-2`} value={v.title} onChange={set("title")} /></label>
          <div className="grid gap-6 md:grid-cols-3">
            <label className="block"><span className={lbl}>Category</span><input list="film-cats" maxLength={60} className={`${inputCls} mt-2`} value={v.category} onChange={set("category")} /><datalist id="film-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></label>
            <label className="block"><span className={lbl}>Date</span><input type="date" className={`${inputCls} mt-2`} value={v.event_date} onChange={set("event_date")} /></label>
            <label className="block"><span className={lbl}>Location</span><input maxLength={150} className={`${inputCls} mt-2`} value={v.location} onChange={set("location")} /></label>
          </div>
          <label className="block"><span className={lbl}>Description</span><textarea rows={3} maxLength={5000} className={`${inputCls} mt-2`} value={v.description} onChange={set("description")} /></label>
          <div className="space-y-4 border border-line p-4">
            <div className="flex flex-wrap items-center gap-4"><FilePicker label={editing ? "Replace video" : "Choose video"} accept="video/mp4,video/webm,video/quicktime" onFiles={(f) => setVideo(f[0])} /><span className="text-xs text-mute">{video ? `${video.name} (${(video.size / 1048576).toFixed(1)} MB)` : editing ? "Keeping the current video" : "MP4, WebM or MOV, up to 500 MB"}</span></div>
            <div className="flex flex-wrap items-center gap-4"><FilePicker label={thumb ? "Change thumbnail" : editing?.thumb_url ? "Replace thumbnail" : "Choose thumbnail"} onFiles={(f) => setThumb(f[0])} /><span className="text-xs text-mute">{thumb ? thumb.name : "Shown before the film plays"}</span></div>
          </div>
          <div className="flex flex-wrap gap-8">
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={v.published} onChange={(e) => setV({ ...v, published: e.target.checked })} className="h-4 w-4 accent-[#c9a96e]" /> Published</label>
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={v.featured} onChange={(e) => setV({ ...v, featured: e.target.checked })} className="h-4 w-4 accent-[#c9a96e]" /> Feature on the homepage</label>
          </div>
          <Progress pct={pct} label="Video upload progress" />
          <div className="flex gap-3">
            <button disabled={pct !== null} className={btnCls}>{pct !== null ? `Uploading… ${pct}%` : editing ? "Save film" : "Upload film"}</button>
            <button type="button" disabled={pct !== null} onClick={() => setOpen(false)} className={btnGhost}>Cancel</button>
          </div>
        </form>
      )}
      <Notice n={n} />
      {films.length === 0 ? (
        <div className="border border-dashed border-line p-14 text-center"><p className="font-display text-2xl">No films yet</p><p className="mt-2 text-sm text-mute">Upload your first film to show it on the Films page.</p></div>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {films.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-4 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {f.thumb_url ? <img src={f.thumb_url} alt="" loading="lazy" className="h-20 w-32 object-cover" /> : <div className="grid h-20 w-32 place-items-center bg-ink-3 text-xs text-mute">No thumbnail</div>}
              <div className="min-w-48 flex-1">
                <p className="font-display text-xl">{f.title}</p>
                <p className="mt-1 text-xs text-mute">{[f.category, f.location, f.event_date && formatDate(f.event_date)].filter(Boolean).join(" · ")}</p>
                <div className="mt-2 flex gap-2"><Badge on={f.published} onText="Published" offText="Draft" />{f.featured && <Badge on onText="Featured" offText="" />}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => startEdit(f)} className={btnGhost}>Edit</button>
                <button onClick={() => togglePub(f)} className={btnGhost}>{f.published ? "Unpublish" : "Publish"}</button>
                {f.published && <Link href="/films" target="_blank" className={btnGhost}>View ↗</Link>}
                <button onClick={() => remove(f)} className={`${btnGhost} hover:!border-red-400 hover:!text-red-400`}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
