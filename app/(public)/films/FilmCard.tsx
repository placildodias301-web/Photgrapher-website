"use client";
import { useState } from "react";
import type { FilmCard as F } from "@/lib/public";
import { formatDate } from "@/lib/format";

export default function FilmCard({ film }: { film: F }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden bg-ink-2">
        {playing && film.video_url ? (
          <video src={film.video_url} controls autoPlay preload="metadata" className="h-full w-full object-cover" />
        ) : (
          <button onClick={() => setPlaying(true)} aria-label={`Play ${film.title}`} className="group relative block h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {film.thumb_url ? <img src={film.thumb_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="h-full w-full bg-ink-3" />}
            <span className="absolute inset-0 flex items-center justify-center bg-ink/30 transition-colors group-hover:bg-ink/10">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-paper/70 text-xl">▶</span>
            </span>
          </button>
        )}
      </div>
      <p className="mt-5 text-[11px] tracking-[0.3em] text-gold uppercase">{[film.category, film.location, film.event_date && formatDate(film.event_date)].filter(Boolean).join(" · ")}</p>
      <h2 className="mt-2 font-display text-2xl font-light">{film.title}</h2>
      {film.description && <p className="mt-2 text-sm text-mute line-clamp-2">{film.description}</p>}
    </div>
  );
}
