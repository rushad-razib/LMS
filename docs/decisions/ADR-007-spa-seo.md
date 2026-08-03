# ADR-007: SPA routing and SEO

**Status:** Accepted  
**Date:** 2026-08-03

## Decision

- React Router for app routes  
- Per-route meta via `react-helmet-async` (or equivalent)  
- Sitemap generation + prerender for key marketing routes (plugin or build step) where practical  
- Google Analytics / Search Console hooks at launch  

## Consequences

- SEO weaker than Next.js SSR by default; mitigated with prerender on public pages  
- Dashboards remain client-only (fine)  
