import Link from "next/link";
import Image from "next/image";
import type { About } from "@/lib/public";
import Reveal from "@/components/ui/Reveal";

export default function AboutPreview({ a }: { a: About }) {
  if (!a.name && !a.biography) return null;
  const firstPara = (a.biography ?? "").split(/\n{2,}/)[0];
  return (
    <section aria-labelledby="about-h" className="mx-auto grid max-w-[1600px] gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center lg:px-12 lg:py-36">
      <Reveal className="relative aspect-[4/5] w-full overflow-hidden bg-ink-2 order-2 lg:order-1">
        {a.profile_url && <Image src={a.profile_url} alt={a.name ?? ""} fill sizes="(min-width:1024px) 50vw, 100vw" quality={82} className="object-cover" />}
      </Reveal>
      <Reveal delay={0.1} className="order-1 lg:order-2">
        <p className="mb-4 text-[11px] tracking-[0.35em] text-gold uppercase">About</p>
        <h2 id="about-h" className="font-display text-4xl font-light md:text-5xl">{a.name}</h2>
        {a.title && <p className="mt-3 text-mute">{a.title}</p>}
        {firstPara && <p className="mt-6 max-w-md leading-relaxed text-paper/75">{firstPara}</p>}
        <Link href="/about" className="mt-8 inline-block text-[11px] tracking-[0.25em] uppercase text-gold hover:text-paper">More about me →</Link>
      </Reveal>
    </section>
  );
}
