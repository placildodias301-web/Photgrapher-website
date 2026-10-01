"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import HeroSlideshow from "./HeroSlideshow";

type Props = {
  slides: { id: number; url: string; alt_text: string | null }[];
  intervalMs: number; autoplay: boolean;
  label: string | null; title: string | null; description: string | null;
  primary: { text: string | null; link: string | null };
  secondary: { text: string | null; link: string | null };
  locationText: string | null;
};

export default function Hero(p: Props) {
  const root = useRef<HTMLElement>(null);

  // Intro: dark screen -> image reveal -> title lines -> description -> buttons.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-hero-cover]", { opacity: 0, duration: 1.4, ease: "power2.inOut" })
        .from("[data-hero-word]", { yPercent: 110, duration: 1, stagger: 0.07 }, "-=0.9")
        .from("[data-hero-fade]", { opacity: 0, y: 18, duration: 0.9, stagger: 0.12 }, "-=0.55")
        .from("[data-hero-scroll]", { opacity: 0, duration: 0.8 }, "-=0.3");
    }, root);
    return () => ctx.revert();
  }, []);

  const words = (p.title ?? "").split(" ").filter(Boolean);

  return (
    <section ref={root} aria-label="Introduction" className="relative min-h-dvh overflow-hidden">
      {/* Photography: full-bleed on mobile, right-hand 60% on desktop */}
      <div data-hero-cover className="absolute inset-0 lg:left-[40%]">
        <HeroSlideshow slides={p.slides} intervalMs={p.intervalMs} autoplay={p.autoplay} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/30 lg:bg-gradient-to-r lg:from-ink lg:via-transparent lg:to-transparent lg:w-1/3" />
      </div>

      <div className="relative z-10 flex min-h-dvh max-w-[1600px] flex-col justify-end px-6 pb-20 pt-32 lg:justify-center lg:px-12 lg:pb-0 lg:w-[46%]">
        {p.label && <p data-hero-fade className="mb-6 text-[11px] tracking-[0.35em] text-gold uppercase">{p.label}</p>}
        {words.length > 0 && (
          <h1 className="font-display text-[clamp(2.6rem,6.2vw,6rem)] font-light leading-[0.98] uppercase">
            {words.map((w, i) => (
              <span key={i} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
                <span data-hero-word className="inline-block">{w}</span>
              </span>
            ))}
          </h1>
        )}
        {p.description && <p data-hero-fade className="mt-8 max-w-md text-[15px] leading-relaxed text-paper/75">{p.description}</p>}
        <div data-hero-fade className="mt-10 flex flex-wrap gap-4">
          {p.primary.text && (
            <Link href={p.primary.link || "/portfolio"} className="bg-paper px-8 py-4 text-[11px] tracking-[0.28em] uppercase text-ink hover:bg-gold transition-colors">{p.primary.text}</Link>
          )}
          {p.secondary.text && (
            <Link href={p.secondary.link || "/contact"} className="border border-paper/40 px-8 py-4 text-[11px] tracking-[0.28em] uppercase hover:bg-paper hover:text-ink transition-colors">{p.secondary.text}</Link>
          )}
        </div>
        {p.locationText && <p data-hero-fade className="mt-12 text-[11px] tracking-[0.35em] text-mute uppercase">{p.locationText}</p>}
      </div>

      <div data-hero-scroll aria-hidden className="absolute bottom-6 left-6 z-10 hidden items-center gap-3 text-[10px] tracking-[0.35em] text-mute uppercase lg:flex lg:left-12">
        <span className="block h-px w-10 bg-mute" /> Scroll
      </div>
    </section>
  );
}
