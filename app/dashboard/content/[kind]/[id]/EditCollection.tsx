"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, uploadWithProgress } from "@/lib/client";
import { FilePicker, Progress } from "@/components/ui/Controls";
import Notice, { NoticeState, inputCls, btnCls, btnGhost } from "@/components/ui/Notice";

type Img = { id: number; media_id: number; url: string; alt_text: string | null };
type Item = { id: number; title: string; slug: string; category_id: number | null; description: string | null; location: string | null; event_date: string; featured: boolean; published: boolean; cover_media_id: number | null; cover_url: string | null; images: Img[] };
const lbl = "text-xs tracking-widest uppercase text-mute";

export default function EditCollection({ kind, label, publicBase, hasCategory, categories, item }: {
  kind: string; label: string; publicBase: string; hasCategory: boolean; categories: { id: number; name: string }[]; item: Item;
}) {
  const router = useRouter();
  const base = `/api/collections/${kind}/${item.id}`;
  const [v, setV] = useState({ title: item.title, category_id: item.category_id ? String(item.category_id) : "", event_date: item.event_date, location: item.location ?? "", description: item.description ?? "", featured: item.featured, published: item.published });
  const [images, setImages] = useState(item.images);
  const [coverUrl, setCoverUrl] = useState(item.cover_url);
  const [coverMedia, setCoverMedia] = useState(item.cover_media_id);
  const [dn, setDn] = useState<NoticeState>(null); const [saving, setSaving] = useState(false);
  const [gn, setGn] = useState<NoticeState>(null); const [pct, setPct] = useState<number | null>(null);

  async function reloadImages() {
    const r = await api(base, "GET");
    const d = r.data as unknown as Item;
    if (r.ok && d.images) { setImages(d.images); setCoverUrl(d.cover_url); setCoverMedia(d.cover_media_id); }
    router.refresh();
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setDn(null);
    const r = await api(base, "PATCH", { title: v.title, category_id: v.category_id ? Number(v.category_id) : null, event_date: v.event_date, location: v.location, description: v.description, featured: v.featured, published: v.published });
    setSaving(false);
    if (r.ok) { setDn({ kind: "success", text: v.published ? "Saved. This is live on your website." : "Saved as a draft. It isn’t visible on your website." }); router.refresh(); } else setDn({ kind: "error", text: r.data.error || "Couldn’t save." });
  }

  async function uploadPhotos(files: File[]) {
    setGn(null); setPct(0);
    const fd = new FormData(); files.forEach((f) => fd.append("files", f));
    const r = await uploadWithProgress(`${base}/images`, fd, setPct); setPct(null);
    const failed = r.data.failed ?? [];
    if (r.ok) setGn({ kind: failed.length ? "error" : "success", text: `${r.data.added} photo(s) added.${failed.length ? " Skipped: " + failed.join(" ") : ""}` });
    else setGn({ kind: "error", text: failed.join(" ") || r.data.error || "Upload failed." });
    await reloadImages();
  }
  async function uploadCover(f: File) {
    setGn(null); setPct(0);
    const fd = new FormData(); fd.append("file", f);
    const r = await uploadWithProgress(`${base}/cover`, fd, setPct); setPct(null);
    setGn(r.ok ? { kind: "success", text: "Cover updated." } : { kind: "error", text: r.data.error || "Upload failed." });
    await reloadImages();
  }
  async function replace(img: Img, f: File) {
    setGn(null); setPct(0);
    const fd = new FormData(); fd.append("file", f);
    const r = await uploadWithProgress(`${base}/images/${img.id}/replace`, fd, setPct); setPct(null);
    setGn(r.ok ? { kind: "success", text: "Photo replaced." } : { kind: "error", text: r.data.error || "Upload failed." });
    await reloadImages();
  }
  async function del(img: Img) {
    if (!confirm("Delete this photo? It will be removed from the website.")) return;
    const r = await api(`${base}/images/${img.id}`, "DELETE");
    if (r.ok) { setGn({ kind: "success", text: "Photo deleted." }); await reloadImages(); } else setGn({ kind: "error", text: r.data.error || "Couldn’t delete." });
  }
  async function move(i: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images]; const [it] = next.splice(i, 1); next.splice(to, 0, it); setImages(next);
    const r = await api(`${base}/images`, "PUT", { ids: next.map((x) => x.id) });
    if (!r.ok) { setGn({ kind: "error", text: "Couldn’t save the order." }); await reloadImages(); } else router.refresh();
  }
  async function makeCover(img: Img) {
    const r = await api(`${base}/cover`, "PUT", { imageId: img.id });
    if (r.ok) { setGn({ kind: "success", text: "Cover updated." }); await reloadImages(); } else setGn({ kind: "error", text: r.data.error || "Couldn’t set the cover." });
  }
  async function saveAlt(img: Img, text: string) {
    if (text === (img.alt_text ?? "")) return;
    const r = await api(`${base}/images/${img.id}`, "PATCH", { alt_text: text });
    if (r.ok) setImages((x) => x.map((y) => y.id === img.id ? { ...y, alt_text: text } : y)); else setGn({ kind: "error", text: "Couldn’t save the caption." });
  }
  async function deleteAll() {
    if (!confirm(`Delete this ${label.toLowerCase()} and all its photos? This can’t be undone.`)) return;
    const r = await api(base, "DELETE");
    if (r.ok) router.push(`/dashboard/content/${kind}`); else setDn({ kind: "error", text: r.data.error || "Couldn’t delete." });
  }

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });
  return (
    <div className="space-y-14">
      <form onSubmit={save} className="max-w-2xl space-y-6">
        <h2 className="text-[11px] tracking-[0.3em] text-gold uppercase">Details</h2>
        <label className="block"><span className={lbl}>{kind === "shoots" ? "Project name" : "Title"}</span><input required maxLength={150} className={`${inputCls} mt-2`} value={v.title} onChange={set("title")} /></label>
        <div className="grid gap-6 md:grid-cols-2">
          {hasCategory && (
            <label className="block"><span className={lbl}>Category</span>
              <select className={`${inputCls} mt-2`} value={v.category_id} onChange={set("category_id")}>
                <option value="">No category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></label>
          )}
          <label className="block"><span className={lbl}>Event date</span><input type="date" className={`${inputCls} mt-2`} value={v.event_date} onChange={set("event_date")} /></label>
          <label className="block"><span className={lbl}>Location</span><input maxLength={150} className={`${inputCls} mt-2`} value={v.location} onChange={set("location")} /></label>
        </div>
        <label className="block"><span className={lbl}>Description</span><textarea rows={4} maxLength={5000} className={`${inputCls} mt-2`} value={v.description} onChange={set("description")} /></label>
        <div className="flex flex-wrap gap-8">
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={v.published} onChange={(e) => setV({ ...v, published: e.target.checked })} className="h-4 w-4 accent-[#c9a96e]" /> Published on the website</label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={v.featured} onChange={(e) => setV({ ...v, featured: e.target.checked })} className="h-4 w-4 accent-[#c9a96e]" /> Featured on the homepage</label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={saving} className={btnCls}>{saving ? "Saving…" : "Save changes"}</button>
          {item.published && <Link href={`${publicBase}/${item.slug}`} target="_blank" className={btnGhost}>View on website ↗</Link>}
          <button type="button" onClick={deleteAll} className={`${btnGhost} ml-auto hover:!border-red-400 hover:!text-red-400`}>Delete {label.toLowerCase()}</button>
        </div>
        <Notice n={dn} />
      </form>

      <section aria-labelledby="cover-h" className="space-y-4">
        <h2 id="cover-h" className="text-[11px] tracking-[0.3em] text-gold uppercase">Cover image</h2>
        <div className="flex flex-wrap items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {coverUrl ? <img src={coverUrl} alt="Current cover" className="h-28 w-44 object-cover" /> : <div className="grid h-28 w-44 place-items-center bg-ink-3 text-xs text-mute">No cover</div>}
          <FilePicker label={coverUrl ? "Replace cover" : "Upload cover"} onFiles={(f) => uploadCover(f[0])} />
        </div>
      </section>

      <section aria-labelledby="gal-h" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="gal-h" className="text-[11px] tracking-[0.3em] text-gold uppercase">Gallery ({images.length})</h2>
          <FilePicker primary label="Upload photos" multiple onFiles={uploadPhotos} />
        </div>
        <Progress pct={pct} />
        <Notice n={gn} />
        {images.length === 0 ? (
          <div className="border border-dashed border-line p-12 text-center"><p className="font-display text-2xl">No photos yet</p><p className="mt-2 text-sm text-mute">Upload as many as you like — they appear on your website once this is published.</p></div>
        ) : (
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img, i) => (
              <li key={img.id} className="border border-line p-3">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt_text ?? ""} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  <span className="absolute left-2 top-2 bg-ink/80 px-2 py-1 text-[10px] tracking-widest">{i + 1}</span>
                  {img.media_id === coverMedia && <span className="absolute right-2 top-2 bg-gold px-2 py-1 text-[10px] tracking-widest uppercase text-ink">Cover</span>}
                </div>
                <input aria-label="Caption" defaultValue={img.alt_text ?? ""} onBlur={(e) => saveAlt(img, e.target.value)} placeholder="Caption / description" maxLength={255} className={`${inputCls} mt-3`} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier" className={btnGhost}>←</button>
                  <button onClick={() => move(i, i + 1)} disabled={i === images.length - 1} aria-label="Move later" className={btnGhost}>→</button>
                  {img.media_id !== coverMedia && <button onClick={() => makeCover(img)} className={btnGhost}>Set as cover</button>}
                  <FilePicker label="Replace" onFiles={(f) => replace(img, f[0])} />
                  <button onClick={() => del(img)} className={`${btnGhost} hover:!border-red-400 hover:!text-red-400`}>Delete</button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
