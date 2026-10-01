"use client";
import { useCallback, useEffect, useState } from "react";
import { api, uploadWithProgress } from "@/lib/client";
import { FilePicker, Progress } from "@/components/ui/Controls";
import Notice, { NoticeState, inputCls, btnGhost } from "@/components/ui/Notice";

type Item = { id: number; file_name: string; file_url: string; mime_type: string; file_size: number; width: number | null; height: number | null; type: "image" | "video"; used_by: string[] };
type Resp = { items: Item[]; total: number; page: number; pageSize: number };
const USAGE = [["", "All files"], ["unused", "Not used anywhere"], ["hero", "Homepage hero"], ["branding", "Logo & favicon"], ["profile", "Profile image"], ["shoots", "Shoots"], ["stories", "Stories"], ["films", "Films"], ["services", "Service images"]];
const size = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function MediaLibrary() {
  const [q, setQ] = useState(""); const [type, setType] = useState(""); const [usage, setUsage] = useState(""); const [page, setPage] = useState(1);
  const [resp, setResp] = useState<Resp | null>(null); const [n, setN] = useState<NoticeState>(null);
  const [pct, setPct] = useState<number | null>(null); const [preview, setPreview] = useState<Item | null>(null);

  const load = useCallback(async () => {
    const sp = new URLSearchParams({ page: String(page) }); if (q) sp.set("q", q); if (type) sp.set("type", type); if (usage) sp.set("usage", usage);
    const r = await api(`/api/media?${sp}`, "GET");
    if (r.ok) setResp(r.data as unknown as Resp);
  }, [q, type, usage, page]);
  useEffect(() => {
    const t = setTimeout(() => void load(), q ? 250 : 0); // debounce typing
    return () => clearTimeout(t);
  }, [load, q]);
  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPreview(null);
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  async function upload(files: File[]) {
    setN(null); setPct(0);
    const fd = new FormData(); files.forEach((f) => fd.append("files", f));
    const r = await uploadWithProgress("/api/media", fd, setPct); setPct(null);
    const failed = r.data.failed ?? [];
    setN(r.ok ? { kind: failed.length ? "error" : "success", text: `${r.data.added} file(s) uploaded.${failed.length ? " Skipped: " + failed.join(" ") : ""}` } : { kind: "error", text: failed.join(" ") || r.data.error || "Upload failed." });
    setPage(1); await load();
  }
  async function del(i: Item) {
    if (!confirm(`Delete “${i.file_name}” permanently?`)) return;
    const r = await api(`/api/media/${i.id}`, "DELETE");
    if (r.ok) { setN({ kind: "success", text: "File deleted." }); await load(); } else setN({ kind: "error", text: r.data.error || "Couldn’t delete." });
  }
  const pages = resp ? Math.max(1, Math.ceil(resp.total / resp.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block flex-1 min-w-48"><span className="sr-only">Search files</span><input type="search" placeholder="Search by file name…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className={inputCls} /></label>
        <label><span className="sr-only">Type</span><select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className={inputCls}><option value="">Images &amp; videos</option><option value="image">Images</option><option value="video">Videos</option></select></label>
        <label><span className="sr-only">Used by</span><select value={usage} onChange={(e) => { setUsage(e.target.value); setPage(1); }} className={inputCls}>{USAGE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <FilePicker primary label="Upload files" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,video/quicktime" onFiles={upload} />
      </div>
      <Progress pct={pct} /><Notice n={n} />
      {!resp ? <p className="text-sm text-mute">Loading…</p> : resp.items.length === 0 ? (
        <div className="border border-dashed border-line p-14 text-center"><p className="font-display text-2xl">Nothing found</p><p className="mt-2 text-sm text-mute">Try a different search or filter, or upload some files.</p></div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resp.items.map((i) => (
            <li key={i.id} className="border border-line p-3">
              <button onClick={() => setPreview(i)} aria-label={`Preview ${i.file_name}`} className="block w-full">
                {i.type === "image"
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={i.file_url} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  : <div className="grid aspect-[4/3] w-full place-items-center bg-ink-3 text-sm text-mute">▶ Video</div>}
              </button>
              <p className="mt-3 truncate text-sm" title={i.file_name}>{i.file_name}</p>
              <p className="text-xs text-mute">{size(i.file_size)}{i.width && i.height ? ` · ${i.width}×${i.height}` : ""}</p>
              <p className={`mt-2 text-xs ${i.used_by.length ? "text-gold" : "text-mute"}`}>{i.used_by.length ? `Currently used by ${i.used_by.join(", ")}` : "Not used anywhere"}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setPreview(i)} className={btnGhost}>Preview</button>
                <button onClick={() => del(i)} disabled={i.used_by.length > 0} title={i.used_by.length ? "Remove it from where it’s used first" : undefined} className={`${btnGhost} hover:!border-red-400 hover:!text-red-400`}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {resp && pages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={btnGhost}>← Previous</button>
          <span className="text-xs text-mute">Page {page} of {pages} · {resp.total} files</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className={btnGhost}>Next →</button>
        </div>
      )}
      {preview && (
        <div role="dialog" aria-modal="true" aria-label={`Preview of ${preview.file_name}`} className="fixed inset-0 z-[80] flex flex-col bg-black/90 p-4" onClick={() => setPreview(null)}>
          <button onClick={() => setPreview(null)} className="ml-auto px-3 py-2 text-[11px] tracking-[0.25em] uppercase">Close</button>
          <div className="grid min-h-0 flex-1 place-items-center" onClick={(e) => e.stopPropagation()}>
            {preview.type === "image"
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={preview.file_url} alt={preview.file_name} className="max-h-full max-w-full object-contain" />
              : <video src={preview.file_url} controls preload="metadata" className="max-h-full max-w-full" />}
          </div>
          <p className="pt-3 text-center text-xs text-mute">{preview.file_name} — {preview.used_by.length ? `Currently used by ${preview.used_by.join(", ")}` : "Not used anywhere"}</p>
        </div>
      )}
    </div>
  );
}
