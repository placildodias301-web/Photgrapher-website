import { getSiteSettings } from "@/lib/settings";
import ContactForm from "./ContactForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Contact" };

export default async function Page() {
  const s = await getSiteSettings();
  const wa = s.whatsapp?.replace(/\D/g, "");
  return (
    <div className="mx-auto grid max-w-[1600px] gap-16 px-6 pb-28 pt-36 lg:grid-cols-2 lg:px-12 lg:pt-44">
      <div>
        <p className="mb-4 text-[11px] tracking-[0.35em] text-gold uppercase">Contact</p>
        <h1 className="font-display text-5xl font-light md:text-6xl">Let&apos;s Talk</h1>
        <p className="mt-6 max-w-md leading-relaxed text-paper/75">Tell me a little about your day or project and I&apos;ll get back to you shortly.</p>
        <dl className="mt-12 space-y-6 text-sm">
          {s.phone && <div><dt className="text-[10px] tracking-[0.25em] text-mute uppercase">Phone</dt><dd className="mt-1"><a href={`tel:${s.phone.replace(/\s/g, "")}`} className="hover:text-gold">{s.phone}</a></dd></div>}
          {wa && <div><dt className="text-[10px] tracking-[0.25em] text-mute uppercase">WhatsApp</dt><dd className="mt-1"><a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="hover:text-gold">Message on WhatsApp</a></dd></div>}
          {s.public_email && <div><dt className="text-[10px] tracking-[0.25em] text-mute uppercase">Email</dt><dd className="mt-1"><a href={`mailto:${s.public_email}`} className="hover:text-gold">{s.public_email}</a></dd></div>}
          {s.location && <div><dt className="text-[10px] tracking-[0.25em] text-mute uppercase">Based in</dt><dd className="mt-1">{s.maps_url ? <a href={s.maps_url} target="_blank" rel="noopener noreferrer" className="hover:text-gold">{s.location}</a> : s.location}</dd></div>}
        </dl>
      </div>
      <ContactForm />
    </div>
  );
}
