import { query } from "@/lib/db";
import PhotosManager from "./PhotosManager";
export const dynamic = "force-dynamic";
export const metadata = { title: "Photos" };
const PAGE = 48;

export default async function Page({ searchParams }: { searchParams: Promise<{ project?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);
  const m = /^(shoots|albums):(\d+)$/.exec(sp.project ?? "");
  const projects = await query<{ ref: string; title: string }>(
    `SELECT CONCAT('shoots:', id) AS ref, name AS title FROM shoots UNION ALL SELECT CONCAT('albums:', id), CONCAT(title, ' (story)') FROM albums ORDER BY title`);

  const filter = m ? (m[1] === "shoots" ? "WHERE p.kind = 'shoots' AND p.pid = ?" : "WHERE p.kind = 'albums' AND p.pid = ?") : "";
  const args = m ? [Number(m[2])] : [];
  const base = `FROM (
      SELECT 'shoots' AS kind, si.shoot_id AS pid, si.id AS image_id, si.media_id, s.name AS title, s.published, si.display_order FROM shoot_images si JOIN shoots s ON s.id = si.shoot_id
      UNION ALL
      SELECT 'albums', ai.album_id, ai.id, ai.media_id, a.title, a.published, ai.display_order FROM album_images ai JOIN albums a ON a.id = ai.album_id
    ) p JOIN media md ON md.id = p.media_id ${filter}`;
  const total = (await query<{ n: number }>(`SELECT COUNT(*) AS n ${base}`, args))[0]?.n ?? 0;
  const items = await query<{ kind: string; pid: number; image_id: number; title: string; published: number; url: string }>(
    `SELECT p.kind, p.pid, p.image_id, p.title, p.published, md.file_url AS url ${base} ORDER BY p.kind, p.pid DESC, p.display_order, p.image_id LIMIT ? OFFSET ?`, [...args, PAGE, (page - 1) * PAGE]);
  return (<><h1 className="font-display text-4xl font-light mb-2">Photos</h1>
    <p className="text-sm text-mute mb-10">Every photo across your shoots and stories. Upload straight into a project, or clean up photos you no longer want.</p>
    <PhotosManager projects={projects} items={items.map((i) => ({ ...i, published: !!i.published }))} total={total} page={page} pageSize={PAGE} selected={sp.project ?? ""} /></>);
}
