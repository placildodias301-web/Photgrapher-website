import { getSiteSettings } from "@/lib/settings";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const s = await getSiteSettings();
  return (
    <main className="min-h-dvh grid place-items-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-[11px] tracking-[0.35em] text-mute uppercase mb-3">Dashboard</p>
        <h1 className="font-display text-4xl font-light mb-10">{s.site_name}</h1>
        <LoginForm next={next?.startsWith("/dashboard") ? next : "/dashboard"} />
      </div>
    </main>
  );
}
