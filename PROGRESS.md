# Build progress

Status against the 16-phase build order. "Tested" means exercised end-to-end against a real
MySQL 8 instance and a production build (`next build` + `next start`) with real seeded content —
manual curl/browser runs, **not yet an automated test suite**.

## Done and tested
- **Phase 1 – Setup:** Next.js 16 / TS / Tailwind, folder structure, `.env.example`, npm scripts.
- **Phase 2 – Database:** full 22-table schema (`db/schema.sql`) with FKs, indexes, constraints, seed
  content. A completely fresh checkout (`mysql < db/schema.sql`, no manual steps) was verified to produce
  a correctly seeded database.
- **Phase 3 – Auth:** username + password login, bcrypt (cost 12), DB-backed revocable sessions, HttpOnly/
  SameSite/Secure cookies, login rate limiting (per-IP and per-username), logout invalidates server-side,
  change password (signs out other devices), change username/display name/recovery email, **forgot/reset
  password by email** with expiring single-use tokens, identical error for wrong password vs. unknown user,
  forged cookies rejected.
- **Phase 4 – Dashboard:** guarded layout, full sidebar matching the spec's section 63, header with
  notification bell + "View website", overview with real stats (now clickable), recent enquiries, activity
  log, recent uploads, website status.
- **Phase 5 – Media:** storage abstraction (local dev provider, streamed to disk so large video uploads
  don't sit in memory), image + video validation, dimensions via sharp, uploads served through a route
  handler with **HTTP Range support** (video seeking), path-traversal blocked, in-use check so a file
  referenced anywhere is never deleted, and a full **Media Library** (search, filter by type/usage,
  preview, delete-if-unused).
- **Phase 6 – Branding & site-wide:** name, description, copyright, accent colour, logo, favicon,
  maintenance mode, **Navigation CMS** (add/rename/reorder/hide/delete menu items, internal or external
  links), **Footer CMS**, **Social & Contact CMS** (any platform, not just Instagram/YouTube/Facebook) with
  phone/WhatsApp/email/location/maps link.
- **Phase 7 – Homepage hero:** multi-upload with progress, replace, delete, reorder, show/hide, interval
  3–8s (server-validated), autoplay, all hero text/buttons editable. Public slideshow: crossfade, slow
  zoom, parallax, GSAP intro, reduced-motion support, pauses when tab hidden, first image preloaded.
- **Phase 8 – Categories & shoots/projects:** dynamic categories (add/rename/reorder/hide/delete);
  shoots created from the dashboard with cover + multi-upload gallery, auto-generated unique slugs, and
  **no React page written by hand** — publishing a shoot makes `/portfolio/<slug>` exist automatically.
- **Phase 9 – Portfolio/stories/photos:** editorial masonry portfolio grid with category filters and
  "Load more" (React Server Action), full-screen **lightbox** (keyboard nav, swipe, focus trap, neighbour
  preloading), per-shoot detail pages, Stories (albums) with the same cover+gallery engine and an
  alternating editorial layout, a cross-project **Photos** manager, gallery reordering/replace/set-as-cover
  per photo.
- **Phase 10 – Films/videos:** upload (MP4/WebM/MOV up to 500MB, streamed to disk) with thumbnail, category/
  location/date, publish/feature, edit, delete; public Films page with click-to-play (no autoplay).
- **Phase 11 – About/Services/Social/Footer:** About page + CMS (photo, name, title, bio, quote), Services
  CMS (add/edit/reorder/photo/publish) and public page, Social & Contact and Footer as above.
- **Phase 12 – Enquiries & replies:** public contact form (honeypot + rate-limited), dashboard enquiry list
  with all 8 statuses and filters, conversation view, **real SMTP replies** (threaded via Message-ID/
  References/In-Reply-To), status auto-updates to Replied, and an **inbound-email webhook** so a
  configured provider can deliver the customer's reply back into the same conversation.
- **Phase 13 – Notifications:** a real 🔔 bell (polls + refreshes on focus, unread badge), dropdown +
  full-page view, mark-as-read/mark-all/delete/delete-all-read, "open related item" navigates to the
  right enquiry/shoot/settings page. Every action elsewhere in the app writes one of these.
- **Phase 14 – Animation:** GSAP hero intro, scroll-reveals across homepage sections (`Reveal`), a subtle
  desktop-only custom cursor that becomes "VIEW" over photos, per-page fade transition, all governed by
  `prefers-reduced-motion`.
- **Phase 15 – SEO/performance/accessibility:** dynamic `sitemap.xml` and `robots.txt`, per-page metadata/
  descriptions, `next/image` AVIF/WebP everywhere, masonry grid avoids layout shift, skip-to-content link,
  focus-visible styles, keyboard-operable lightbox and menus, alt text editable on every photo.
- **Phase 16 – Testing:** every route in the spec's own end-to-end checklist (section 66) was actually run
  against real MySQL + a production build: login/logout/username/password/forgot-password, branding/logo/
  favicon, hero upload/reorder/delete/interval, category→shoot→cover→gallery→publish→verify-on-site, About
  photo+bio→verify, social add/reorder/disable→verify, enquiry submit→notification→reply→status→email-sent,
  notifications unread/read/delete, maintenance on/off.

## Known gaps / decisions for you
- **No automated test suite** — everything above was checked by hand this session, not by CI.
- **Email and cloud storage need your credentials.** Without `EMAIL_HOST`/`EMAIL_FROM`, replies and
  password-reset show a clear error instead of failing silently. Local disk storage (`storage/uploads`)
  is fine for development or a single always-on server; move to S3/Cloudinary/R2 for real production
  hosting by implementing `lib/storage/<provider>.ts` — feature code doesn't change.
- **Inbound customer replies need a provider webhook configured** (see README) — until then, replies you
  send work fully, but the customer's follow-up lands in your real inbox rather than the dashboard.
- Hero: only crossfade is implemented (`hero_transition` column exists for future styles); no separate
  mobile-vs-desktop hero images yet.
- Reordering (hero slides, gallery photos, categories, nav, socials) uses ↑/↓ buttons rather than
  drag-and-drop — deliberate, since it works on touch and keyboard without extra libraries, but drag-and-
  drop could be added later.
- No login/contact-form CAPTCHA — rate limiting + honeypot only.
- The inbound-email "strip quoted text" heuristic is simple (looks for "On ... wrote:" and `>` quote
  markers); some email clients format replies differently and may need a small adjustment.
- Design-system polish (the "premium cinematic" art direction) is a first pass — typography, spacing and
  imagery choices are ready to refine once real photography and copy are in.
