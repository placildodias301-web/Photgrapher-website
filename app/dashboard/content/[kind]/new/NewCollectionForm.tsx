"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadWithProgress } from "@/lib/client";
import { FilePicker, Progress } from "@/components/ui/Controls";
import Notice, { NoticeState, inputCls, btnCls } from "@/components/ui/Notice";

const lbl = "text-xs tracking-widest uppercase text-mute";

export default function NewCollectionForm({ kind, label, hasCategory, categories }: { kind: string; label: string; hasCategory: boolean; categories: { id: number; name: string }[] }) {
  const router = useRouter();
  const [v, setV] = useState({ title: "", category_id: "", event_date: "", location: "", description: "", featured: false, published: false });
  const [cover, setCover] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);
  const [pct, setPct] = useState<number | null>(null);
  const [n, setN] = useState<NoticeState>(null);
  const [created, setCreated] = useState<{ id: number; problems: string[] } | null>(null);
  const coverPreview = useMemo(() => (cover ? URL.createObjectURL(cover) : null), [cover]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setN(null); setPct(0);
    const fd = new FormData();
    Object.entries(v).forEach(([k, val]) => fd.append(k, String(val)));
    if (cover) fd.append("cover", cover);
    gallery.forEach((f) => fd.append("gallery", f));
    const r = await uploadWithProgress(`/api/collections/${kind}`, fd, setPct);
    setPct(null);
    const d = r.data as { id?: number; problems?: string[]; error?: string };
    if (!r.ok || !d.id) return setN({ kind: "error", text: d.error || "Couldn’t create it. Please try again." });
    if (d.problems?.length) { setCreated({ id: d.id, problems: d.problems }); return; }
    router.push(`/dashboard/content/${kind}/${d.id}`);
  }

  if (created) {
    return (
      <div className="space-y-4 max-w-xl">
        <Notice n={{ kind: "success", text: `${label} created.` }} />
        <Notice n={{ kind: "error", text: `Some files didn’t upload: ${created.problems.join(" ")}` }} />
        <button onClick={() => router.push(`/dashboard/content/${kind}/${created.id}`)} className={btnCls}>Continue</button>
      </div>
    );
  }

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });
  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <label className="block"><span className={lbl}>{kind === "shoots" ? "Project name" : "Title"}</span>
        <input required maxLength={150} className={`${inputCls} mt-2`} placeholder={kind === "shoots" ? "Rahul & Priya Wedding" : "A week in Old Goa"} value={v.title} onChange={set("title")} /></label>
      <div className="grid gap-6 md:grid-cols-2">
        {hasCategory && (
          <label className="block"><span className={lbl}>Category</span>
            <select className={`${inputCls} mt-2`} value={v.category_id} onChange={set("category_id")}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
        )}
        <label className="block"><span className={lbl}>Event date</span><input type="date" className={`${inputCls} mt-2`} value={v.event_date} onChange={set("event_date")} /></label>
        <label className="block"><span className={lbl}>Location</span><input maxLength={150} className={`${inputCls} mt-2`} placeholder="Goa, India" value={v.location} onChange={set("location")} /></label>
      </div>
      <label className="block"><span className={lbl}>Description</span><textarea rows={4} maxLength={5000} className={`${inputCls} mt-2`} value={v.description} onChange={set("description")} /></label>

      <fieldset className="space-y-3 border border-line p-5">
        <legend className={`${lbl} px-2`}>Cover image</legend>
        <div className="flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {coverPreview ? <img src={coverPreview} alt="Cover preview" className="h-24 w-36 object-cover" /> : <div className="grid h-24 w-36 place-items-center bg-ink-3 text-xs text-mute">No cover yet</div>}
          <FilePicker label={cover ? "Change cover" : "Choose cover"} onFiles={(f) => setCover(f[0])} />
          {cover && <span className="text-xs text-mute">{cover.name}</span>}
        </div>
      </fieldset>
      <fieldset className="space-y-3 border border-line p-5">
        <legend className={`${lbl} px-2`}>Gallery photos</legend>
        <div className="flex flex-wrap items-center gap-4">
          <FilePicker label="Choose photos" multiple onFiles={(f) => setGallery((g) => [...g, ...f])} />
          <span className="text-sm text-mute">{gallery.length ? `${gallery.length} photo${gallery.length === 1 ? "" : "s"} selected` : "You can select many at once"}</span>
          {gallery.length > 0 && <button type="button" onClick={() => setGallery([])} className="text-xs underline text-mute hover:text-gold">Clear</button>}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-8">
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={v.published} onChange={(e) => setV({ ...v, published: e.target.checked })} className="h-4 w-4 accent-[#c9a96e]" /> Publish on the website now</label>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={v.featured} onChange={(e) => setV({ ...v, featured: e.target.checked })} className="h-4 w-4 accent-[#c9a96e]" /> Feature on the homepage</label>
      </div>
      <Progress pct={pct} />
      <Notice n={n} />
      <button disabled={pct !== null} className={btnCls}>{pct !== null ? (pct < 100 ? `Uploading… ${pct}%` : "Finishing up…") : `Create ${label.toLowerCase()}`}</button>
    </form>
  );
}
