# Company user guide

Operator guide for AR Visionary Academy LMS — how the system works and what to configure before go-live.

Related: [Launch checklist](08-launch-checklist.md) · [Deploy (cPanel)](deploy-cpanel.md) · [SEO operator guide](10-seo-operator-guide.md)

---

## Next steps (required before launch)

Complete these in order. Secrets stay out of git; copy from [`.env.example`](../.env.example).

### 1. Production environment (API / Node app)

Set these on the server (cPanel Node env or equivalent):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Production MySQL connection string |
| `API_ORIGIN` / `WEB_ORIGIN` | Public site origin, e.g. `https://lms.rushadrazib.com` (same host for SPA + API) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Strong unique secrets (not the example defaults) |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes (defaults in `.env.example` are fine) |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email; verify the sending domain in Resend |
| `SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWORD` / `SSLCOMMERZ_IS_LIVE` | Payments — start with sandbox (`false`), then live |
| `CRON_SECRET` | Protects daily installment-reminder cron |
| `S3_*` (optional) | When leaving local disk uploads: endpoint, bucket, keys, region |
| `APP_NAME` | Display name used in emails / app identity |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Used only for `db:seed` to create the first admin |

Run migrations and seed the admin once on a fresh database (`prisma migrate deploy` + seed).

### 2. Build-time web env (GitHub Actions)

Vite inlines `VITE_*` at **build** time. Set these as Actions secrets/vars used by the Deploy workflow (not only on the server):

| Variable | Purpose |
|----------|---------|
| `VITE_SITE_URL` | Canonical public URL for SEO (defaults to production host if omitted) |
| `VITE_GA_MEASUREMENT_ID` | Optional GA4 `G-…`; leave empty to disable analytics |
| `VITE_GSC_VERIFICATION` | Optional Google Search Console meta verification token |

After changing any `VITE_*` value, **redeploy** so the new build picks them up.

### 3. First-day product setup

1. Log in as admin → open **Settings**.
2. Set **site name**, **header logo**, **footer logo**, and **footer copyright** (branding).
3. Fill contact phone, email, WhatsApp, address, hours, map embed, announcement bar.
4. Create at least one **published course** (title, slug, price, cover).
5. Create a **batch** for that course and assign a **teacher** (admin creates teacher accounts).
6. Smoke-test: public home, course detail, contact form → lead, student register/login, checkout (sandbox) or office enroll.

Full ops checklist: [08-launch-checklist.md](08-launch-checklist.md).

---

## Roles overview

| Role | Who | Main portal |
|------|-----|-------------|
| Visitor | Anyone browsing the marketing site | Public pages |
| Student | Registered buyer / learner | `/student` |
| Teacher | Staff created by admin | `/teacher` |
| Admin | Site operators | `/admin` |

---

## Public website

Marketing pages: Home, About, Courses (+ detail), Trainers, Gallery, Blog (+ detail), Contact, FAQ, Privacy, Terms.

- Visitors can browse the catalog, register, log in, and submit the contact form (creates a **lead**).
- Course purchase goes through SSLCommerz; success/fail return on checkout result pages.
- Branding (logos, site name, copyright) and contact details come from **Admin → Settings**.
- Site name in the header/footer is editable; if a logo is missing, the site name text is shown instead.
- SEO titles/descriptions for core pages are built into the app; course/blog detail use content you enter. See the [SEO operator guide](10-seo-operator-guide.md).

**Note:** Document titles and the default brand string used in SEO meta still use the code default (`AR Visionary Academy`) / `VITE_SITE_URL`. Visible header/footer branding is controlled from Settings.

---

## Students

1. Register → verify email if Settings has verification enabled.
2. Browse courses → purchase (online) or wait for admin **office enroll**.
3. After enrollment and batch assignment: open **Student portal** for materials, live sessions, batch announcements, notices, orders, and profile.

Installments (if used) send reminder emails via the nightly cron (`CRON_SECRET`).

---

## Teachers

Teachers do **not** self-register. Admin creates the account and assigns them to batches.

In the teacher portal they can:

- View assigned batches
- Upload materials
- Post batch announcements
- Schedule live sessions (Meet/Zoom links)
- Manage their profile photo and CV

---

## Admin features

### Courses & batches

- Create/edit courses (title, slug, description, price, cover image, publish status).
- Create batches under a course; assign a teacher; manage schedule/capacity as designed.
- Cover images use the shared media uploader (PNG/JPEG/WebP, max 2MB → stored as WebP).

### Orders & enrollments

- See payment orders and enrollment status.
- **Office enroll** a student without online checkout when needed.
- Manage installments where applicable.

### Users

- List students/teachers; create teachers; support password/email flows as implemented in Auth.

### CMS

| Area | What you manage |
|------|-----------------|
| Blog | Posts with title, slug, excerpt, HTML body, cover, publish toggle |
| Gallery | Image items with optional title / sort order |
| Trainers | Marketing trainer profiles + photos |
| Notices | Global notices for portals |
| Leads | Contact-form submissions |

### Settings (`/admin/settings`)

| Section | Fields |
|---------|--------|
| Account policy | Require email verification |
| Branding | Site name, header logo, footer logo, footer copyright (textarea — you control year and wording) |
| Marketing | Announcement bar |
| Contact | Phone, email, WhatsApp, address, business hours, map embed HTML |
| Social | Facebook, Instagram, YouTube URLs |

Logos upload immediately when you pick a file; other fields save with **Save**. Prefer transparent PNG or WebP logos; SVG is not supported.

### Dashboard

KPI overview of the academy (orders, enrollments, etc.).

---

## Media & storage

Uploads (covers, logos, gallery, trainer/teacher photos) go through the media service:

- Local disk under `apps/api/uploads` when S3 is not configured
- S3-compatible storage when `S3_*` is set

Signed download URLs are refreshed when settings/courses are read so logos and covers keep working.

---

## Email & payments

- **Resend** — verification, password flows, batch assignment, announcements, installment reminders.
- **SSLCommerz** — student checkout. Keep `SSLCOMMERZ_IS_LIVE=false` until sandbox is verified.

---

## Out of scope (v1)

Admissions pipeline, Zoom SDK embedding, exams/certificates, multi-vendor marketplace, and public teacher signup are not part of this product version.
