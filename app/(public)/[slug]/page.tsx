import { notFound } from "next/navigation";
import { queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getPage(slug: string) {
  return queryOne<{ title: string; content: string | null }>(
    `SELECT title, content FROM custom_pages WHERE slug = ? AND published = TRUE`, [slug]);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const page = await getPage((await params).slug);
  return { title: page ? page.title : "Not found" };
}

// Renders any page created in the dashboard under Website -> Pages, at the slug chosen there.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const page = await getPage((await params).slug);
  if (!page) notFound();
  const paragraphs = (page.content ?? "").split(/\n{2,}/).filter(Boolean);
  return (
    <div className="mx-auto max-w-3xl px-6 pb-28 pt-36 lg:px-12 lg:pt-44">
      <h1 className="font-display text-5xl font-light md:text-6xl">{page.title}</h1>
      <div className="mt-10 space-y-5 leading-relaxed text-paper/80">
        {paragraphs.map((p, i) => <p key={i} className="whitespace-pre-wrap">{p}</p>)}
      </div>
    </div>
  );
}
