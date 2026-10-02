"use client";
import { useState } from "react";
import type { FilmCard as F } from "@/lib/public";
import { formatDate } from "@/lib/format";

export default function FilmCard({ film }: { film: F }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="group block bg-ink-2 hover:bg-ink-3 transition-colors">
      <div className="relative aspect-video w-full overflow-hidden bg-ink-3">
        {playing && film.video_url ? (
          <video src={film.video_url} controls autoPlay preload="metadata" className="h-full w-full object-cover" />
        ) : (
          <button onClick={() => setPlaying(true)} aria-label={`Play ${film.title}`} className="group/btn relative block h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {film.thumb_url ? <img src={film.thumb_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover/btn:scale-[1.04]" /> : <div className="h-full w-full bg-ink-3" />}
            <span className="absolute inset-0 grid place-items-center bg-ink/30 transition-colors group-hover/btn:bg-ink/10">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-paper/70 text-sm">▶</span>
            </span>
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-xl font-light group-hover:text-gold transition-colors">{film.title}</h3>
        <p className="mt-2 text-[11px] tracking-[0.18em] uppercase text-mute">
          {[film.category, film.location, film.event_date && formatDate(film.event_date)].filter(Boolean).join(" · ")}
        </p>
        {film.description && <p className="mt-3 text-sm text-mute line-clamp-2">{film.description}</p>}
      </div>
    </div>
  );
}
