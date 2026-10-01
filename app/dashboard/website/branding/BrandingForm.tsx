"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/lib/settings";
import { api, uploadWithProgress } from "@/lib/client";
import Notice, { NoticeState, inputCls, btnCls, btnGhost } from "@/components/ui/Notice";

function AssetControl({ kind, label, url, hint }: { kind: "logo" | "favicon"; label: string; url: string | null; hint: string }) {
  const router = useRouter();
  const [pct, setPct] = useState<number | null>(null);
  const [n, setN] = useState<NoticeState>(null);

  async function upload(file: File) {
    setN(null); setPct(0);
    const fd = new FormData(); fd.append("file", file);
    const r = await uploadWithProgress(`/api/branding/asset/${kind}`, fd, setPct);
    setPct(null);
    if (r.ok) { setN({ kind: "success", text: `${label} updated.` }); router.refresh(); }
    else setN({ kind: "error", text: r.data.error || "Upload failed." });
  }
  async function remove() {
    if (!confirm(`Remove the ${label.toLowerCase()}?`)) return;
    const r = await api(`/api/branding/asset/${kind}`, "DELETE");
    if (r.ok) { setN({ kind: "success", text: `${label} removed.` }); router.refresh(); } else setN({ kind: "error", text: r.data.error || "Couldn’t remove it." });
  }

  return (
    <div className="border border-line p-5">
      <div className="flex flex-wrap items-center gap-5">
        <div className="grid h-20 w-32 place-items-center bg-ink-3 border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {url ? <img src={url} alt={`Current ${label.toLowerCase()}`} className="max-h-16 max-w-28 object-contain" /> : <span className="text-xs text-mute">None</span>}
        </div>
        <div className="flex-1 min-w-48">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-mute mt-1">{hint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className={`${btnGhost} cursor-pointer`}>{url ? "Replace" : "Upload"}
              <input type="file" className="sr-only" accept={kind === "favicon" ? "image/*,.ico" : "image/*"}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
            </label>
            {url && <button onClick={remove} className={btnGhost}>Remove</button>}
          </div>
        </div>
      </div>
      {pct !== null && <div className="mt-4 h-1 bg-line" role="progressbar" aria-valuenow={pct}><div className="h-1 bg-gold transition-all" style={{ width: `${pct}%` }} /></div>}
      <div className="mt-3"><Notice n={n} /></div>
    </div>
  );
}

export default function BrandingForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [v, setV] = useState({
    site_name: initial.site_name, site_description: initial.site_description ?? "",
    copyright_text: initial.copyright_text ?? "", accent_color: initial.accent_color ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [n, setN] = useState<NoticeState>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setN(null);
    const r = await api("/api/branding", "PATCH", v);
    setBusy(false);
    if (r.ok) { setN({ kind: "success", text: "Saved. The public website is updated." }); router.refresh(); }
    else setN({ kind: "error", text: r.data.error || "Couldn’t save." });
  }

  return (
    <div className="space-y-10">
      <form onSubmit={save} className="space-y-6">
        <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Website name</span>
          <input className={`${inputCls} mt-2`} required maxLength={120} value={v.site_name} onChange={(e) => setV({ ...v, site_name: e.target.value })} /></label>
        <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Website description (search engines &amp; social sharing)</span>
          <textarea className={`${inputCls} mt-2`} rows={3} maxLength={255} value={v.site_description} onChange={(e) => setV({ ...v, site_description: e.target.value })} /></label>
        <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Footer copyright text (optional)</span>
          <input className={`${inputCls} mt-2`} maxLength={255} placeholder={`© ${new Date().getFullYear()} ${v.site_name}`} value={v.copyright_text} onChange={(e) => setV({ ...v, copyright_text: e.target.value })} /></label>
        <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Accent colour (optional)</span>
          <div className="mt-2 flex items-center gap-3">
            <input type="color" aria-label="Pick accent colour" value={/^#[0-9a-f]{6}$/i.test(v.accent_color) ? v.accent_color : "#c9a96e"} onChange={(e) => setV({ ...v, accent_color: e.target.value })} className="h-11 w-14 bg-ink border border-line" />
            <input className={inputCls} placeholder="#c9a96e" value={v.accent_color} onChange={(e) => setV({ ...v, accent_color: e.target.value })} />
            {v.accent_color && <button type="button" className={btnGhost} onClick={() => setV({ ...v, accent_color: "" })}>Reset</button>}
          </div></label>
        <div className="flex items-center gap-4"><button disabled={busy} className={btnCls}>{busy ? "Saving…" : "Save changes"}</button></div>
        <Notice n={n} />
      </form>
      <div className="space-y-4">
        <AssetControl kind="logo" label="Logo" url={initial.logo_url} hint="Shown in the menu and footer. PNG or SVG with a transparent background works best." />
        <AssetControl kind="favicon" label="Favicon" url={initial.favicon_url} hint="The small icon in the browser tab. Square, at least 64×64." />
      </div>
    </div>
  );
}
