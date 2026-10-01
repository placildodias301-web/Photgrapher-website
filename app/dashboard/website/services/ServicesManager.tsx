"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, uploadWithProgress } from "@/lib/client";
import { FilePicker } from "@/components/ui/Controls";
import Notice, { NoticeState, inputCls, btnCls, btnGhost } from "@/components/ui/Notice";

type Svc = { id: number; name: string; description: string | null; published: boolean; image_url: string | null };

function Row({ s, i, last, onChange, onMove, onNotice }: { s: Svc; i: number; last: boolean; onChange: () => void; onMove: (i: number, to: number) => void; onNotice: (n: NoticeState) => void }) {
  const [name, setName] = useState(s.name); const [desc, setDesc] = useState(s.description ?? "");
  const [busy, setBusy] = useState(false);
  const dirty = name !== s.name || desc !== (s.description ?? "");
  async function save() {
    setBusy(true); const r = await api(`/api/services/${s.id}`, "PATCH", { name, description: desc }); setBusy(false);
    if (r.ok) { onNotice({ kind: "success", text: "Service saved." }); onChange(); } else onNotice({ kind: "error", text: r.data.error || "Couldn’t save." });
  }
  async function upload(f: File) {
    const fd = new FormData(); fd.append("file", f);
    const r = await uploadWithProgress(`/api/services/${s.id}/image`, fd);
    if (r.ok) { onNotice({ kind: "success", text: "Photo updated." }); onChange(); } else onNotice({ kind: "error", text: r.data.error || "Upload failed." });
  }
  async function rmImage() { const r = await api(`/api/services/${s.id}/image`, "DELETE"); if (r.ok) onChange(); else onNotice({ kind: "error", text: r.data.error || "Couldn’t remove the photo." }); }
  async function toggle() { const r = await api(`/api/services/${s.id}`, "PATCH", { published: !s.published }); if (r.ok) onChange(); else onNotice({ kind: "error", text: r.data.error || "Couldn’t update." }); }
  async function del() { if (!confirm(`Delete “${s.name}”?`)) return; const r = await api(`/api/services/${s.id}`, "DELETE"); if (r.ok) { onNotice({ kind: "success", text: "Service deleted." }); onChange(); } else onNotice({ kind: "error", text: r.data.error || "Couldn’t delete." }); }

  return (
    <li className={`flex flex-wrap gap-4 border border-line p-4 ${s.published ? "" : "opacity-60"}`}>
      <div className="w-32 space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {s.image_url ? <img src={s.image_url} alt="" loading="lazy" className="h-24 w-32 object-cover" /> : <div className="grid h-24 w-32 place-items-center bg-ink-3 text-xs text-mute">No photo</div>}
        <div className="flex flex-wrap gap-1"><FilePicker label={s.image_url ? "Replace" : "Add photo"} onFiles={(f) => upload(f[0])} />{s.image_url && <button onClick={rmImage} className={btnGhost}>Remove</button>}</div>
      </div>
      <div className="min-w-56 flex-1 space-y-3">
        <input aria-label="Service name" className={inputCls} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
        <textarea aria-label="Service description" rows={3} className={inputCls} maxLength={3000} value={desc} onChange={(e) => setDesc(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button disabled={!dirty || busy} onClick={save} className={btnCls}>{busy ? "Saving…" : "Save"}</button>
          <button onClick={() => onMove(i, i - 1)} disabled={i === 0} aria-label="Move up" className={btnGhost}>↑</button>
          <button onClick={() => onMove(i, i + 1)} disabled={last} aria-label="Move down" className={btnGhost}>↓</button>
          <button onClick={toggle} className={btnGhost}>{s.published ? "Unpublish" : "Publish"}</button>
          <button onClick={del} className={`${btnGhost} hover:!border-red-400 hover:!text-red-400`}>Delete</button>
        </div>
      </div>
    </li>
  );
}

export default function ServicesManager({ initial }: { initial: Svc[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial); const [n, setN] = useState<NoticeState>(null);
  const [name, setName] = useState("");
  async function reload() {
    const r = await api("/api/services", "GET");
    const list = (r.data as unknown as { items?: (Omit<Svc, "published"> & { published: number })[] }).items;
    if (r.ok && list) setItems(list.map((i) => ({ ...i, published: !!i.published })));
    router.refresh();
  }
  async function add(e: React.FormEvent) {
    e.preventDefault(); const r = await api("/api/services", "POST", { name });
    if (r.ok) { setName(""); setN({ kind: "success", text: "Service added." }); await reload(); } else setN({ kind: "error", text: r.data.error || "Couldn’t add it." });
  }
  async function move(i: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items]; const [it] = next.splice(i, 1); next.splice(to, 0, it); setItems(next);
    const r = await api("/api/services/order", "PUT", { ids: next.map((x) => x.id) });
    if (!r.ok) { setN({ kind: "error", text: "Couldn’t save the order." }); await reload(); } else router.refresh();
  }
  return (
    <div className="space-y-8">
      <form onSubmit={add} className="flex flex-wrap gap-3"><input aria-label="New service name" required maxLength={120} placeholder="New service, e.g. Maternity Photography" value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} max-w-sm`} /><button className={btnCls}>Add service</button></form>
      <Notice n={n} />
      <ol className="space-y-3">{items.map((s, i) => <Row key={`${s.id}-${s.name}-${s.description}-${s.image_url}-${s.published}`} s={s} i={i} last={i === items.length - 1} onChange={reload} onMove={move} onNotice={setN} />)}</ol>
    </div>
  );
}
