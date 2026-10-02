"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import Notice, { NoticeState, inputCls, btnCls, btnGhost } from "@/components/ui/Notice";

type Item = { id: number; label: string; href: string; visible: boolean };
type KnownPage = { label: string; href: string };

export default function NavManager({ initial, knownPages = [] }: { initial: Item[]; knownPages?: KnownPage[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [n, setN] = useState<NoticeState>(null);
  const [add, setAdd] = useState({ label: "", href: "" });
  const [useDropdown, setUseDropdown] = useState(knownPages.length > 0);

  async function reload() {
    const r = await api("/api/navigation", "GET");
    const list = (r.data as unknown as { items?: (Omit<Item, "visible"> & { visible: number })[] }).items;
    if (r.ok && list) setItems(list.map((i) => ({ ...i, visible: !!i.visible })));
    router.refresh();
  }

  async function patch(i: Item, body: Partial<Item>, msg?: string) {
    const r = await api(`/api/navigation/${i.id}`, "PATCH", body);
    if (r.ok) { if (msg) setN({ kind: "success", text: msg }); await reload(); }
    else { setN({ kind: "error", text: (r.data as { error?: string }).error || "Couldn't save." }); await reload(); }
  }

  async function move(i: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items]; const [it] = next.splice(i, 1); next.splice(to, 0, it); setItems(next);
    const r = await api("/api/navigation/order", "PUT", { ids: next.map((x) => x.id) });
    if (!r.ok) { setN({ kind: "error", text: "Couldn't save the order." }); await reload(); } else router.refresh();
  }

  async function del(i: Item) {
    if (!confirm(`Remove "${i.label}" from the menu?`)) return;
    const r = await api(`/api/navigation/${i.id}`, "DELETE");
    if (r.ok) { setN({ kind: "success", text: "Removed." }); await reload(); }
    else setN({ kind: "error", text: (r.data as { error?: string }).error || "Couldn't remove." });
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const r = await api("/api/navigation", "POST", add);
    if (r.ok) { setAdd({ label: "", href: "" }); setN({ kind: "success", text: "Menu item added." }); await reload(); }
    else setN({ kind: "error", text: (r.data as { error?: string }).error || "Couldn't add it." });
  }

  // When user picks from dropdown, auto-fill label if empty
  function onPickPage(href: string) {
    const match = knownPages.find((p) => p.href === href);
    setAdd((prev) => ({ label: prev.label || (match?.label ?? ""), href }));
  }

  return (
    <div className="space-y-8">
      <Notice n={n} />

      {/* Existing items */}
      <ol className="space-y-2">
        {items.map((i, idx) => (
          <li key={`${i.id}-${i.label}-${i.href}`} className={`flex flex-wrap items-center gap-3 border border-line p-3 ${i.visible ? "" : "opacity-60"}`}>
            <input
              aria-label="Menu name"
              defaultValue={i.label}
              maxLength={60}
              onBlur={(e) => e.target.value.trim() !== i.label && patch(i, { label: e.target.value.trim() }, "Renamed.")}
              className={`${inputCls} max-w-[12rem]`}
            />
            <input
              aria-label="Links to"
              defaultValue={i.href}
              maxLength={500}
              onBlur={(e) => e.target.value.trim() !== i.href && patch(i, { href: e.target.value.trim() }, "Link updated.")}
              className={`${inputCls} max-w-xs`}
            />
            <div className="ml-auto flex flex-wrap gap-2">
              <button onClick={() => move(idx, idx - 1)} disabled={idx === 0} aria-label="Move up" className={btnGhost}>↑</button>
              <button onClick={() => move(idx, idx + 1)} disabled={idx === items.length - 1} aria-label="Move down" className={btnGhost}>↓</button>
              <button onClick={() => patch(i, { visible: !i.visible })} className={btnGhost}>{i.visible ? "Hide" : "Show"}</button>
              <button onClick={() => del(i)} className={`${btnGhost} hover:!border-red-400 hover:!text-red-400`}>Remove</button>
            </div>
          </li>
        ))}
      </ol>

      {/* Add new item */}
      <form onSubmit={create} className="space-y-4 border-t border-line pt-8">
        <h2 className="text-[11px] tracking-[0.3em] text-gold uppercase">Add a menu item</h2>

        {knownPages.length > 0 && (
          <div className="flex gap-3 mb-1">
            <button type="button" onClick={() => setUseDropdown(true)}
              className={`text-[11px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-colors ${useDropdown ? "border-gold text-gold" : "border-line text-mute hover:text-paper"}`}>
              Pick a page
            </button>
            <button type="button" onClick={() => setUseDropdown(false)}
              className={`text-[11px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-colors ${!useDropdown ? "border-gold text-gold" : "border-line text-mute hover:text-paper"}`}>
              Enter URL manually
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-[0.2em] uppercase text-mute">Label</label>
            <input
              aria-label="New menu name"
              required
              maxLength={60}
              placeholder="e.g. Blog"
              value={add.label}
              onChange={(e) => setAdd({ ...add, label: e.target.value })}
              className={`${inputCls} max-w-[12rem]`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-[0.2em] uppercase text-mute">Link</label>
            {useDropdown && knownPages.length > 0 ? (
              <select
                aria-label="Select page"
                required
                value={add.href}
                onChange={(e) => onPickPage(e.target.value)}
                className={`${inputCls} max-w-xs bg-ink-2`}
              >
                <option value="">— Select a page —</option>
                {knownPages.map((p) => (
                  <option key={p.href} value={p.href}>{p.label} ({p.href})</option>
                ))}
                <option value="__custom__">External URL…</option>
              </select>
            ) : (
              <input
                aria-label="New menu link"
                required
                placeholder="/page or https://…"
                value={add.href === "__custom__" ? "" : add.href}
                onChange={(e) => setAdd({ ...add, href: e.target.value })}
                className={`${inputCls} max-w-xs`}
              />
            )}
          </div>

          <button className={btnCls}>Add</button>
        </div>

        <p className="text-xs text-mute">
          Links to pages on your site start with &quot;/&quot;. To link to a brand-new custom page, first create it under{" "}
          <Link href="/dashboard/website/pages" className="underline hover:text-gold">Website → Pages</Link>,
          then it will appear in the dropdown above.
        </p>
      </form>
    </div>
  );
}
