# Launch checklist (Phase 7)

Use this before calling production “launch ready.” Hosting details: [deploy-cpanel.md](deploy-cpanel.md), [ADR-008](decisions/ADR-008-hosting.md), SEO: [ADR-007](decisions/ADR-007-spa-seo.md).

## Backups (ops)

- [ ] cPanel **Backup** / **JetBackup** (or host backup) on a **daily** schedule  
- [ ] Periodically download a MySQL dump **offsite** (laptop/cloud)  
- [ ] One-time **restore drill**: restore MySQL into a staging DB and confirm app boots  
- [ ] When S3/R2 is live: enable **versioning** and a sensible lifecycle policy on the bucket  

## Production env

Set on the Node app (cPanel) and keep secrets out of git:

| Variable | Notes |
|----------|--------|
| `WEB_ORIGIN` / `API_ORIGIN` | `https://lms.rushadrazib.com` (same origin SPA+API) |
| `DATABASE_URL` | Production MySQL |
| `JWT_*` | Strong secrets; not the `.env.example` defaults |
| `RESEND_API_KEY` / `EMAIL_FROM` | Verified sending domain |
| `SSLCOMMERZ_*` / `SSLCOMMERZ_IS_LIVE` | Sandbox first, then live |
| `CRON_SECRET` | Daily installment reminder cron (see deploy-cpanel) |
| `S3_*` | When leaving local disk uploads |

### Build-time web env (GitHub Actions)

Vite inlines `VITE_*` at **build** time. Set these as GitHub Actions secrets/vars used by the Deploy workflow `Build` step (not only on the server):

| Variable | Notes |
|----------|--------|
| `VITE_GA_MEASUREMENT_ID` | Optional `G-…`; omit to keep Analytics off |
| `VITE_SITE_URL` | Optional; defaults to `https://lms.rushadrazib.com` |
| `VITE_GSC_VERIFICATION` | Optional Search Console meta token |

## Smoke checks

- [ ] `https://lms.rushadrazib.com/` loads (prerendered marketing home)  
- [ ] `https://lms.rushadrazib.com/api/v1/health` → OK  
- [ ] `https://lms.rushadrazib.com/robots.txt` and `/sitemap.xml`  
- [ ] Public course detail + blog post open  
- [ ] Contact form creates a lead (and email attempt)  
- [ ] Student login / register path works  
- [ ] Admin + teacher portals load behind auth  
- [ ] SSLCommerz sandbox purchase or admin enroll once  

## SEO / Analytics

- [ ] Confirm page titles change per route (View Source or DevTools)  
- [ ] Submit `sitemap.xml` in Google Search Console when ready  
- [ ] Set `VITE_GA_MEASUREMENT_ID` and redeploy; verify a page_view in GA DebugView  
