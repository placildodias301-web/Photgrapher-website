"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import type { Photo } from "./types";

type Props = { photos: Photo[]; index: number | null; onClose: () => void; onIndex: (i: number) => void };

export default function Lightbox({ photos, index, onClose, onIndex }: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const open = index !== null;
  const count = photos.length;

  const go = useCallback((d: number) => { if (index !== null) onIndex((index + d + count) % count); }, [index, count, onIndex]);

  // Scroll lock + focus management: only when opening/closing, not on every slide change.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => { document.body.style.overflow = ""; previous?.focus?.(); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && dialog.current) {
        const f = Array.from(dialog.current.querySelectorAll<HTMLElement>("button, a[href]")).filter((el) => !el.hasAttribute("disabled"));
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, go]);

  if (index === null || !photos[index]) return null;
  const p = photos[index];
  const neighbours = count > 1 ? [photos[(index + 1) % count], photos[(index - 1 + count) % count]] : [];

  return (
    <div ref={dialog} role="dialog" aria-modal="true" aria-label="Photo viewer"
      className="lb-fade fixed inset-0 z-[100] flex flex-col bg-ink/95 backdrop-blur-sm"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current; touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}>
      <div className="flex items-center justify-between px-5 py-4 text-[11px] tracking-[0.25em] uppercase">
        <span aria-live="polite" className="text-mute">{index + 1} / {count}</span>
        <button ref={closeBtn} onClick={onClose} className="px-2 py-2 hover:text-gold">Close</button>
      </div>

      <div className="relative min-h-0 flex-1" onClick={onClose}>
        <Image key={p.url} src={p.url} alt={p.alt || p.title || ""} fill sizes="100vw" quality={85} priority className="lb-fade object-contain p-2 sm:p-6" onClick={(e) => e.stopPropagation()} />
        {count > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous photo" className="absolute left-2 top-1/2 -translate-y-1/2 px-4 py-6 text-2xl text-paper/80 hover:text-gold sm:left-6">←</button>
            <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next photo" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-6 text-2xl text-paper/80 hover:text-gold sm:right-6">→</button>
          </>
        )}
      </div>

      {/* Warm the neighbours so next/previous feels instant */}
      <div className="sr-only" aria-hidden>{neighbours.map((n) => <Image key={n.url} src={n.url} alt="" width={n.width || 1600} height={n.height || 1067} sizes="100vw" quality={85} loading="eager" />)}</div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
        <p className="text-paper/80">{[p.title, p.category].filter(Boolean).join(" · ")}</p>
        {p.href && <Link href={p.href} onClick={onClose} className="text-[11px] tracking-[0.25em] uppercase text-gold hover:text-paper">View project →</Link>}
      </div>
    </div>
  );
}
