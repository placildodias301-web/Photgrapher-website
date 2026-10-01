import Link from "next/link";
import type { NavItem, SiteSettings, SocialPlatform } from "@/lib/settings";

export default function Footer({ s, nav, socials }: { s: SiteSettings; nav: NavItem[]; socials: SocialPlatform[] }) {
  const wa = s.whatsapp?.replace(/\D/g, "");
  return (
    <footer className="border-t border-line mt-32">
      <div className="mx-auto grid max-w-[1600px] gap-14 px-6 py-20 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-12">
        <div>
          {s.logo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={s.logo_url} alt={s.site_name} className="h-10 w-auto" />
            : <p className="font-display text-3xl font-light">{s.site_name}</p>}
          {(s.footer_description || s.site_description) && <p className="mt-5 max-w-sm text-sm leading-relaxed text-mute">{s.footer_description || s.site_description}</p>}
        </div>
        <div>
          <h2 className="mb-5 text-[11px] tracking-[0.3em] text-gold uppercase">Explore</h2>
          <ul className="space-y-3 text-sm">{nav.map((n) => <li key={n.id}><Link href={n.href} className="text-paper/80 hover:text-gold transition-colors">{n.label}</Link></li>)}</ul>
        </div>
        <div>
          <h2 className="mb-5 text-[11px] tracking-[0.3em] text-gold uppercase">Contact</h2>
          <ul className="space-y-3 text-sm text-paper/80">
            {s.phone && <li><a href={`tel:${s.phone.replace(/\s/g, "")}`} className="hover:text-gold">{s.phone}</a></li>}
            {wa && <li><a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="hover:text-gold">WhatsApp</a></li>}
            {s.public_email && <li><a href={`mailto:${s.public_email}`} className="hover:text-gold">{s.public_email}</a></li>}
            {s.location && <li>{s.maps_url ? <a href={s.maps_url} target="_blank" rel="noopener noreferrer" className="hover:text-gold">{s.location}</a> : s.location}</li>}
          </ul>
        </div>
        <div>
          <h2 className="mb-5 text-[11px] tracking-[0.3em] text-gold uppercase">Follow</h2>
          <ul className="space-y-3 text-sm">
            {socials.map((p) => (
              <li key={p.id}><a href={p.url} target="_blank" rel="noopener noreferrer" className="text-paper/80 hover:text-gold transition-colors">
                {p.platform_name}{p.username ? <span className="text-mute"> · {p.username}</span> : null}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-6 py-6 text-center text-xs text-mute lg:px-12">
        {s.copyright_text || `© ${new Date().getFullYear()} ${s.site_name}. All rights reserved.`}
      </div>
    </footer>
  );
}
