# SEO operator guide

Practical guide for the SEO team: what this LMS exposes for search, what you control through content/admin, and example workflows.

Related: [Company user guide](09-company-user-guide.md) · [ADR-007 SPA SEO](decisions/ADR-007-spa-seo.md) · [Launch checklist](08-launch-checklist.md)

There is **no admin “SEO settings” screen**. SEO is driven by page components, published content, env vars, and deploy-time prerender.

---

## What is automatic vs what you control

| Area | Automatic | You control |
|------|-----------|-------------|
| Page titles & meta descriptions | Wired per route via the `Seo` component | Course title/description, blog title/excerpt, and (for static marketing pages) copy changes require a code/content update |
| Canonical URLs | Built from `VITE_SITE_URL` + path | Correct `VITE_SITE_URL` at build time |
| Open Graph / Twitter | Title, description, optional image | Course/blog **cover images** become social images on detail pages |
| `robots.txt` | Shipped with the web app | Paths are fixed (see below); changing them needs a deploy |
| Sitemap | `GET /sitemap.xml` from the API | Publishing courses/posts adds URLs; set `WEB_ORIGIN` |
| Prerendered HTML | Build script snapshots key marketing routes | Content on those pages after next deploy |
| Analytics | GA4 when `VITE_GA_MEASUREMENT_ID` is set | Measurement ID + redeploy |
| Search Console verification | Meta tag when `VITE_GSC_VERIFICATION` is set | Token + redeploy |

**Site name in browser title / OG** uses the app default (`AR Visionary Academy`), not Admin → Settings site name. Settings branding (logos, display name, copyright) affects the visible header/footer only.

---

## Content levers (day-to-day SEO work)

### Courses (highest commercial value)

Admin → Courses:

1. Clear **title** (becomes page title / OG title on `/courses/{slug}`).
2. Stable **slug** — lowercase kebab-case, e.g. `web-development-fundamentals` not `Course 1`.
3. Strong **description** (used as meta description when the course detail page renders).
4. High-quality **cover image** (also used for Open Graph / Twitter when present).
5. Set status to **published** — unpublished courses do **not** appear in the sitemap or public catalog.

**Example**

| Field | Weak | Better |
|-------|------|--------|
| Title | Course | IELTS Academic Preparation — 8-week batch |
| Slug | `course-3` | `ielts-academic-preparation` |
| Description | Good course | Master IELTS Academic reading, writing, listening, and speaking with weekly mocks and feedback. |
| Cover | Missing | Branded course hero (JPEG/PNG/WebP ≤ 2MB) |

After publish, open `https://YOUR_DOMAIN/sitemap.xml` and confirm `/courses/ielts-academic-preparation` is listed.

### Blog posts

Admin → Blog:

1. Keyword-aware **title** and **slug**.
2. **Excerpt** — used as meta description on the post page.
3. **Cover** — social share image.
4. Toggle **Published** — only published posts join the sitemap and public blog index.

**Example workflow — new article**

1. Create post: title `5 skills freelancers need in 2026`, slug `freelance-skills-2026`, write excerpt + body, upload cover.
2. Publish.
3. Visit `/blog/freelance-skills-2026` and View Source (or DevTools → Elements) to confirm `<title>` and `meta name="description"`.
4. Check `/sitemap.xml` includes the new URL.
5. In Google Search Console → URL Inspection → **Request indexing** (optional, for priority pages).

### Trainers, gallery, contact

- Trainer names/bios and gallery images support brand SERP richness but do not have per-item meta editors.
- Contact page meta is fixed in code; keep phone/email/address accurate in **Settings** so on-page content matches local SEO expectations.

### Static marketing pages

Home, About, FAQ, Privacy, Terms use fixed `Seo` titles/descriptions in the web app. Changing that copy/meta requires a frontend change and deploy (not an admin field).

---

## robots.txt

File: `apps/web/public/robots.txt` (served at `/robots.txt`).

