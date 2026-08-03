# AR Visionary Academy — Documentation

Living requirements and architecture for **AR Visionary Academy** (parent: AR Ventures) — single-vendor LMS (Udemy-like).

## How we work

1. Specs live in markdown under `docs/`.
2. Each module is clarified via Q&A → updated → marked **Clarified**, then **Approved**.
3. Architecture decisions are recorded as ADRs in [`decisions/`](decisions/).
4. Application code is scaffolded only after the docs set for a phase is approved.

**Status values:** `Draft` → `Clarified` → `Approved`

## Locked stack

| Layer | Choice |
|-------|--------|
| Frontend | Vite + React SPA + TypeScript + Tailwind CSS + React Router |
| Backend | Express + TypeScript (layered modules) |
| Database | PostgreSQL + Prisma |
| Repo | Monorepo (`apps/web`, `apps/api`, `packages/shared`) |
| Deploy | Static SPA + API/PostgreSQL on VPS |

## Index

| Doc | Purpose |
|-----|---------|
| [01-project-brief.md](01-project-brief.md) | Goals, v1 vs v2, non-goals |
| [02-glossary.md](02-glossary.md) | Domain terms |
| [03-personas-and-roles.md](03-personas-and-roles.md) | Public / Student / Admin |
| [04-sitemap-and-ia.md](04-sitemap-and-ia.md) | Routes and navigation |
| [05-module-index.md](05-module-index.md) | Module status board |
| [06-design-system.md](06-design-system.md) | Brand fonts/colors tokens |
| [open-questions.md](open-questions.md) | Unresolved decisions |
| [architecture/00-overview.md](architecture/00-overview.md) | System overview |
| [architecture/01-monorepo-structure.md](architecture/01-monorepo-structure.md) | Proposed folder layout |
| [modules/](modules/) | Per-module specs |
| [decisions/](decisions/) | Architecture Decision Records |

## Update rules

- Prefer updating an existing doc over scattering notes in chat.
- When a question is resolved, move it from `open-questions.md` into the relevant module/ADR.
- Do not contradict locked stack without a new ADR that supersedes the old one.
