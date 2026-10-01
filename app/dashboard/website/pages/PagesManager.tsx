"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Badge } from "@/components/ui/Controls";
import Notice, { NoticeState, inputCls, btnCls, btnGhost } from "@/components/ui/Notice";

type PageRow = { id: number; title: string; slug: string; published: boolean };
const empty = { title: "", content: "", published: false };

export default function PagesManager({ initial }: { initial: PageRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PageRow | null>(null);
  const [v, setV] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [n, setN] = useState<NoticeState>(null);

  async function reload() {
    const r = await api("/api/pages", "GET");
    const list = (r.data as unknown as { items?: (Omit<PageRow, "published"> & { published: number })[] }).items;
    if (r.ok && list) setItems(list.map((i) => ({ ...i, published: !!i.published })));
    router.refresh();
  }
  function startNew() { setEditing(null); setV(empty); setOpen(true); setN(null); }
  function startEdit(p: PageRow, content: string) { setEditing(p); setV({ title: p.title, content, published: p.published }); setOpen(true); setN(null); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setN(null);
    const r = editing ? await api(`/api/pages/${editing.id}`, "PATCH", v) : await api("/api/pages", "POST", v);
    setBusy(false);
    if (!r.ok) return setN({ kind: "error", text: r.data.error || "Couldn’t save." });
    setOpen(false); setN({ kind: "success", text: editing ? "Page saved." : "Page created." }); await reload();
  }
  async function edit(p: PageRow) {
    const r = await api(`/api/pages/${p.id}`, "GET");
    if (!r.ok) return setN({ kind: "error", text: r.data.error || "Couldn’t load this page." });
    startEdit(p, (r.data as unknown as { content: string | null }).content ?? "");
  }
  async function del(p: PageRow) {
    if (!confirm(`Delete “${p.title}”? Its address (/${p.slug}) will stop working.`)) return;
    const r = await api(`/api/pages/${p.id}`, "DELETE");
    if (r.ok) { setN({ kind: "success", text: "Page deleted." }); await reload(); } else setN({ kind: "error", text: r.data.error || "Couldn’t delete." });
  }

  return (
    <div className="space-y-10">
      {!open && <button onClick={startNew} className={btnCls}>Add page</button>}
      {open && (
        <form onSubmit={submit} className="max-w-2xl space-y-6 border border-line p-6">
          <h2 className="text-[11px] tracking-[0.3em] text-gold uppercase">{editing ? `Edit “${editing.title}”` : "New page"}</h2>
          <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Title</span>
            <input required maxLength={150} className={`${inputCls} mt-2`} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} /></label>
          {editing && <p className="text-xs text-mute">Address: /{editing.slug} (fixed once created, to avoid breaking links)</p>}
          <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Content (leave a blank line between paragraphs)</span>
            <textarea rows={10} maxLength={20000} className={`${inputCls} mt-2`} value={v.content} onChange={(e) => setV({ ...v, content: e.target.value })} /></label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={v.published} onChange={(e) => setV({ ...v, published: e.target.checked })} className="h-4 w-4 accent-[#c9a96e]" /> Published on the website</label>
          <div className="flex gap-3">
            <button disabled={busy} className={btnCls}>{busy ? "Saving…" : editing ? "Save page" : "Create page"}</button>
            <button type="button" onClick={() => setOpen(false)} className={btnGhost}>Cancel</button>
          </div>
        </form>
      )}
      <Notice n={n} />
      {items.length === 0 ? (
        <div className="border border-dashed border-line p-14 text-center"><p className="font-display text-2xl">No extra pages yet</p><p className="mt-2 text-sm text-mute">Create one for anything outside the main menu — a policy, an FAQ, a one-off announcement.</p></div>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {items.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 py-4">
              <div className="min-w-48 flex-1">
                <p className="font-display text-xl">{p.title}</p>
                <p className="mt-1 text-xs text-mute">/{p.slug}</p>
                <div className="mt-2"><Badge on={p.published} onText="Published" offText="Draft" /></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => edit(p)} className={btnGhost}>Edit</button>
                {p.published && <Link href={`/${p.slug}`} target="_blank" className={btnGhost}>View ↗</Link>}
                <Link href="/dashboard/website/navigation" className={btnGhost}>Add to menu</Link>
                <button onClick={() => del(p)} className={`${btnGhost} hover:!border-red-400 hover:!text-red-400`}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
