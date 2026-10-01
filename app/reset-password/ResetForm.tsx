"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client";
import Notice, { NoticeState, inputCls, btnCls } from "@/components/ui/Notice";
import PasswordField from "@/components/ui/PasswordField";

export default function ResetForm({ token }: { token: string }) {
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [busy, setBusy] = useState(false);
  const [n, setN] = useState<NoticeState>(null); const [done, setDone] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setN(null);
    if (pw !== pw2) return setN({ kind: "error", text: "The two passwords don’t match." });
    setBusy(true); const r = await api("/api/auth/reset", "POST", { token, password: pw }); setBusy(false);
    if (r.ok) setDone(true); else setN({ kind: "error", text: r.data.error || "Something went wrong." });
  }
  if (done) return (<div className="space-y-6"><Notice n={{ kind: "success", text: "Your password has been changed." }} /><Link href="/login" className={`${btnCls} inline-block`}>Sign in</Link></div>);
  return (
    <form onSubmit={submit} className="space-y-6">
      <label className="block"><span className="text-xs tracking-widest uppercase text-mute">New password (10+ characters)</span><PasswordField required minLength={10} autoComplete="new-password" className={`${inputCls} mt-2`} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
      <label className="block"><span className="text-xs tracking-widest uppercase text-mute">Repeat new password</span><PasswordField required autoComplete="new-password" className={`${inputCls} mt-2`} value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
      <button disabled={busy} className={`${btnCls} w-full`}>{busy ? "Saving…" : "Save new password"}</button>
      <Notice n={n} />
    </form>
  );
}
