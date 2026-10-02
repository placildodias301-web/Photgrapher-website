"use client";
import { useCallback, useEffect, useRef } from "react";
import type { Photo } from "./types";

type Props = {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
};

/**
 * Simple deterministic Lightbox.
 *
 * Fixed fullscreen overlay → grid layout → native <img>.
 * The image fits inside the viewer using explicit viewport-unit constraints.
 * No animations on the image, no preloading, no percentage height chains.
 */
export default function Lightbox({ photos, index, onClose, onIndex }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const open = index !== null;
  const count = photos.length;

  const go = useCallback(
    (d: number) => {
      if (index !== null) onIndex((index + d + count) % count);
    },
    [index, count, onIndex],
  );

  // Scroll lock + focus management
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>("button, a[href]"),
        ).filter((el) => !el.hasAttribute("disabled"));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, go]);

  // Nothing to render
  if (index === null || !photos[index]) return null;
  const p = photos[index];

  return (
    // Fullscreen overlay
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(12,12,13,0.95)",
        backdropFilter: "blur(4px)",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        width: "100vw",
        height: "100dvh",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.5rem",
          flexShrink: 0,
        }}
      >
        <span
          aria-live="polite"
          className="text-mute"
          style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase" }}
        >
          {index + 1} / {count}
        </span>
        <button
          ref={closeBtnRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
          className="text-paper/80 hover:text-gold"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            transition: "color 0.2s",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            style={{ width: 32, height: 32 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── VIEWER ── */}
      <div
        style={{
          display: "grid",
          placeItems: "center",
          position: "relative",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
          padding: "0 1rem",
        }}
        onClick={(e) => {
          // Clicks on the dark area around the image should close
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`${p.id}-${p.url}`}
          src={p.url}
          alt={p.alt || p.title || ""}
          style={{
            display: "block",
            width: "auto",
            height: "auto",
            maxWidth: "90vw",
            maxHeight: "78dvh",
            objectFit: "contain",
          }}
          onClick={(e) => {
            // Click on image stays open
            e.stopPropagation();
          }}
        />

        {/* Navigation arrows */}
        {count > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Previous photo"
              className="text-paper/80 hover:text-gold"
              style={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 28,
                padding: 16,
                transition: "color 0.2s",
              }}
            >
              ←
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Next photo"
              className="text-paper/80 hover:text-gold"
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 28,
                padding: 16,
                transition: "color 0.2s",
              }}
            >
              →
            </button>
          </>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.75rem 1.5rem",
          flexShrink: 0,
        }}
      >
        <p
          className="text-paper/80"
          style={{ fontSize: 14 }}
        >
          {[p.title, p.category].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  );
}
