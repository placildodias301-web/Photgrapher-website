import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";
import ForgotForm from "./ForgotForm";
export const metadata = { title: "Forgot password", robots: { index: false } };
export default async function Page() {
  const s = await getSiteSettings();
  return (
    <main className="min-h-dvh grid place-items-center px-6"><div className="w-full max-w-sm">
      <p className="text-[11px] tracking-[0.35em] text-mute uppercase mb-3">Dashboard</p>
      <h1 className="font-display text-4xl font-light mb-3">{s.site_name}</h1>
      <p className="mb-10 text-sm text-mute">Enter the recovery email saved on your account and we’ll send you a link to choose a new password.</p>
      <ForgotForm />
      <p className="mt-8 text-sm"><Link href="/login" className="text-mute underline hover:text-gold">Back to sign in</Link></p>
    </div></main>
  );
}
