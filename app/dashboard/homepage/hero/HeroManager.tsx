"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HomepageSettings } from "@/lib/settings";
import { api, uploadWithProgress } from "@/lib/client";
import Notice, { NoticeState, inputCls, btnCls, btnGhost } from "@/components/ui/Notice";

type Slide = { id: number; url: string; alt_text: string | null; active: boolean };

export default function HeroManager({ initialSettings, initialSlides }: { initialSettings: HomepageSettings; initialSlides: Slide[] }) {
  const router = useRouter();
  const [slides, setSlides] = useState(initialSlides);
  const [pct, setPct] = useState<number | null>(null);
  const [n, setN] = useState<NoticeState>(null);
  const [sn, setSn] = useState<NoticeState>(null);
  const [saving, setSaving] = useState(false);
  const [s, setS] = useState({
    hero_enabled: !!initialSettings.hero_enabled, hero_autoplay: !!initialSettings.hero_autoplay,
    hero_interval_ms: initialSettings.hero_interval_ms,
    hero_label: initialSettings.hero_label ?? "", hero_title: initialSettings.hero_title ?? "",
    hero_description: initialSettings.hero_description ?? "",
    hero_cta_primary_text: initialSettings.hero_cta_primary_text ?? "", hero_cta_primary_link: initialSettings.hero_cta_primary_link ?? "",
    hero_cta_secondary_text: initialSettings.hero_cta_secondary_text ?? "", hero_cta_secondary_link: initialSettings.hero_cta_secondary_link ?? "",
    hero_location_text: initialSettings.hero_location_text ?? "",
  });

  async function reload() {
    const r = await api("/api/hero", "GET");
    if (r.ok && r.data.slides) setSlides(r.data.slides.map((x) => ({ ...x, active: !!x.active })));
    router.refresh();
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setN(null); setPct(0);
    const fd = new FormData(); Array.from(files).forEach((f) => fd.append("files", f));
    const r = await uploadWithProgress("/api/hero", fd, setPct);
    setPct(null);
    const failed: string[] = r.data.failed ?? [];
    if (r.ok) setN({ kind: failed.length ? "error" : "success", text: `${r.data.added} image(s) added.${failed.length ? " Skipped: " + failed.join(" ") : ""}` });
    else setN({ kind: "error", text: failed.join(" ") || r.data.error || "Upload failed." });
    await reload();
  }

  async function replace(id: number, file: File) {
    setN(null); setPct(0);
    const fd = new FormData(); fd.append("file", file);
    const r = await uploadWithProgress(`/api/hero/${id}/replace`, fd, setPct);
    setPct(null);
    setN(r.ok ? { kind: "success", text: "Image replaced." } : { kind: "error", text: r.data.error || "Upload failed." });
    await reload();
  }

  async function toggle(sl: Slide) {
    const r = await api(`/api/hero/${sl.id}`, "PATCH", { active: !sl.active });
    if (r.ok) setSlides((x) => x.map((y) => (y.id === sl.id ? { ...y, active: !y.active } : y))); else setN({ kind: "error", text: r.data.error || "Couldn’t update." });
    router.refresh();
  }

  async function remove(sl: Slide) {
    if (!confirm("Delete this image from the hero? The photo file will be removed.")) return;
    const r = await api(`/api/hero/${sl.id}`, "DELETE");
    if (r.ok) { setSlides((x) => x.filter((y) => y.id !== sl.id)); router.refresh(); } else setN({ kind: "error", text: r.data.error || "Couldn’t delete." });
  }

  async function move(from: number, to: number) {
    if (to < 0 || to >= slides.length) return;
    const next = [...slides]; const [it] = next.splice(from, 1); next.splice(to, 0, it);
    setSlides(next);
    const r = await api("/api/hero/order", "PUT", { ids: next.map((x) => x.id) });
    if (!r.ok) { setN({ kind: "error", text: r.data.error || "Couldn’t save the new order." }); await reload(); } else router.refresh();
  }

  async function saveAlt(sl: Slide, text: string) {
    if (text === (sl.alt_text ?? "")) return;
    const r = await api(`/api/hero/${sl.id}`, "PATCH", { alt_text: text });
    if (r.ok) setSlides((x) => x.map((y) => (y.id === sl.id ? { ...y, alt_text: text } : y))); else setN({ kind: "error", text: r.data.error || "Couldn’t save the description." });
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSn(null);
    const r = await api("/api/hero/settings", "PUT", s);
    setSaving(false);
    setSn(r.ok ? { kind: "success", text: "Hero settings saved." } : { kind: "error", text: r.data.error || "Couldn’t save." });
    if (r.ok) router.refresh();
  }

  const set = (k: keyof typeof s) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setS({ ...s, [k]: e.target.value });
  const lbl = "text-xs tracking-widest uppercase text-mute";

  return (
    <div className="space-y-14">
      <section aria-labelledby="slides-h">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <h2 id="slides-h" className="text-[11px] tracking-[0.3em] text-gold uppercase">Slideshow images ({slides.length})</h2>
          <label className={`${btnCls} cursor-pointer`}>Upload images
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="sr-only"
              onChange={(e) => { upload(e.target.files); e.target.value = ""; }} /></label>
        </div>
        {pct !== null && <div className="mb-4 h-1 bg-line" role="progressbar" aria-label="Upload progress" aria-valuenow={pct}><div className="h-1 bg-gold transition-all" style={{ width: `${pct}%` }} /></div>}
        <Notice n={n} />

        {slides.length === 0 ? (
          <div className="mt-4 border border-dashed border-line p-12 text-center">
            <p className="font-display text-2xl">No hero images yet</p>
            <p className="mt-2 text-sm text-mute">Upload your best photos. They&apos;ll fade into each other on the homepage.</p>
          </div>
        ) : (
          <ol className="mt-4 space-y-3">
            {slides.map((sl, i) => (
              <li key={sl.id} className={`flex flex-wrap items-center gap-4 border p-3 ${sl.active ? "border-line" : "border-line opacity-60"}`}>
                <span className="w-6 text-center text-xs text-mute">{i + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sl.url} alt={sl.alt_text ?? ""} loading="lazy" className="h-20 w-32 object-cover" />
                <div className="min-w-44 flex-1">
                  <input aria-label="Image description" defaultValue={sl.alt_text ?? ""} onBlur={(e) => saveAlt(sl, e.target.value)} placeholder="Describe this photo (for accessibility)" className={inputCls} maxLength={255} />
                  <p className="mt-1 text-xs text-mute">{sl.active ? "Shown on the homepage" : "Hidden — not shown"}{i === 0 ? " · plays first" : ""}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier" className={btnGhost}>↑</button>
                  <button onClick={() => move(i, i + 1)} disabled={i === slides.length - 1} aria-label="Move later" className={btnGhost}>↓</button>
                  {i !== 0 && <button onClick={() => move(i, 0)} className={btnGhost}>Make first</button>}
                  <button onClick={() => toggle(sl)} className={btnGhost}>{sl.active ? "Hide" : "Show"}</button>
                  <label className={`${btnGhost} cursor-pointer`}>Replace
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) replace(sl.id, f); e.target.value = ""; }} /></label>
                  <button onClick={() => remove(sl)} className={`${btnGhost} hover:!border-red-400 hover:!text-red-400`}>Delete</button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <form onSubmit={saveSettings} className="space-y-6" aria-labelledby="set-h">
        <h2 id="set-h" className="text-[11px] tracking-[0.3em] text-gold uppercase">Slideshow &amp; text</h2>
        <div className="flex flex-wrap gap-8">
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={s.hero_enabled} onChange={(e) => setS({ ...s, hero_enabled: e.target.checked })} className="h-4 w-4 accent-[#c9a96e]" /> Show the hero on the homepage</label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={s.hero_autoplay} onChange={(e) => setS({ ...s, hero_autoplay: e.target.checked })} className="h-4 w-4 accent-[#c9a96e]" /> Change images automatically</label>
        </div>
        <label className="block max-w-xs"><span className={lbl}>Seconds per image</span>
          <select className={`${inputCls} mt-2`} value={s.hero_interval_ms} onChange={(e) => setS({ ...s, hero_interval_ms: Number(e.target.value) })}>
            {[3, 4, 5, 6, 7, 8].map((sec) => <option key={sec} value={sec * 1000}>{sec} seconds{sec === 5 ? " (recommended)" : ""}</option>)}
          </select></label>
        <label className="block"><span className={lbl}>Small label</span><input className={`${inputCls} mt-2`} value={s.hero_label} onChange={set("hero_label")} maxLength={120} /></label>
        <label className="block"><span className={lbl}>Main title</span><textarea rows={2} className={`${inputCls} mt-2`} value={s.hero_title} onChange={set("hero_title")} maxLength={255} /></label>
        <label className="block"><span className={lbl}>Description</span><textarea rows={3} className={`${inputCls} mt-2`} value={s.hero_description} onChange={set("hero_description")} maxLength={500} /></label>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block"><span className={lbl}>First button text</span><input className={`${inputCls} mt-2`} value={s.hero_cta_primary_text} onChange={set("hero_cta_primary_text")} maxLength={60} /></label>
          <label className="block"><span className={lbl}>First button link</span><input className={`${inputCls} mt-2`} placeholder="/portfolio" value={s.hero_cta_primary_link} onChange={set("hero_cta_primary_link")} maxLength={255} /></label>
          <label className="block"><span className={lbl}>Second button text</span><input className={`${inputCls} mt-2`} value={s.hero_cta_secondary_text} onChange={set("hero_cta_secondary_text")} maxLength={60} /></label>
          <label className="block"><span className={lbl}>Second button link</span><input className={`${inputCls} mt-2`} placeholder="/contact" value={s.hero_cta_secondary_link} onChange={set("hero_cta_secondary_link")} maxLength={255} /></label>
        </div>
        <label className="block max-w-sm"><span className={lbl}>Location line</span><input className={`${inputCls} mt-2`} value={s.hero_location_text} onChange={set("hero_location_text")} maxLength={120} /></label>
        <button disabled={saving} className={btnCls}>{saving ? "Saving…" : "Save hero settings"}</button>
        <Notice n={sn} />
      </form>
    </div>
  );
}
