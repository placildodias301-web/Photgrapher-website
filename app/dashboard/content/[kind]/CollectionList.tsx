"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/Controls";
import Notice, { NoticeState, btnGhost } from "@/components/ui/Notice";

type Item = { id: number; title: string; slug: string; location: string | null; event_date: string | null; featured: boolean; published: boolean; category: string | null; cover_url: string | null; image_count: number };

export default function CollectionList({ kind, items, publicBase, label }: { kind: string; items: Item[]; publicBase: string; label: string }) {
  const router = useRouter();
  const [n, setN] = useState<NoticeState>(null);

  async function remove(i: Item) {
    if (!confirm(`Delete “${i.title}” and its ${i.image_count} photo(s)? This can’t be undone.`)) return;
    const r = await api(`/api/collections/${kind}/${i.id}`, "DELETE");
    if (r.ok) { setN({ kind: "success", text: `${i.title} deleted.` }); router.refresh(); } else setN({ kind: "error", text: r.data.error || "Couldn’t delete." });
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-line p-14 text-center">
        <p className="font-display text-2xl">No {label}s yet</p>
        <p className="mt-2 text-sm text-mute">Create your first one — add a cover, upload photos, and publish when you’re ready.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Notice n={n} />
      <ul className="divide-y divide-line border-y border-line">
        {items.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-4 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {i.cover_url ? <img src={i.cover_url} alt="" loading="lazy" className="h-20 w-28 object-cover" /> : <div className="grid h-20 w-28 place-items-center bg-ink-3 text-xs text-mute">No cover</div>}
            <div className="min-w-48 flex-1">
              <Link href={`/dashboard/content/${kind}/${i.id}`} className="font-display text-xl hover:text-gold">{i.title}</Link>
              <p className="mt-1 text-xs text-mute">{[i.category, i.location, i.event_date && formatDate(i.event_date), `${i.image_count} photo${i.image_count === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}</p>
              <div className="mt-2 flex gap-2"><Badge on={i.published} onText="Published" offText="Draft" />{i.featured && <Badge on onText="Featured" offText="" />}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/content/${kind}/${i.id}`} className={btnGhost}>Edit</Link>
              {i.published && <Link href={`${publicBase}/${i.slug}`} target="_blank" className={btnGhost}>View ↗</Link>}
              <button onClick={() => remove(i)} className={`${btnGhost} hover:!border-red-400 hover:!text-red-400`}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
