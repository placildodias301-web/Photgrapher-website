"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { formatDate } from "@/lib/format";
import type { ShootCard } from "@/lib/public";

type Props = {
  initial: ShootCard[];
  total: number;
  pageSize: number;
  fetchMore?: (page: number) => Promise<ShootCard[]>;
};

// Location pin icon
function PinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0" aria-hidden="true">
      <path fillRule="evenodd" d="M8 1a5 5 0 1 0 0 10A5 5 0 0 0 8 1ZM6.5 8.5A1.5 1.5 0 0 1 8 7a1.5 1.5 0 0 1 1.5 1.5A1.5 1.5 0 0 1 8 10a1.5 1.5 0 0 1-1.5-1.5ZM8 4.5a.5.5 0 0 0 0 1 .5.5 0 0 0 0-1Z" clipRule="evenodd" />
      <path d="M4 8a4 4 0 1 1 5.197 3.833L8 14l-1.197-2.167A4 4 0 0 1 4 8Z" />
    </svg>
  );
}

// Calendar icon
function CalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0" aria-hidden="true">
      <path d="M5.75 7.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM5 11.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0ZM10.25 7.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM9.5 11.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0ZM7.25 8.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0ZM8 11.25a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
      <path fillRule="evenodd" d="M4.75 1a.75.75 0 0 1 .75.75V3h5V1.75a.75.75 0 0 1 1.5 0V3h.75A2.25 2.25 0 0 1 15 5.25v7.5A2.25 2.25 0 0 1 12.75 15h-9.5A2.25 2.25 0 0 1 1 12.75v-7.5A2.25 2.25 0 0 1 3.25 3H4V1.75A.75.75 0 0 1 4.75 1Zm-1.5 5.5a.75.75 0 0 0 0 1.5h9.5a.75.75 0 0 0 0-1.5h-9.5Z" clipRule="evenodd" />
    </svg>
  );
}

export default function ShootGrid({ initial, total, fetchMore }: Omit<Props, "pageSize">) {
  const [items, setItems] = useState(initial);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function more() {
    if (!fetchMore) return;
    setBusy(true); setError(false);
    try {
      const next = await fetchMore(page + 1);
      if (next.length) { setItems((x) => [...x, ...next]); setPage((n) => n + 1); }
    } catch { setError(true); }
    setBusy(false);
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <Link
            key={s.id}
            href={`/portfolio/${s.slug}`}
            data-cursor="view"
            className="group block bg-ink-2 hover:bg-ink-3 transition-colors"
          >
            {/* Cover image — uniform 3:2 ratio */}
            <div className="relative aspect-[3/2] w-full overflow-hidden bg-ink-3">
              {s.cover_url && (
                <Image
                  src={s.cover_url}
                  alt={s.name}
                  fill
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  quality={82}
                  className="object-contain transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                />
              )}
              {!s.cover_url && (
                <div className="absolute inset-0 grid place-items-center">
                  <span className="text-[11px] tracking-[0.2em] uppercase text-mute">No cover</span>
                </div>
              )}
            </div>

            {/* Metadata below image */}
            <div className="px-4 py-3">
              <h3 className="font-display text-xl font-light group-hover:text-gold transition-colors leading-snug">
                {s.name}
              </h3>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] tracking-[0.16em] uppercase text-mute">
                <div className="flex items-center gap-3 min-w-0">
                  {s.category && (
                    <span className="text-gold/80 truncate">{s.category}</span>
                  )}
                  {s.location && (
                    <span className="flex items-center gap-1 truncate">
                      <PinIcon />
                      {s.location}
                    </span>
                  )}
                </div>
                {s.event_date && (
                  <span className="flex items-center gap-1 shrink-0">
                    <CalIcon />
                    {formatDate(s.event_date)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {items.length < total && fetchMore && (
        <div className="mt-14 text-center">
          <button
            onClick={more}
            disabled={busy}
            className="border border-paper/40 px-8 py-4 text-[11px] tracking-[0.28em] uppercase transition-colors hover:bg-paper hover:text-ink disabled:opacity-50"
          >
            {busy ? "Loading…" : "Load more"}
          </button>
          {error && <p role="alert" className="mt-4 text-sm text-red-300">Couldn&apos;t load more. Please try again.</p>}
        </div>
      )}
    </>
  );
}
