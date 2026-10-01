import Hero from "@/components/hero/Hero";
import SelectedWork from "@/components/sections/SelectedWork";
import AboutPreview from "@/components/sections/AboutPreview";
import FeaturedFilms from "@/components/sections/FeaturedFilms";
import InstagramSection from "@/components/sections/InstagramSection";
import ContactCTA from "@/components/sections/ContactCTA";
import { getActiveHeroSlides, getHomepageSettings, getSocials } from "@/lib/settings";
import { getAbout, getFeaturedFilms, getSelectedWork } from "@/lib/public";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [h, slides, work, about, films, socials] = await Promise.all([
    getHomepageSettings(), getActiveHeroSlides(), getSelectedWork(), getAbout(), getFeaturedFilms(), getSocials(),
  ]);
  return (
    <>
      {h.hero_enabled && (
        <Hero slides={slides} intervalMs={h.hero_interval_ms} autoplay={!!h.hero_autoplay}
          label={h.hero_label} title={h.hero_title} description={h.hero_description}
          primary={{ text: h.hero_cta_primary_text, link: h.hero_cta_primary_link }}
          secondary={{ text: h.hero_cta_secondary_text, link: h.hero_cta_secondary_link }}
          locationText={h.hero_location_text} />
      )}
      <SelectedWork items={work} />
      <AboutPreview a={about} />
      <FeaturedFilms items={films} />
      <InstagramSection socials={socials} />
      <ContactCTA />
    </>
  );
}
