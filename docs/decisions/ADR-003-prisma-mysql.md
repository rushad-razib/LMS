# ADR-003: Prisma + MySQL

**Status:** Accepted (supersedes PostgreSQL choice)  
**Date:** 2026-08-03  
**Updated:** 2026-08-03 — switched to MySQL for local/ops familiarity

## Context

Relational LMS domain (users, courses, batches, enrollments, orders). Originally planned PostgreSQL; team prefers MySQL for day-to-day comfort.

## Decision

**MySQL** with **Prisma** ORM (`provider = "mysql"`).

Connection via `DATABASE_URL`, e.g. `mysql://USER:PASSWORD@localhost:3306/lms`.

## Consequences

- Strong fit for relational LMS data  
- Enums and migrations supported via Prisma  
- Slightly fewer advanced SQL features than Postgres (acceptable for v1)  
- Daily MySQL dumps for backups (ADR-008)  
