"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import LocalTime from "@/components/ui/LocalTime";
import { btnGhost } from "@/components/ui/Notice";

type N = { id: number; title: string; body: string | null; read: boolean; created_at: string; href: string | null };
type Data = { items: N[]; unread: number };

function useNotifications(limit: number, poll: boolean) {
  const [data, setData] = useState<Data>({ items: [], unread: 0 });
  const [loaded, setLoaded] = useState(false);
  const load = useCallback(async () => {
    const r = await api(`/api/notifications?limit=${limit}`, "GET");
    if (r.ok) { setData(r.data as unknown as Data); setLoaded(true); }
  }, [limit]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    if (!poll) return;
    const t = setInterval(load, 30_000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [load, poll]);
  return { data, loaded, load };
}

function List({ data, load, onNavigate, compact }: { data: Data; load: () => Promise<void>; onNavigate?: () => void; compact?: boolean }) {
  const router = useRouter();
  async function open(n: N) {
    if (!n.read) await api("/api/notifications/read", "POST", { id: n.id });
    await load(); onNavigate?.();
    if (n.href) router.push(n.href);
    router.refresh();
  }
  async function markAll() { await api("/api/notifications/read", "POST", { all: true }); await load(); router.refresh(); }
  async function del(n: N) { await api(`/api/notifications/${n.id}`, "DELETE"); await load(); router.refresh(); }
  async function clearRead() { await api("/api/notifications?scope=read", "DELETE"); await load(); router.refresh(); }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <button onClick={markAll} disabled={data.unread === 0} className="text-[11px] tracking-[0.18em] uppercase text-mute hover:text-gold disabled:opacity-40">Mark all as read</button>
        {!compact && <button onClick={clearRead} className="text-[11px] tracking-[0.18em] uppercase text-mute hover:text-red-400">Delete all read</button>}
      </div>
      {data.items.length === 0 ? <p className="px-4 py-10 text-center text-sm text-mute">You’re all caught up.</p> : (
        <ul className="divide-y divide-line">
          {data.items.map((n) => (
            <li key={n.id} className={`flex items-start gap-3 px-4 py-3 ${n.read ? "" : "bg-ink-3"}`}>
              <span aria-hidden className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-gold"}`} />
              <button onClick={() => open(n)} className="min-w-0 flex-1 text-left">
                <span className={`block text-sm ${n.read ? "text-paper/70" : "font-medium"}`}>{n.title}{!n.read && <span className="sr-only"> (unread)</span>}</span>
                {n.body && <span className="block truncate text-xs text-mute">{n.body}</span>}
                <span className="block text-[11px] text-mute"><LocalTime iso={n.created_at} relative /></span>
              </button>
              <button onClick={() => del(n)} aria-label={`Delete notification: ${n.title}`} className="px-2 text-mute hover:text-red-400">×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Bell() {
  const { data, load } = useNotifications(15, true);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button onClick={() => { setOpen((o) => !o); void load(); }} aria-expanded={open} aria-haspopup="true"
        aria-label={data.unread ? `Notifications, ${data.unread} unread` : "Notifications"} className="relative border border-line px-3 py-2 text-sm hover:border-gold">
        <span aria-hidden>🔔</span>
        {data.unread > 0 && <span aria-hidden className="ml-2 inline-block min-w-5 bg-gold px-1.5 text-center text-[11px] font-medium text-ink">{data.unread > 99 ? "99+" : data.unread}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 z-50 mt-2 w-[min(24rem,92vw)] border border-line bg-ink-2 shadow-2xl">
          <div className="max-h-[70vh] overflow-y-auto"><List data={data} load={load} onNavigate={() => setOpen(false)} compact /></div>
          <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="block border-t border-line px-4 py-3 text-center text-[11px] tracking-[0.2em] uppercase text-mute hover:text-gold">View all</Link>
        </div>
      )}
    </div>
  );
}

export function NotificationsPage() {
  const { data, loaded, load } = useNotifications(100, true);
  if (!loaded) return <p className="text-sm text-mute">Loading…</p>;
  return <div className="border border-line"><List data={data} load={load} /></div>;
}

export { btnGhost };
