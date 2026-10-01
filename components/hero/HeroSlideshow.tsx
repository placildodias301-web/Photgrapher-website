"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Slide = { id: number; url: string; alt_text: string | null };
type Props = { slides: Slide[]; intervalMs: number; autoplay: boolean };

const FADE_MS = 1000;

export default function HeroSlideshow({ slides, intervalMs, autoplay }: Props) {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const count = slides.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Stop all work while the tab is in the background.
  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const running = autoplay && !paused && !hidden && count > 1;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearTimeout(t);
  }, [running, index, intervalMs, count]);

  // Very subtle parallax, off for reduced motion.
  useEffect(() => {
    if (reduced || !wrapRef.current) return;
    const el = wrapRef.current;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate3d(0, ${Math.min(window.scrollY, 900) * 0.08}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [reduced]);

  const go = useCallback((n: number) => setIndex((n + count) % count), [count]);

  if (!count) return <div className="absolute inset-0 bg-ink-2" aria-hidden />;

  const next = (index + 1) % count;
  const fade = reduced ? 300 : FADE_MS;

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink-2">
      <div ref={wrapRef} className="absolute inset-[-4%] will-change-transform">
        {slides.map((s, i) => {
          // Only the visible slide and the one about to appear are mounted,
          // so later slides aren't downloaded until they're needed.
          const mounted = i === index || i === next || (i === 0);
          if (!mounted) return null;
          const active = i === index;
          return (
            <div key={s.id} aria-hidden={!active}
              className="absolute inset-0"
              style={{ opacity: active ? 1 : 0, transition: `opacity ${fade}ms ease-in-out`, zIndex: active ? 1 : 0 }}>
              <Image src={s.url} alt={active ? (s.alt_text ?? "") : ""} fill sizes="(min-width:1024px) 60vw, 100vw"
                priority={i === 0} loading={i === 0 ? "eager" : "lazy"} quality={85}
                className="object-cover"
                style={reduced ? undefined : {
                  animation: active ? `heroZoom ${intervalMs + fade * 2}ms ease-out forwards` : undefined,
                }} />
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="absolute bottom-6 right-6 z-10 flex items-center gap-4 text-[11px] tracking-[0.25em] uppercase text-paper/80">
          <span aria-hidden>{String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
          {autoplay && (
            <button onClick={() => setPaused((p) => !p)} aria-pressed={paused}
              className="border border-paper/40 px-3 py-2 hover:bg-paper hover:text-ink transition-colors">
              {paused ? "Play" : "Pause"} slideshow
            </button>
          )}
          <button onClick={() => go(index - 1)} aria-label="Previous image" className="px-1 hover:text-gold">←</button>
          <button onClick={() => go(index + 1)} aria-label="Next image" className="px-1 hover:text-gold">→</button>
        </div>
      )}
      <style>{`@keyframes heroZoom{from{transform:scale(1.08)}to{transform:scale(1)}}`}</style>
    </div>
  );
}
