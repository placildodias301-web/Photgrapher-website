"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import Notice, { NoticeState, inputCls, btnCls, btnGhost } from "@/components/ui/Notice";

type Cat = { id: number; name: string; enabled: boolean; shoot_count: number };

export default function CategoriesManager({ initial }: { initial: Cat[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [n, setN] = useState<NoticeState>(null);

  async function reload() {
    const r = await api("/api/categories", "GET");
    const list = (r.data as unknown as { items?: (Omit<Cat, "enabled"> & { enabled: number })[] }).items;
    if (r.ok && list) setItems(list.map((i) => ({ ...i, enabled: !!i.enabled })));
    router.refresh();
  }
  async function add(e: React.FormEvent) {
    e.preventDefault(); setN(null);
    const r = await api("/api/categories", "POST", { name });
    if (r.ok) { setName(""); setN({ kind: "success", text: "Category added." }); await reload(); } else setN({ kind: "error", text: r.data.error || "Couldn’t add it." });
  }
  async function rename(c: Cat, value: string) {
    value = value.trim();
    if (!value || value === c.name) return;
    const r = await api(`/api/categories/${c.id}`, "PATCH", { name: value });
    if (r.ok) { setItems((x) => x.map((y) => y.id === c.id ? { ...y, name: value } : y)); setN({ kind: "success", text: "Renamed." }); }
    else { setN({ kind: "error", text: r.data.error || "Couldn’t rename." }); await reload(); }
  }
  async function toggle(c: Cat) {
    const r = await api(`/api/categories/${c.id}`, "PATCH", { enabled: !c.enabled });
    if (r.ok) setItems((x) => x.map((y) => y.id === c.id ? { ...y, enabled: !y.enabled } : y)); else setN({ kind: "error", text: r.data.error || "Couldn’t update." });
  }
  async function remove(c: Cat) {
    const extra = c.shoot_count ? ` ${c.shoot_count} shoot(s) use it; they will stay on your site but lose this category.` : "";
    if (!confirm(`Delete the “${c.name}” category?${extra}`)) return;
    const r = await api(`/api/categories/${c.id}`, "DELETE");
    if (r.ok) { setN({ kind: "success", text: "Category deleted." }); await reload(); } else setN({ kind: "error", text: r.data.error || "Couldn’t delete." });
  }
  async function move(i: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items]; const [it] = next.splice(i, 1); next.splice(to, 0, it); setItems(next);
    const r = await api("/api/categories/order", "PUT", { ids: next.map((x) => x.id) });
    if (!r.ok) { setN({ kind: "error", text: "Couldn’t save the order." }); await reload(); } else router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={add} className="flex flex-wrap gap-3">
        <input aria-label="New category name" required maxLength={60} placeholder="New category, e.g. Anniversary" value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} max-w-xs`} />
        <button className={btnCls}>Add category</button>
      </form>
      <Notice n={n} />
      <ol className="space-y-2">
        {items.map((c, i) => (
          <li key={c.id} className={`flex flex-wrap items-center gap-3 border border-line p-3 ${c.enabled ? "" : "opacity-60"}`}>
            <input aria-label={`Rename ${c.name}`} defaultValue={c.name} maxLength={60} onBlur={(e) => rename(c, e.target.value)} className={`${inputCls} max-w-xs`} />
            <span className="text-xs text-mute">{c.shoot_count} shoot{c.shoot_count === 1 ? "" : "s"}{c.enabled ? "" : " · hidden"}</span>
            <div className="ml-auto flex flex-wrap gap-2">
              <button onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up" className={btnGhost}>↑</button>
              <button onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Move down" className={btnGhost}>↓</button>
              <button onClick={() => toggle(c)} className={btnGhost}>{c.enabled ? "Hide" : "Show"}</button>
              <button onClick={() => remove(c)} className={`${btnGhost} hover:!border-red-400 hover:!text-red-400`}>Delete</button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
