"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import Notice, { NoticeState, inputCls, btnCls, btnGhost } from "@/components/ui/Notice";

type Item = { id: number; label: string; href: string; visible: boolean };

export default function NavManager({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial); const [n, setN] = useState<NoticeState>(null);
  const [add, setAdd] = useState({ label: "", href: "" });
  async function reload() {
    const r = await api("/api/navigation", "GET");
    const list = (r.data as unknown as { items?: (Omit<Item, "visible"> & { visible: number })[] }).items;
    if (r.ok && list) setItems(list.map((i) => ({ ...i, visible: !!i.visible })));
    router.refresh();
  }
  async function patch(i: Item, body: Partial<Item>, msg?: string) {
    const r = await api(`/api/navigation/${i.id}`, "PATCH", body);
    if (r.ok) { if (msg) setN({ kind: "success", text: msg }); await reload(); } else { setN({ kind: "error", text: r.data.error || "Couldn’t save." }); await reload(); }
  }
  async function move(i: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items]; const [it] = next.splice(i, 1); next.splice(to, 0, it); setItems(next);
    const r = await api("/api/navigation/order", "PUT", { ids: next.map((x) => x.id) });
    if (!r.ok) { setN({ kind: "error", text: "Couldn’t save the order." }); await reload(); } else router.refresh();
  }
  async function del(i: Item) { if (!confirm(`Remove “${i.label}” from the menu?`)) return; const r = await api(`/api/navigation/${i.id}`, "DELETE"); if (r.ok) { setN({ kind: "success", text: "Removed." }); await reload(); } else setN({ kind: "error", text: r.data.error || "Couldn’t remove." }); }
  async function create(e: React.FormEvent) {
    e.preventDefault(); const r = await api("/api/navigation", "POST", add);
    if (r.ok) { setAdd({ label: "", href: "" }); setN({ kind: "success", text: "Menu item added." }); await reload(); } else setN({ kind: "error", text: r.data.error || "Couldn’t add it." });
  }
  return (
    <div className="space-y-8">
      <Notice n={n} />
      <ol className="space-y-2">
        {items.map((i, idx) => (
          <li key={`${i.id}-${i.label}-${i.href}`} className={`flex flex-wrap items-center gap-3 border border-line p-3 ${i.visible ? "" : "opacity-60"}`}>
            <input aria-label="Menu name" defaultValue={i.label} maxLength={60} onBlur={(e) => e.target.value.trim() !== i.label && patch(i, { label: e.target.value.trim() }, "Renamed.")} className={`${inputCls} max-w-[12rem]`} />
            <input aria-label="Links to" defaultValue={i.href} maxLength={500} onBlur={(e) => e.target.value.trim() !== i.href && patch(i, { href: e.target.value.trim() }, "Link updated.")} className={`${inputCls} max-w-xs`} />
            <div className="ml-auto flex flex-wrap gap-2">
              <button onClick={() => move(idx, idx - 1)} disabled={idx === 0} aria-label="Move up" className={btnGhost}>↑</button>
              <button onClick={() => move(idx, idx + 1)} disabled={idx === items.length - 1} aria-label="Move down" className={btnGhost}>↓</button>
              <button onClick={() => patch(i, { visible: !i.visible })} className={btnGhost}>{i.visible ? "Hide" : "Show"}</button>
              <button onClick={() => del(i)} className={`${btnGhost} hover:!border-red-400 hover:!text-red-400`}>Remove</button>
            </div>
          </li>
        ))}
      </ol>
      <form onSubmit={create} className="space-y-3 border-t border-line pt-8">
        <h2 className="text-[11px] tracking-[0.3em] text-gold uppercase">Add a menu item</h2>
        <div className="flex flex-wrap gap-3">
          <input aria-label="New menu name" required maxLength={60} placeholder="Name, e.g. Blog" value={add.label} onChange={(e) => setAdd({ ...add, label: e.target.value })} className={`${inputCls} max-w-[12rem]`} />
          <input aria-label="New menu link" required placeholder="/page or https://…" value={add.href} onChange={(e) => setAdd({ ...add, href: e.target.value })} className={`${inputCls} max-w-xs`} />
          <button className={btnCls}>Add</button>
        </div>
        <p className="text-xs text-mute">
          Links to pages on your site start with “/”, e.g. /portfolio. This only adds an entry to the menu —
          it doesn&apos;t create the page itself. To link to a brand-new page (not Home, Portfolio, Stories,
          Films, About, Services or Contact), first create it under{" "}
          <Link href="/dashboard/website/pages" className="underline hover:text-gold">Website → Pages</Link>,
          then point the menu item at the address shown there.
        </p>
      </form>
    </div>
  );
}
