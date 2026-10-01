# PASCOAL Photography — website + private CMS

Next.js (App Router) · React · TypeScript · Tailwind · MySQL · GSAP.
See `PROGRESS.md` for exactly what is built, tested, and still to do.

## Requirements
- Node.js 20+ and npm
- MySQL 8+ (MySQL Workbench is fine for managing it)

## Setup (Windows / VS Code)

1. **Create the database.** In MySQL Workbench open `db/schema.sql` and run it (lightning-bolt icon).
   This creates the `pascoal_photography` database, all tables, and starter content
   (nav items, categories, hero text, Instagram link, Pascoal's phone number).
2. **(Recommended) create a dedicated DB user** instead of using `root`:
   ```sql
   CREATE USER 'pascoal_app'@'localhost' IDENTIFIED BY 'choose-a-strong-password';
   GRANT ALL ON pascoal_photography.* TO 'pascoal_app'@'localhost';
   ```
3. **Configure the app.** Copy `.env.example` to `.env.local` and fill in:
   - `DB_USER` / `DB_PASSWORD` from step 2
   - `AUTH_SECRET` — generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `SEED_ADMIN_PASSWORD` — the first dashboard password (10+ characters)
4. **Install and create the admin account:**
   ```
   npm install
   npm run seed:admin
   npm run dev
   ```
5. Open http://localhost:3000 (site) and http://localhost:3000/login (dashboard).
   Username: `pascoal` (or `SEED_ADMIN_USERNAME`). **Change the password in
   Settings → Account & Security straight away, then remove `SEED_ADMIN_PASSWORD` from `.env.local`.**

Fonts (Cormorant Garamond, Inter) are fetched from Google Fonts at build/dev time, so the first run needs internet.

## Optional: email (enquiry replies + password reset)
Without `EMAIL_HOST`/`EMAIL_FROM` set, the site works normally except:
- The "Send reply" button on an enquiry shows an error instead of sending.
- "Forgot password" shows an error instead of emailing a reset link.

To enable it, fill in `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` (any SMTP
provider — e.g. an app password from your own mailbox, or a transactional service like Postmark/SES/SendGrid's
SMTP endpoint) and set `SITE_URL` to your real domain in production.

## Optional: customer replies appear in the enquiry timeline
By default, replying to an enquiry sends a real email, but the customer's reply back only becomes visible
in the dashboard if something forwards it to `POST /api/webhooks/inbound-email` with header
`x-webhook-secret: <INBOUND_EMAIL_SECRET>` and body `{ from, subject, text, messageId, inReplyTo, references }`.
Most transactional email providers (Postmark inbound, Mailgun routes, SendGrid inbound parse) can call a URL
like this directly — point it at `https://yourdomain.com/api/webhooks/inbound-email`. Until that's set up,
you'll still see and reply to enquiries normally; you just won't see the customer's follow-up in-app (it'll
land in your own inbox as a normal email reply).

## Notes
- No email address has been supplied, so none is stored. Set the recovery email in Account & Security,
  and the public contact email in Website → Social & Contact.
- Uploads go to `storage/uploads/` in development (never committed). Storage sits behind
  `lib/storage/index.ts`, so S3 / Cloudinary / R2 can be added as a new provider without touching feature code.
  **Local disk storage is for development / a single always-on server. Use cloud storage for production hosting.**
- Cookies are `Secure` in production, so production must be served over HTTPS.
- `.env.local` and `storage/` are git-ignored. Never commit secrets.
