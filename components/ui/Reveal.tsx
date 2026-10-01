"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Fades and lifts its children into view once, as they scroll in. Respects reduced motion. */
export default function Reveal({ children, delay = 0, y = 36, className = "" }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(el.current, { opacity: 0, y, duration: 1.1, delay, ease: "power3.out", scrollTrigger: { trigger: el.current, start: "top 88%", once: true } });
    }, el);
    return () => ctx.revert();
  }, [delay, y]);
  return <div ref={el} className={className}>{children}</div>;
}
