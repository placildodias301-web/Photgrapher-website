"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import Notice, { NoticeState, inputCls, btnCls } from "@/components/ui/Notice";

export default function FooterForm({ initial, siteName }: { initial: { footer_description: string; copyright_text: string }; siteName: string }) {
  const router = useRouter();
  const [v, setV] = useState(initial); const [n, setN] = useState<NoticeState>(null); const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setN(null);
    const r = await api("/api/footer", "PUT", v); setBusy(false);
    if (r.ok) { setN({ kind: "success", text: "Footer saved." }); router.refresh(); } else setN({ kind: "error", text: r.data.error || "Couldn’t save." });
  }
  return (
    <form onSubmit={save} className="max-w-2xl space-y-6">
      <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Short description</span><textarea rows={3} maxLength={255} className={`${inputCls} mt-2`} value={v.footer_description} onChange={(e) => setV({ ...v, footer_description: e.target.value })} /></label>
      <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Copyright text</span><input maxLength={255} placeholder={`© ${new Date().getFullYear()} ${siteName}. All rights reserved.`} className={`${inputCls} mt-2`} value={v.copyright_text} onChange={(e) => setV({ ...v, copyright_text: e.target.value })} /></label>
      <button disabled={busy} className={btnCls}>{busy ? "Saving…" : "Save footer"}</button><Notice n={n} />
    </form>
  );
}
