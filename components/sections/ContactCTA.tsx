import Link from "next/link";
import Reveal from "@/components/ui/Reveal";

export default function ContactCTA() {
  return (
    <section aria-labelledby="cta-h" className="border-t border-line py-24 text-center lg:py-36">
      <Reveal>
        <p className="mb-4 text-[11px] tracking-[0.35em] text-gold uppercase">Get in touch</p>
        <h2 id="cta-h" className="mx-auto max-w-3xl font-display text-4xl font-light md:text-6xl">Let&apos;s create something timeless together.</h2>
        <Link href="/contact" className="mt-10 inline-block bg-paper px-10 py-4 text-[11px] tracking-[0.28em] uppercase text-ink transition-colors hover:bg-gold">Let&apos;s talk</Link>
      </Reveal>
    </section>
  );
}
