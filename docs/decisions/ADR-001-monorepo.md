# ADR-001: Monorepo with pnpm and Turborepo

**Status:** Accepted  
**Date:** 2026-08-03

## Context

Need one codebase for Vite React SPA, Express API, and shared types, with independent deploy targets.

## Decision

Use a **pnpm workspaces + Turborepo** monorepo:

- `apps/web` — Vite + React SPA  
- `apps/api` — Express + Prisma  
- `packages/shared` — Zod schemas, types, constants  

## Consequences

- Shared DTOs stay in sync  
- Web and API still deploy separately (static vs VPS)  
- Slightly more tooling setup than dual repo  
