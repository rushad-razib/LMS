# ADR-003: Prisma + PostgreSQL

**Status:** Accepted  
**Date:** 2026-08-03

## Context

Relational domain: users, courses, batches, enrollments, orders, sessions.

## Decision

**PostgreSQL** with **Prisma** ORM and migrations.

## Consequences

- Strong transactions for pay → enroll  
- Type-safe queries  
- VPS-friendly backups  
