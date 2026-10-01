"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import Notice, { NoticeState, inputCls, btnCls } from "@/components/ui/Notice";

export default function ForgotForm() {
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false); const [n, setN] = useState<NoticeState>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setN(null);
    const r = await api("/api/auth/forgot", "POST", { email }); setBusy(false);
    const msg = (r.data as { message?: string }).message;
    setN(r.ok ? { kind: "success", text: msg || "Check your email." } : { kind: "error", text: r.data.error || "Something went wrong." });
  }
  return (
    <form onSubmit={submit} className="space-y-6">
      <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Recovery email</span><input type="email" required autoComplete="email" className={`${inputCls} mt-2`} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <button disabled={busy} className={`${btnCls} w-full`}>{busy ? "Sending…" : "Send reset link"}</button>
      <Notice n={n} />
    </form>
  );
}
