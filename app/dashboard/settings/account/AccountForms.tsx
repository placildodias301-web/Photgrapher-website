"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import Notice, { NoticeState, inputCls, btnCls } from "@/components/ui/Notice";
import PasswordField from "@/components/ui/PasswordField";

const lbl = "text-xs tracking-widest uppercase text-mute";

export default function AccountForms(p: { username: string; displayName: string; recoveryEmail: string }) {
  const router = useRouter();
  const [a, setA] = useState({ username: p.username, display_name: p.displayName, recovery_email: p.recoveryEmail, currentPassword: "" });
  const [an, setAn] = useState<NoticeState>(null); const [ab, setAb] = useState(false);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pn, setPn] = useState<NoticeState>(null); const [pb, setPb] = useState(false);

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault(); setAb(true); setAn(null);
    const r = await api("/api/account", "PATCH", a); setAb(false);
    if (r.ok) { setAn({ kind: "success", text: "Account details saved." }); setA({ ...a, currentPassword: "" }); router.refresh(); }
    else setAn({ kind: "error", text: r.data.error || "Couldn’t save." });
  }
  async function savePassword(e: React.FormEvent) {
    e.preventDefault(); setPn(null);
    if (pw.newPassword !== pw.confirm) return setPn({ kind: "error", text: "The new passwords don’t match." });
    setPb(true);
    const r = await api("/api/auth/change-password", "POST", { currentPassword: pw.currentPassword, newPassword: pw.newPassword }); setPb(false);
    if (r.ok) { setPn({ kind: "success", text: "Password changed." }); setPw({ currentPassword: "", newPassword: "", confirm: "" }); }
    else setPn({ kind: "error", text: r.data.error || "Couldn’t change the password." });
  }

  return (
    <div className="space-y-14">
      <form onSubmit={saveAccount} className="space-y-6 max-w-xl">
        <h2 className="text-[11px] tracking-[0.3em] text-gold uppercase">Your details</h2>
        <label className="block"><span className={lbl}>Display name</span><input required className={`${inputCls} mt-2`} value={a.display_name} onChange={(e) => setA({ ...a, display_name: e.target.value })} /></label>
        <label className="block"><span className={lbl}>Username (used to sign in)</span><input required autoComplete="username" className={`${inputCls} mt-2`} value={a.username} onChange={(e) => setA({ ...a, username: e.target.value })} /></label>
        <label className="block"><span className={lbl}>Recovery email</span><input type="email" className={`${inputCls} mt-2`} placeholder="Not set yet" value={a.recovery_email} onChange={(e) => setA({ ...a, recovery_email: e.target.value })} /></label>
        <label className="block"><span className={lbl}>Current password (to confirm)</span><PasswordField required autoComplete="current-password" className={`${inputCls} mt-2`} value={a.currentPassword} onChange={(e) => setA({ ...a, currentPassword: e.target.value })} /></label>
        <button disabled={ab} className={btnCls}>{ab ? "Saving…" : "Save details"}</button><Notice n={an} />
      </form>
      <form onSubmit={savePassword} className="space-y-6 max-w-xl">
        <h2 className="text-[11px] tracking-[0.3em] text-gold uppercase">Change password</h2>
        <label className="block"><span className={lbl}>Current password</span><PasswordField required autoComplete="current-password" className={`${inputCls} mt-2`} value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></label>
        <label className="block"><span className={lbl}>New password (at least 10 characters)</span><PasswordField required minLength={10} autoComplete="new-password" className={`${inputCls} mt-2`} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></label>
        <label className="block"><span className={lbl}>Repeat new password</span><PasswordField required autoComplete="new-password" className={`${inputCls} mt-2`} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></label>
        <button disabled={pb} className={btnCls}>{pb ? "Changing…" : "Change password"}</button><Notice n={pn} />
      </form>
    </div>
  );
}