- **Allow:** `/` (marketing site)
- **Disallow:** `/admin`, `/teacher`, `/student`, auth flows (`/login`, `/register`, password/verify routes), `/checkout/`
- **Sitemap:** points at `https://lms.rushadrazib.com/sitemap.xml` (update if the production host changes and redeploy)

Auth, portals, and checkout are also marked `noindex` in the app so they should not compete with marketing pages.

---

## Sitemap (`/sitemap.xml`)

Generated dynamically by the API. Includes:

**Always**

`/`, `/about`, `/courses`, `/trainers`, `/gallery`, `/blog`, `/contact`, `/faq`, `/privacy`, `/terms`

**When published**

- `/courses/{slug}` for each published course  
- `/blog/{slug}` for each published blog post  

Origin comes from `WEB_ORIGIN` (API runtime). Keep it equal to the public HTTPS site.

**Example check**

```text
curl -sS https://lms.rushadrazib.com/sitemap.xml | head
```

You should see an XML `urlset` with `<loc>` entries for static paths and any published courses/posts.

---

## Prerender vs SPA routes

On production build, Puppeteer prerenders these marketing routes into static HTML under `dist/`:

`/`, `/about`, `/courses`, `/trainers`, `/gallery`, `/blog`, `/contact`, `/faq`, `/privacy`, `/terms`

Crawlers and social bots get real HTML for those URLs without waiting on JS.

**Not prerendered:** `/courses/:slug` and `/blog/:slug`. Those still set meta via the client `Seo` component after data loads. Prefer strong titles/excerpts/covers so crawlers that execute JS (and social scrapers that follow OG tags) still get good signals. Submit important detail URLs in Search Console when needed.

---

## Google Search Console & Analytics

### Search Console

1. Obtain the HTML tag verification token.
2. Set `VITE_GSC_VERIFICATION` in GitHub Actions and **redeploy**.
3. Confirm the `google-site-verification` meta appears on the live site.
4. Submit `https://YOUR_DOMAIN/sitemap.xml` as the sitemap.
5. Use URL Inspection for new course/blog URLs after publish.

### Google Analytics 4

1. Create a GA4 property → copy Measurement ID (`G-…`).
2. Set `VITE_GA_MEASUREMENT_ID` and redeploy.
3. Verify SPA `page_view` events in DebugView while clicking between `/courses` and `/blog`.

Leave the variable empty to keep analytics off.

---

## Indexing rules of thumb

| URL type | Indexed? |
|----------|----------|
| Marketing pages, published courses/blog | Yes (default) |
| Login, register, password, verify email | `noindex` + robots Disallow |
| Admin / teacher / student portals | `noindex` + robots Disallow |
| Checkout result pages | `noindex` |
| Unpublished course/blog | Not in public list or sitemap |

---

## Example monthly SEO checklist

1. Publish 1–2 blog posts with unique titles, slugs, excerpts, covers.
2. Review course titles/descriptions/slugs for clarity; fix thin copy.
3. Confirm new URLs appear in `/sitemap.xml`.
4. In GSC, check Coverage / Pages for errors; request indexing for priority URLs.
5. In GA4, confirm traffic to `/courses` and top course detail paths.
6. Spot-check Open Graph with a debugger (e.g. Facebook Sharing Debugger or similar) on one course and one blog URL — cover image should appear when set.

---

## Quick troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| New course missing from sitemap | Not published, or `WEB_ORIGIN` wrong |
| Wrong domain in sitemap/canonicals | Fix `WEB_ORIGIN` (API) and/or `VITE_SITE_URL` (build) and redeploy |
| GA not firing | Empty `VITE_GA_MEASUREMENT_ID` or build not redeployed |
| GSC verification fails | Token not in build env, or old deploy still live |
| Social share has no image | Missing course/blog cover upload |
| Auth pages appearing in search | Unusual — confirm `robots.txt` and `noindex` on live; request removal in GSC |
