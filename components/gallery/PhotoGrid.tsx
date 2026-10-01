"use client";
import Image from "next/image";
import { useMemo, useState, useSyncExternalStore } from "react";
import Lightbox from "./Lightbox";
import { ratio, type Photo } from "./types";

// Responsive column count without a resize listener per item.
function subscribe(cb: () => void) { window.addEventListener("resize", cb); return () => window.removeEventListener("resize", cb); }
const columnsNow = () => (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
const useColumns = () => useSyncExternalStore(subscribe, columnsNow, () => 3);

type Props = {
  initial: Photo[]; total: number; pageSize: number;
  fetchMore?: (page: number) => Promise<Photo[]>;
  captions?: boolean;
};

/** Masonry gallery: shortest-column placement (stable when more photos load) + fullscreen lightbox. */
export default function PhotoGrid({ initial, total, pageSize, fetchMore, captions = true }: Props) {
  const cols = useColumns();
  const [items, setItems] = useState(initial);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  const columns = useMemo(() => {
    const out: { p: Photo; i: number }[][] = Array.from({ length: cols }, () => []);
    const heights = Array(cols).fill(0);
    items.forEach((p, i) => {
      const c = heights.indexOf(Math.min(...heights));
      out[c].push({ p, i }); heights[c] += ratio(p) + 0.08;
    });
    return out;
  }, [items, cols]);

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
      <div className="flex items-start gap-4">
        {columns.map((col, ci) => (
          <div key={ci} className="flex min-w-0 flex-1 flex-col gap-4">
            {col.map(({ p, i }) => (
              <button key={p.id} onClick={() => setOpen(i)} data-cursor="view" aria-label={`Open photo${p.title ? `: ${p.title}` : ""}`}
                className="group relative block w-full overflow-hidden bg-ink-2 text-left">
                <Image src={p.url} alt={p.alt || p.title || ""} width={p.width || 1500} height={p.height || 1000}
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" quality={80} priority={i < 3}
                  className="h-auto w-full transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]" />
                {captions && (p.title || p.category) && (
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-4 pt-12 text-[11px] tracking-[0.2em] uppercase opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                    {p.title}{p.category ? <span className="text-gold"> · {p.category}</span> : null}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {items.length < total && fetchMore && (
        <div className="mt-14 text-center">
          <button onClick={more} disabled={busy} className="border border-paper/40 px-8 py-4 text-[11px] tracking-[0.28em] uppercase transition-colors hover:bg-paper hover:text-ink disabled:opacity-50">
            {busy ? "Loading…" : "Load more"}
          </button>
          {error && <p role="alert" className="mt-4 text-sm text-red-300">Couldn’t load more photos. Please try again.</p>}
        </div>
      )}
      {/* pageSize is kept in props for callers that paginate on the server */}
      <span hidden data-page-size={pageSize} />
      <Lightbox photos={items} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </>
  );
}
