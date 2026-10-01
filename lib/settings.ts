import { query, queryOne } from "@/lib/db";

export type SiteSettings = {
  site_name: string;
  site_description: string | null;
  copyright_text: string | null;
  footer_description: string | null;
  accent_color: string | null;
  public_email: string | null;
  phone: string | null;
  whatsapp: string | null;
  location: string | null;
  maps_url: string | null;
  maintenance_mode: number;
  logo_url: string | null;
  favicon_url: string | null;
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await queryOne<SiteSettings>(
    `SELECT s.site_name, s.site_description, s.copyright_text, s.footer_description, s.accent_color,
            s.public_email, s.phone, s.whatsapp, s.location, s.maps_url, s.maintenance_mode,
            lm.file_url AS logo_url, fm.file_url AS favicon_url
       FROM site_settings s
       LEFT JOIN media lm ON lm.id = s.logo_media_id
       LEFT JOIN media fm ON fm.id = s.favicon_media_id
      WHERE s.id = 1`
  );
  return (
    row ?? {
      site_name: "PASCOAL Photography", site_description: null, copyright_text: null, footer_description: null,
      accent_color: null, public_email: null, phone: null, whatsapp: null, location: null,
      maps_url: null, maintenance_mode: 0, logo_url: null, favicon_url: null,
    }
  );
}

export type NavItem = { id: number; label: string; href: string };
export async function getNavigation(): Promise<NavItem[]> {
  return query<NavItem>(
    `SELECT id, label, href FROM navigation_items WHERE visible = TRUE ORDER BY display_order, id`
  );
}

export type SocialPlatform = {
  id: number; platform_name: string; url: string; username: string | null; icon: string | null;
};
export async function getSocials(): Promise<SocialPlatform[]> {
  return query<SocialPlatform>(
    `SELECT id, platform_name, url, username, icon FROM social_platforms
      WHERE enabled = TRUE ORDER BY display_order, id`
  );
}

export type HomepageSettings = {
  hero_enabled: number; hero_interval_ms: number; hero_autoplay: number; hero_transition: string;
  hero_label: string | null; hero_title: string | null; hero_description: string | null;
  hero_cta_primary_text: string | null; hero_cta_primary_link: string | null;
  hero_cta_secondary_text: string | null; hero_cta_secondary_link: string | null;
  hero_location_text: string | null;
};
export async function getHomepageSettings(): Promise<HomepageSettings> {
  const row = await queryOne<HomepageSettings>(`SELECT * FROM homepage_settings WHERE id = 1`);
  return row!;
}

export type HeroSlide = {
  id: number; alt_text: string | null; url: string; width: number | null; height: number | null;
};
export async function getActiveHeroSlides(): Promise<HeroSlide[]> {
  return query<HeroSlide>(
    `SELECT h.id, h.alt_text, m.file_url AS url, m.width, m.height
       FROM hero_slides h JOIN media m ON m.id = h.media_id
      WHERE h.active = TRUE ORDER BY h.display_order, h.id`
  );
}
