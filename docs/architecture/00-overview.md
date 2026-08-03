# Architecture Overview

**Status:** Draft

## System context

```text
[Browser: Vite React SPA]
        |  HTTPS JSON/REST
        v
[Express API on VPS]
        |
        +-- PostgreSQL
        +-- File storage (disk or S3-compatible)
        +-- SMTP / email provider
        +-- Payment provider (if gateway chosen in Round 2)
```

## Product shape

Single-vendor LMS: public register → buy/enroll → gated course materials.

## Applications

| App | Role |
|-----|------|
| `apps/web` | Public site, student portal, admin UI |
| `apps/api` | Auth, business logic, persistence, uploads |
| `packages/shared` | Shared Zod schemas, types, constants |

## API style

- REST JSON under `/api/v1/...`
- Validation at boundary (Zod)
- Central error middleware
- Role guards on protected routes

## Express layering (per module)

```text
routes → controllers → services → repositories (Prisma) → PostgreSQL
```

Cross-cutting: `config`, `middleware` (auth, validate, rate-limit, error), `common/errors`.

## Security (draft)

- HTTPS / SSL at reverse proxy
- Password hashing (bcrypt/argon2)
- JWT access + httpOnly refresh cookie (pending ADR-004)
- CORS locked to SPA origin
- Rate limit login and public forms

## Related docs

- [01-monorepo-structure.md](01-monorepo-structure.md)
- [../decisions/](../decisions/)
