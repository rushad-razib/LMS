# ADR-008: Hosting, SSL, backups

**Status:** Accepted  
**Date:** 2026-08-03  
**Updated:** 2026-08-11

## Decision

- Production host: **cPanel shared server** at `https://lms.rushadrazib.com` (Node.js App + MySQL + Let's Encrypt).
- `apps/web` static build is served by the Express API in production (same origin for cookies).
- Schema changes ship via **Prisma migrate deploy** in GitHub Actions (not ad-hoc `db push` on prod).
- Backups: use cPanel **Backup** / **JetBackup** (or host backup) on a daily schedule; periodically download a MySQL dump offsite.
- S3 versioning/lifecycle when file uploads land.

## Consequences

- Same-origin subdomain avoids split-host CORS/cookie issues.
- Deploy path: `/home/rushadra/lms.rushadrazib.com`; restart via Passenger `tmp/restart.txt`.
- Ops: after schema changes, confirm Actions migrate step succeeded before relying on new tables.
- Restore drill: restore MySQL from cPanel backup into a staging DB at least once.
