import Link from "next/link";
import { query, queryOne } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";
import { toIso } from "@/lib/format";
import { STATUS_LABEL, STATUS_TONE, type EnquiryStatus } from "@/lib/enquiry-status";
import LocalTime from "@/components/ui/LocalTime";

export const dynamic = "force-dynamic";
const count = async (sql: string) => (await queryOne<{ n: number }>(sql))?.n ?? 0;

export default async function Overview() {
  const [s, shoots, photos, published, albums, films, newEnq, enquiries, activity, uploads] = await Promise.all([
    getSiteSettings(),
    count(`SELECT COUNT(*) n FROM shoots`),
    count(`SELECT (SELECT COUNT(*) FROM shoot_images) + (SELECT COUNT(*) FROM album_images) n`),
    count(`SELECT (SELECT COUNT(*) FROM shoot_images si JOIN shoots s ON s.id=si.shoot_id WHERE s.published)
                + (SELECT COUNT(*) FROM album_images ai JOIN albums a ON a.id=ai.album_id WHERE a.published) n`),
    count(`SELECT COUNT(*) n FROM albums`),
    count(`SELECT COUNT(*) n FROM videos`),
    count(`SELECT COUNT(*) n FROM enquiries WHERE status='new'`),
    query<{ id: number; name: string; event_type: string | null; status: EnquiryStatus; created_at: string }>(`SELECT id, name, event_type, status, created_at FROM enquiries ORDER BY created_at DESC, id DESC LIMIT 5`),
    query<{ id: number; description: string; created_at: string }>(`SELECT id, description, created_at FROM activity_logs ORDER BY id DESC LIMIT 8`),
    query<{ id: number; file_url: string; file_name: string }>(`SELECT id, file_url, file_name FROM media WHERE type='image' ORDER BY id DESC LIMIT 6`),
  ]);
  const stats: [string, number, string?][] = [
    ["Total shoots", shoots, "/dashboard/content/shoots"], ["Total photos", photos, "/dashboard/content/photos"], ["Published photos", published],
    ["Albums", albums, "/dashboard/content/albums"], ["Films", films, "/dashboard/content/films"], ["New enquiries", newEnq, "/dashboard/enquiries?status=new"],
  ];
  const actions: [string, string][] = [
    ["Add new shoot", "/dashboard/content/shoots/new"], ["Upload photos", "/dashboard/content/photos"], ["Add film", "/dashboard/content/films"],
    ["Create story", "/dashboard/content/albums/new"], ["Edit homepage", "/dashboard/homepage/hero"], ["View enquiries", "/dashboard/enquiries"],
  ];
  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-light">Dashboard</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-mute">
            <span className={`inline-block h-2 w-2 rounded-full ${s.maintenance_mode ? "bg-amber-400" : "bg-emerald-400"}`} />
            {s.maintenance_mode ? <>Maintenance mode — visitors can’t see the site. <Link href="/dashboard/settings/maintenance" className="underline hover:text-gold">Turn off</Link></> : "Website online"}
          </p>
        </div>
        <Link href="/" target="_blank" className="border border-line px-5 py-3 text-[11px] tracking-[0.22em] uppercase hover:border-gold hover:text-gold transition-colors">View website ↗</Link>
      </header>

      <section aria-label="Statistics" className="grid grid-cols-2 gap-px bg-line md:grid-cols-3">
        {stats.map(([label, n, href]) => {
          const inner = (<><p className="font-display text-4xl font-light">{n}</p><p className="mt-1 text-[11px] tracking-[0.22em] text-mute uppercase">{label}</p></>);
          return href ? <Link key={label} href={href} className="bg-ink-2 p-6 hover:bg-ink-3 transition-colors">{inner}</Link> : <div key={label} className="bg-ink-2 p-6">{inner}</div>;
        })}
      </section>

      <section>
        <h2 className="mb-4 text-[11px] tracking-[0.3em] text-gold uppercase">Quick actions</h2>
        <div className="flex flex-wrap gap-3">{actions.map(([l, h]) => <Link key={l} href={h} className="border border-line px-5 py-3 text-sm hover:border-gold">{l}</Link>)}</div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between"><h2 className="text-[11px] tracking-[0.3em] text-gold uppercase">Recent enquiries</h2><Link href="/dashboard/enquiries" className="text-xs text-mute hover:text-gold">View all</Link></div>
        {enquiries.length === 0 ? <p className="text-sm text-mute">No enquiries yet. They’ll appear here when someone uses your contact form.</p> : (
          <ul className="divide-y divide-line border-y border-line">
            {enquiries.map((e) => (
              <li key={e.id}><Link href={`/dashboard/enquiries/${e.id}`} className="flex flex-wrap items-center gap-4 py-3 hover:bg-ink-2 px-2 -mx-2">
                <span className={`w-32 shrink-0 border px-2 py-1 text-center text-[10px] tracking-[0.15em] uppercase ${STATUS_TONE[e.status]}`}>{STATUS_LABEL[e.status]}</span>
                <span className="flex-1 text-sm">{e.name}{e.event_type ? <span className="text-mute"> · {e.event_type}</span> : null}</span>
                <span className="text-xs text-mute"><LocalTime iso={toIso(e.created_at)} relative /></span>
              </Link></li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="mb-4 text-[11px] tracking-[0.3em] text-gold uppercase">Recent activity</h2>
          {activity.length === 0 ? <p className="text-sm text-mute">Nothing yet. Changes you make will appear here.</p> : (
            <ul className="divide-y divide-line border-y border-line">
              {activity.map((a) => (
                <li key={a.id} className="flex justify-between gap-4 py-3 text-sm"><span>{a.description}</span><span className="shrink-0 text-xs text-mute"><LocalTime iso={toIso(a.created_at)} relative /></span></li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="mb-4 text-[11px] tracking-[0.3em] text-gold uppercase">Recent uploads</h2>
          {uploads.length === 0 ? <p className="text-sm text-mute">No uploads yet.</p> : (
            <div className="grid grid-cols-3 gap-2">
              {uploads.map((u) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={u.id} src={u.file_url} alt={u.file_name} loading="lazy" className="aspect-square w-full object-cover" />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
