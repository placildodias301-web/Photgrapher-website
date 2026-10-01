import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";
import ResetForm from "./ResetForm";
export const metadata = { title: "Choose a new password", robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const s = await getSiteSettings();
  return (
    <main className="min-h-dvh grid place-items-center px-6"><div className="w-full max-w-sm">
      <p className="text-[11px] tracking-[0.35em] text-mute uppercase mb-3">Dashboard</p>
      <h1 className="font-display text-4xl font-light mb-10">{s.site_name}</h1>
      {token ? <ResetForm token={token} /> : <p className="text-sm text-mute">This link is missing its reset code. <Link href="/forgot-password" className="underline hover:text-gold">Request a new link</Link>.</p>}
    </div></main>
  );
}
