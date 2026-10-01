"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Props = { siteName: string; logoUrl: string | null; items: { id: number; label: string; href: string }[] };

export default function Navbar({ siteName, logoUrl, items }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu when the route changes (adjusting state during render, not in an effect).
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) { setPrevPath(pathname); setOpen(false); }
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);

  const brand = logoUrl
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={logoUrl} alt={siteName} className="h-9 w-auto" />
    : <span className="font-display text-xl tracking-[0.18em] uppercase">{siteName}</span>;

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-ink/70 backdrop-blur-md border-b border-line/60 py-3" : "bg-transparent py-6"}`}>
        <nav aria-label="Main" className="mx-auto flex max-w-[1600px] items-center justify-between px-6 lg:px-12">
          <Link href="/" className="relative z-[60]" aria-label={`${siteName} home`}>{brand}</Link>

          <ul className="hidden lg:flex items-center gap-9">
            {items.map((i) => (
              <li key={i.id}>
                <Link href={i.href} aria-current={pathname === i.href ? "page" : undefined}
                  className={`text-[11px] tracking-[0.28em] uppercase transition-colors hover:text-gold ${
                    pathname === i.href ? "text-gold" : "text-paper/80"}`}>{i.label}</Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <Link href="/contact" className="hidden lg:inline-block border border-paper/40 px-6 py-3 text-[11px] tracking-[0.28em] uppercase hover:bg-paper hover:text-ink transition-colors">
              Let&apos;s talk
            </Link>
            <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu"
              className="relative z-[60] lg:hidden text-[11px] tracking-[0.3em] uppercase py-2">
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </nav>
      </header>

      <div id="mobile-menu" aria-hidden={!open} inert={!open}
        className={`fixed inset-0 z-[55] bg-ink lg:hidden transition-[clip-path] duration-700 ease-[cubic-bezier(.77,0,.18,1)] ${
          open ? "[clip-path:inset(0_0_0_0)]" : "[clip-path:inset(0_0_100%_0)]"}`}>
        <ul className="flex h-full flex-col justify-center gap-5 px-8">
          {items.map((i, idx) => (
            <li key={i.id} className="overflow-hidden">
              <Link href={i.href}
                style={{ transitionDelay: open ? `${250 + idx * 60}ms` : "0ms" }}
                className={`block font-display text-5xl font-light transition-all duration-700 ${
                  open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>{i.label}</Link>
            </li>
          ))}
          <li className="mt-6">
            <Link href="/contact" className="inline-block border border-paper/40 px-7 py-3 text-[11px] tracking-[0.28em] uppercase">
              Let&apos;s talk
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
