"use client";
import { useState } from "react";
import Link from "next/link";
import PasswordField from "@/components/ui/PasswordField";

export default function LoginForm({ next }: { next: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }),
    });
    if (res.ok) { 
      window.location.href = next; 
      return; 
    }
    setError((await res.json().catch(() => ({}))).error || "Something went wrong. Please try again.");
    setBusy(false);
  }

  const field = "w-full bg-transparent border-b border-line focus:border-gold py-3 outline-none transition-colors";
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <label className="block">
        <span className="text-xs tracking-widest uppercase text-mute">Username</span>
        <input name="username" autoComplete="username" required className={field} />
      </label>
      <label className="block">
        <span className="text-xs tracking-widest uppercase text-mute">Password</span>
        <PasswordField name="password" autoComplete="current-password" required className={field} />
      </label>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <button disabled={busy}
        className="w-full bg-paper text-ink py-3 text-xs tracking-[0.25em] uppercase hover:bg-gold transition-colors disabled:opacity-50">
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm"><Link href="/forgot-password" className="text-mute underline hover:text-gold">Forgot password?</Link></p>
    </form>
  );
}
