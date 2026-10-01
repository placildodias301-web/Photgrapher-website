import Image from "next/image";
import Link from "next/link";
import { getServices } from "@/lib/public";
export const dynamic = "force-dynamic";
export const metadata = { title: "Services" };

export default async function Page() {
  const services = await getServices();
  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-28 pt-36 lg:px-12">
      <header className="mb-16"><p className="mb-4 text-[11px] tracking-[0.35em] text-gold uppercase">Services</p><h1 className="font-display text-5xl font-light md:text-7xl">What I Offer</h1></header>
      <div className="divide-y divide-line border-y border-line">
        {services.map((s) => (
          <div key={s.id} className="grid gap-6 py-10 md:grid-cols-[1fr_2fr] md:items-center">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-2">
              {s.image_url && <Image src={s.image_url} alt={s.name} fill sizes="(min-width:768px) 33vw, 100vw" quality={80} className="object-cover" />}
            </div>
            <div>
              <h2 className="font-display text-3xl font-light">{s.name}</h2>
              {s.description && <p className="mt-3 max-w-2xl text-paper/75 leading-relaxed">{s.description}</p>}
              <Link href="/contact" className="mt-5 inline-block text-[11px] tracking-[0.25em] uppercase text-gold hover:text-paper">Enquire →</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
