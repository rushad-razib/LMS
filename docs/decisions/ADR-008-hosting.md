# ADR-008: Hosting, SSL, backups

**Status:** Accepted  
**Date:** 2026-08-03

## Decision

- `apps/web` static build → Vercel or CDN/nginx  
- `apps/api` + MySQL on **VPS** behind nginx with **SSL** (Let's Encrypt)  
- Daily MySQL backups (cron + offsite copy)  
- S3 versioning/lifecycle as available  

## Consequences

- CORS and cookie domains must be configured for split hosts  
- Ops runbook needed for restore drills  
