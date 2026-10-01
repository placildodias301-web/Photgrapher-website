"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, uploadWithProgress } from "@/lib/client";
import { FilePicker, Progress } from "@/components/ui/Controls";
import Notice, { NoticeState, inputCls, btnGhost } from "@/components/ui/Notice";

type Item = { kind: string; pid: number; image_id: number; title: string; published: boolean; url: string };

export default function PhotosManager({ projects, items, total, page, pageSize, selected }: { projects: { ref: string; title: string }[]; items: Item[]; total: number; page: number; pageSize: number; selected: string }) {
  const router = useRouter();
  const [target, setTarget] = useState(selected || projects[0]?.ref || "");
  const [pct, setPct] = useState<number | null>(null); const [n, setN] = useState<NoticeState>(null);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const go = (p: string, pg = 1) => router.push(`/dashboard/content/photos?${new URLSearchParams({ ...(p ? { project: p } : {}), page: String(pg) })}`);

  async function upload(files: File[]) {
    const m = /^(shoots|albums):(\d+)$/.exec(target);
    if (!m) return setN({ kind: "error", text: "Choose which project to add the photos to." });
    setN(null); setPct(0);
    const fd = new FormData(); files.forEach((f) => fd.append("files", f));
    const r = await uploadWithProgress(`/api/collections/${m[1]}/${m[2]}/images`, fd, setPct); setPct(null);
    const failed = r.data.failed ?? [];
    setN(r.ok ? { kind: failed.length ? "error" : "success", text: `${r.data.added} photo(s) uploaded.${failed.length ? " Skipped: " + failed.join(" ") : ""}` } : { kind: "error", text: failed.join(" ") || r.data.error || "Upload failed." });
    router.refresh();
  }
  async function del(i: Item) {
    if (!confirm("Delete this photo? It will be removed from the website.")) return;
    const r = await api(`/api/collections/${i.kind}/${i.pid}/images/${i.image_id}`, "DELETE");
    if (r.ok) { setN({ kind: "success", text: "Photo deleted." }); router.refresh(); } else setN({ kind: "error", text: r.data.error || "Couldn’t delete." });
  }

  if (projects.length === 0) return (
    <div className="border border-dashed border-line p-14 text-center"><p className="font-display text-2xl">Create a shoot first</p><p className="mt-2 text-sm text-mute">Photos live inside a shoot or story.</p><Link href="/dashboard/content/shoots/new" className={`${btnGhost} mt-5 inline-block`}>Add new shoot</Link></div>
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 border border-line p-4">
        <label className="min-w-56 flex-1"><span className="text-xs tracking-widest uppercase text-mute">Upload photos to</span>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className={`${inputCls} mt-2`}>{projects.map((p) => <option key={p.ref} value={p.ref}>{p.title}</option>)}</select></label>
        <FilePicker primary label="Choose photos" multiple onFiles={upload} />
      </div>
      <Progress pct={pct} /><Notice n={n} />
      <div className="flex items-center gap-3">
        <label className="text-xs tracking-widest uppercase text-mute" htmlFor="pf">Show</label>
        <select id="pf" value={selected} onChange={(e) => go(e.target.value)} className={`${inputCls} max-w-xs`}><option value="">All projects</option>{projects.map((p) => <option key={p.ref} value={p.ref}>{p.title}</option>)}</select>
        <span className="text-xs text-mute">{total} photo{total === 1 ? "" : "s"}</span>
      </div>
      {items.length === 0 ? (
        <div className="border border-dashed border-line p-14 text-center"><p className="font-display text-2xl">No photos here yet</p></div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((i) => (
            <li key={`${i.kind}-${i.image_id}`} className="border border-line p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              <p className="mt-2 truncate text-xs" title={i.title}>{i.title}</p>
              <p className="text-[10px] tracking-widest uppercase text-mute">{i.published ? "Published" : "Draft"}</p>
              <div className="mt-2 flex gap-2"><Link href={`/dashboard/content/${i.kind}/${i.pid}`} className={btnGhost}>Open</Link><button onClick={() => del(i)} className={`${btnGhost} hover:!border-red-400 hover:!text-red-400`}>Delete</button></div>
            </li>
          ))}
        </ul>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button disabled={page <= 1} onClick={() => go(selected, page - 1)} className={btnGhost}>← Previous</button>
          <span className="text-xs text-mute">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => go(selected, page + 1)} className={btnGhost}>Next →</button>
        </div>
      )}
    </div>
  );
}
