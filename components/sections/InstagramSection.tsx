import Reveal from "@/components/ui/Reveal";
import type { SocialPlatform } from "@/lib/settings";

export default function InstagramSection({ socials }: { socials: SocialPlatform[] }) {
  const ig = socials.find((s) => s.platform_name.toLowerCase() === "instagram");
  if (!ig) return null;
  return (
    <section aria-labelledby="ig-h" className="mx-auto max-w-[1600px] px-6 py-24 text-center lg:px-12 lg:py-36">
      <Reveal>
        <p className="mb-4 text-[11px] tracking-[0.35em] text-gold uppercase">Follow along</p>
        <h2 id="ig-h" className="font-display text-4xl font-light md:text-6xl">{ig.username || "@" + ig.platform_name.toLowerCase()}</h2>
        <a href={ig.url} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block border border-paper/40 px-8 py-4 text-[11px] tracking-[0.28em] uppercase transition-colors hover:bg-paper hover:text-ink">
          View on Instagram →
        </a>
      </Reveal>
    </section>
  );
}
