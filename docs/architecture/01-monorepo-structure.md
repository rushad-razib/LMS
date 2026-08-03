# Monorepo Structure (Proposed)

**Status:** Draft — scaffold after docs approval gate

```text
ar-visionary-academy/
  apps/
    web/                      # Vite + React + TS + Tailwind + React Router
      src/
        app/                  # providers, router
        pages/                # public, student, admin pages
        components/
        features/             # feature-oriented UI modules
        lib/                  # api client, auth helpers
        styles/
      index.html
      vite.config.ts
    api/                      # Express + TS + Prisma
      src/
        app.ts
        server.ts
        config/
        modules/
          auth/
          courses/            # catalog + batches + curriculum
          purchases/          # orders + enrollments + batch assign
          teachers/           # teacher batch tools API
          students/
          notices/
          media/
          content/            # blog, gallery, settings, trainers
          contact/
        common/
          middleware/
          errors/
        db/
      prisma/
        schema.prisma
        migrations/
  packages/
    shared/                   # types, zod schemas, constants
      src/
  docs/                       # this documentation tree
  package.json
  pnpm-workspace.yaml
  turbo.json
  .env.example
  README.md
```

## Tooling defaults

- **Package manager:** pnpm workspaces  
- **Task runner:** Turborepo  
- **ORM:** Prisma → MySQL  
- **API validation:** Zod (shared schemas where useful)  

## Deploy mapping

| Package | Artifact | Host |
|---------|----------|------|
| `apps/web` | Static `dist/` | Vercel or nginx/CDN |
| `apps/api` | Node process | VPS behind nginx + SSL |
| MySQL | Managed or VPS | Daily backup (ADR-008) |
