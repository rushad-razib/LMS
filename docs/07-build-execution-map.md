# Build Execution Map

**Status:** Ready to execute (after UI shell confirmation)  
**Docs approval:** [APPROVAL.md](APPROVAL.md)

## Principles

- Build **phase by phase**; each phase ends in a reviewable checkpoint before the next starts  
- One monorepo; implement against approved module docs + ADRs  
- Theme tokens can be adjusted after initial shell (you may supply final dark/light palettes later)  
- No big-bang “entire LMS in one pass”

## UI shell decision (proposed — confirm before Phase 0 UI)

| Surface | Theme | Shell |
|---------|--------|--------|
| Public marketing (`/`, `/courses`, …) | **Light** | Marketing layout (nav/footer) |
| Student portal (`/student/*`) | **Light** (same brand as public) | Student app shell (simpler top/side nav) |
| Admin (`/admin/*`) | **Dark** | **Shared dashboard shell** |
| Teacher (`/teacher/*`) | **Dark** | **Same dashboard shell** as Admin; different sidebar items via role |

**Rationale:** Admin and Teacher are staff tools (CRUD, batches, sessions). Sharing one dark dashboard layout avoids duplicating chrome while keeping routes and permissions separate. Student stays on the light “product” side with learners, not operators.

Single SPA (`apps/web`) — not three separate frontends. Route guards enforce `ADMIN` / `TEACHER` / `STUDENT`.

```text
apps/web
  layouts/
    MarketingLayout      # light
    StudentLayout        # light
    DashboardLayout      # dark — used by Admin + Teacher
  pages/admin/*
  pages/teacher/*
  pages/student/*
  pages/public/*
```

---

## Phase map

```text
Phase 0  Scaffold + design tokens
Phase 1  Auth + users + verification
Phase 2  Courses + batches + teachers assignment
Phase 3  Purchases (SSLCommerz) + Admin enroll
Phase 4  Student portal (batch-gated content)
Phase 5  Teacher portal (sessions, materials, announcements)
Phase 6  Admin CMS (content, settings, leads)
Phase 7  Hardening (SEO, Analytics, backups checklist)
```

### Phase 0 — Scaffold & foundations
**Status:** Complete (2026-08-03)  
**Deliverable:** Monorepo runs locally; empty layouts; shared package; Prisma stub; `.env.example`

- pnpm + Turborepo: `apps/web`, `apps/api`, `packages/shared`  
- Vite React + Tailwind + React Router  
- Express layered folder skeleton  
- Prisma + MySQL connection stub (`User` model)  
- Design tokens: light (public/student) + dark (dashboard) — editable in `apps/web/src/styles/tokens.css`  
- Shared `DashboardLayout` wired to `/admin` and `/teacher` stubs  

**Checkpoint:** `pnpm dev` brings up web + api; `GET /api/v1/health` OK.

### Phase 1 — Auth & accounts
**Status:** Complete (MySQL `lms` schema pushed + admin seeded)  
**Deliverable:** Register / login / logout / password reset / email verification / role guards

- JWT + refresh cookie  
- STUDENT register + verification (Resend) + Settings toggle  
- Admin bootstrap + create Admin / Teacher / Student  
- Route guards for three portals  

**Checkpoint:** Verified student reaches `/student`; unverified blocked when toggle ON; admin/teacher gates work.

**Tests:** `apps/api/src/modules/auth/auth.phase1.test.ts` — run `pnpm test:api`

### Phase 2 — Courses, batches, teacher assignment
**Deliverable:** Admin CRUD courses/batches; one teacher per batch; public course list/detail (Buy button stub)

- Course outline text, price BDT  
- Batch assign/reassign teacher  
- Public catalog pages (light)  

**Checkpoint:** Seed 6 courses; admin creates batch + assigns teacher.

### Phase 3 — Purchases & enrollment
**Deliverable:** SSLCommerz checkout + Admin office enroll; enrollment awaiting batch

- Online order channel + IPN/idempotency  
- Admin enroll with payment method note  
- Assign/reassign student → batch + email  

**Checkpoint:** Test pay (sandbox) and admin enroll both create enrollments; batch assign emails.

### Phase 4 — Student portal
**Deliverable:** My Courses, awaiting-batch state, materials / announcements / live sessions (read)

- Light `StudentLayout`  
- Gating: no cohort content until `batchId` set  

**Checkpoint:** Assigned student sees sessions + materials; unassigned does not.

### Phase 5 — Teacher portal
**Deliverable:** Dark dashboard; sessions CRUD; materials upload (S3+WebP); announcements + email

- Reuses `DashboardLayout`  
- Scoped to assigned batches only  

**Checkpoint:** Teacher posts session + announcement; students see + get email.

### Phase 6 — Admin CMS & contact
**Deliverable:** Blog (rich text), gallery, notices, settings, contact leads, media service

- `emailVerificationRequired` toggle  
- Secrets remain env-only  

**Checkpoint:** Contact form → Lead + Resend; blog publish on public site.

### Phase 7 — Hardening & launch prep
**Deliverable:** SPA meta/prerender where planned, Analytics hooks, backup notes, launch checklist pass

---

## What waits until after initial build

- Final **theme color** refinement (dark admin/teacher, light public/student)  
- Real copy, logos, trainer photos  
- Production SSLCommerz / Resend / S3 credentials  

## How each phase runs with you

1. Implement phase  
2. Short demo / review notes  
3. You feedback (including theme tweaks anytime after Phase 0)  
4. Next phase  

## Testing

- Runner: **Vitest** (+ Supertest for API)
- Phase 0: no tests (scaffold only)
- Each feature phase adds regression tests under the relevant package
- Command: `pnpm test` or `pnpm test:api`

Say **confirm shell** (shared dark Admin+Teacher, light Student+public) to start **Phase 0**.
