import Image from "next/image";
import Link from "next/link";
import { getServices } from "@/lib/public";
export const dynamic = "force-dynamic";
export const metadata = { title: "Services" };

export default async function Page() {
  const services = await getServices();
  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-28 pt-36 lg:px-12">
      <header className="mb-16">
        <p className="mb-4 text-[11px] tracking-[0.35em] text-gold uppercase">Services</p>
        <h1 className="font-display text-5xl font-light md:text-7xl">What I Offer</h1>
      </header>

      <div className="divide-y divide-line border-y border-line">
        {services.map((s) => (
          <div key={s.id} className="grid gap-8 py-12 md:grid-cols-[2fr_3fr] md:items-center lg:gap-16">
            {/* Image — 16:10 landscape, more cinematic */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-2">
              {s.image_url ? (
                <Image
                  src={s.image_url}
                  alt={s.name}
                  fill
                  sizes="(min-width:768px) 40vw, 100vw"
                  quality={82}
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  <span className="text-[11px] tracking-[0.2em] uppercase text-mute">No image</span>
                </div>
              )}
            </div>

            {/* Text */}
            <div>
              <h2 className="font-display text-3xl font-light md:text-4xl">{s.name}</h2>
              {s.description && (
                <p className="mt-4 max-w-2xl leading-relaxed text-paper/75">{s.description}</p>
              )}
              <Link
                href="/contact"
                className="mt-6 inline-block text-[11px] tracking-[0.25em] uppercase text-gold hover:text-paper transition-colors"
              >
                Enquire →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <p className="text-mute">Services are being added — please check back soon.</p>
      )}
    </div>
  );
}
