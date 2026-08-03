# ADR-002: Express layered modules

**Status:** Accepted  
**Date:** 2026-08-03

## Context

NestJS was declined; Express must still scale to Auth, Courses, Batches, Purchases, Teacher, Admin CMS.

## Decision

Structure API as **feature modules** with layers:

`routes → controllers → services → repositories (Prisma)`

Shared: config (Zod env), middleware (auth, validate, rate-limit, errors).

## Consequences

- Clear boundaries without Nest DI complexity  
- Discipline required to avoid fat routes  
