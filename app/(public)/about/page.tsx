import Image from "next/image";
import Link from "next/link";
import { getAbout } from "@/lib/public";
export const dynamic = "force-dynamic";
export const metadata = { title: "About" };

export default async function Page() {
  const a = await getAbout();
  const paras = (a.biography ?? "").split(/\n{2,}/).filter(Boolean);
  return (
    <div className="mx-auto grid max-w-[1600px] gap-16 px-6 pb-28 pt-36 lg:grid-cols-2 lg:px-12 lg:pt-44">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-2 lg:sticky lg:top-32 lg:self-start">
        {a.profile_url && <Image src={a.profile_url} alt={a.name ?? "Portrait"} fill sizes="(min-width:1024px) 50vw, 100vw" quality={85} priority className="object-cover" />}
      </div>
      <div>
        <p className="mb-4 text-[11px] tracking-[0.35em] text-gold uppercase">About</p>
        <h1 className="font-display text-5xl font-light md:text-6xl">{a.heading || a.name}</h1>
        {a.title && <p className="mt-4 text-mute">{a.title}{a.location ? ` · ${a.location}` : ""}</p>}
        {a.quote && <p className="mt-8 border-l-2 border-gold pl-6 font-display text-2xl font-light italic text-paper/90">“{a.quote}”</p>}
        <div className="mt-10 space-y-5 leading-relaxed text-paper/80">{paras.map((p, i) => <p key={i}>{p}</p>)}</div>
        <Link href="/contact" className="mt-10 inline-block bg-paper px-8 py-4 text-[11px] tracking-[0.28em] uppercase text-ink transition-colors hover:bg-gold">Let&apos;s talk</Link>
      </div>
    </div>
  );
}
