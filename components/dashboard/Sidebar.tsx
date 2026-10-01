"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bell } from "@/components/dashboard/NotificationCenter";

const GROUPS: { title?: string; items: { label: string; href: string }[] }[] = [
  { items: [{ label: "Dashboard", href: "/dashboard" }] },
  { title: "Homepage", items: [{ label: "Hero", href: "/dashboard/homepage/hero" }] },
  { title: "Content", items: [
    { label: "Shoots / Projects", href: "/dashboard/content/shoots" },
    { label: "Photos", href: "/dashboard/content/photos" },
    { label: "Albums / Stories", href: "/dashboard/content/albums" },
    { label: "Films / Videos", href: "/dashboard/content/films" },
    { label: "Categories", href: "/dashboard/content/categories" },
  ] },
  { title: "Website", items: [
    { label: "Branding", href: "/dashboard/website/branding" },
    { label: "About", href: "/dashboard/website/about" },
    { label: "Services", href: "/dashboard/website/services" },
    { label: "Pages", href: "/dashboard/website/pages" },
    { label: "Navigation", href: "/dashboard/website/navigation" },
    { label: "Footer", href: "/dashboard/website/footer" },
    { label: "Social & Contact", href: "/dashboard/website/social" },
  ] },
  { items: [
    { label: "Enquiries", href: "/dashboard/enquiries" },
    { label: "Notifications", href: "/dashboard/notifications" },
    { label: "Media Library", href: "/dashboard/media" },
  ] },
  { title: "Settings", items: [
    { label: "Account & Security", href: "/dashboard/settings/account" },
    { label: "Maintenance Mode", href: "/dashboard/settings/maintenance" },
  ] },
];

export default function Sidebar({ siteName, displayName }: { siteName: string; displayName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login"); router.refresh();
  }

  const nav = (
    <nav aria-label="Dashboard" className="flex h-full flex-col">
      <div className="px-6 py-7 border-b border-line">
        <p className="font-display text-xl leading-tight">{siteName}</p>
        <p className="mt-1 text-[10px] tracking-[0.3em] text-mute uppercase">Dashboard</p>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        {GROUPS.map((g, gi) => (
          <div key={gi} className="mb-4">
            {g.title && <p className="px-6 pb-2 pt-3 text-[10px] tracking-[0.3em] text-mute uppercase">{g.title}</p>}
            {g.items.map((it) => {
              const active = it.href === "/dashboard" ? pathname === it.href : pathname.startsWith(it.href);
              return (
                <Link key={it.href} href={it.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
                  className={`block px-6 py-2.5 text-sm border-l-2 transition-colors ${active ? "border-gold text-gold bg-ink-3" : "border-transparent text-paper/75 hover:text-paper hover:bg-ink-3"}`}>
                  {it.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-t border-line p-4">
        <p className="px-2 pb-3 text-xs text-mute truncate">{displayName}</p>
        <button onClick={logout} className="w-full border border-line py-2.5 text-[11px] tracking-[0.22em] uppercase hover:border-gold hover:text-gold transition-colors">Log out</button>
      </div>
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-ink-2 border-r border-line">{nav}</aside>
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-ink-2 border-b border-line px-4 py-3">
        <span className="font-display text-lg">{siteName}</span>
        <div className="flex items-center gap-2"><Bell /><button onClick={() => setOpen(true)} aria-label="Open menu" className="text-[11px] tracking-[0.25em] uppercase py-2 px-2">Menu</button></div>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 max-w-[85%] bg-ink-2 border-r border-line">{nav}</div>
          <button aria-label="Close menu" onClick={() => setOpen(false)} className="flex-1 bg-black/60" />
        </div>
      )}
    </>
  );
}
