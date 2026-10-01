"use client";
import { useEffect, useRef } from "react";

/** Subtle desktop cursor follower that becomes "VIEW" over images. Off for touch and reduced motion. */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ring.current, text = label.current;
    if (!el || !text) return;
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("has-cursor");

    let x = -100, y = -100, cx = x, cy = y, raf = 0, view = false;
    const tick = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) scale(${view ? 1 : 0.28})`;
      raf = requestAnimationFrame(tick);
    };
    const onMove = (e: MouseEvent) => {
      x = e.clientX; y = e.clientY; el.style.opacity = "1";
      view = !!(e.target as Element | null)?.closest?.("[data-cursor='view']");
      text.style.opacity = view ? "1" : "0";
    };
    const onLeave = () => { el.style.opacity = "0"; };
    window.addEventListener("mousemove", onMove); document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); document.removeEventListener("mouseleave", onLeave); document.documentElement.classList.remove("has-cursor"); };
  }, []);

  return (
    <div ref={ring} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[200] grid h-20 w-20 place-items-center rounded-full border border-gold/70 bg-ink/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300">
      <span ref={label} className="text-[10px] tracking-[0.3em] text-paper opacity-0 transition-opacity duration-200">VIEW</span>
    </div>
  );
}
