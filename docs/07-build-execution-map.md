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
**Status:** Complete  
**Deliverable:** Admin CRUD courses/batches; one teacher per batch; public course list/detail (Buy button stub)

- Course outline text, price BDT  
- Batch assign/reassign teacher  
- Public catalog pages (light)  

**Checkpoint:** Seed 6 courses (`pnpm db:seed:courses`); admin creates batch + assigns teacher.

**Tests:** `apps/api/src/modules/courses/courses.phase2.test.ts` (+ Phase 1 auth suite) — `pnpm test:api`

### Admin UX — DataTable + create modals
**Status:** Complete  
**Deliverable:** Admin index lists use shared `DataTable` + create `Modal` pattern (TanStack Table)

- Shared: `Modal`, `DataTable`, `PageHeader` under `apps/web/src/components/`
- Routes: `/admin/courses`, `/admin/courses/:id`, `/admin/batches`, `/admin/users`
- `GET /auth/admin/users` for Users table; Settings remains a form page
- Teacher portal reuses these components in Phase 5

### Phase 3 — Purchases & enrollment
**Status:** Complete  
**Deliverable:** SSLCommerz checkout + Admin office enroll; enrollment awaiting batch

- Online order channel + IPN/idempotency  
- Admin enroll with payment method note  
- Assign/reassign student → batch + email  
- When adding `Order` / `Enrollment`, **block admin student delete** with `409 ACCOUNT_HAS_ENROLLMENTS` if those rows exist (see [auth-and-accounts.md](modules/auth-and-accounts.md) locked decision 14)  

**Checkpoint:** Test pay (sandbox) and admin enroll both create enrollments; batch assign emails.

**Tests:** `apps/api/src/modules/purchases/purchases.phase3.test.ts` — `pnpm test:api`

### Phase 4 — Student portal
**Status:** Complete  
**Deliverable:** My Courses, awaiting-batch state, materials / announcements / live sessions (read)

- Light `StudentLayout`  
- Gating: no cohort content until `batchId` set  
- Nested routes per [student-portal.md](modules/student-portal.md); `/student/notices` added in Phase 6  

**Checkpoint:** Assigned student sees sessions + materials; unassigned does not.

**Tests:** `apps/api/src/modules/students/students.phase4.test.ts` — `pnpm test:api`

**Seed (optional demo content):** `pnpm --filter @arva/api db:seed:batch-content`

### Phase 5 — Teacher portal
**Status:** Complete  
**Deliverable:** Dark dashboard; sessions CRUD; materials upload (S3+WebP); announcements + email

- Reuses `DashboardLayout`  
- Scoped to assigned batches only  

**Checkpoint:** Teacher posts session + announcement; students see + get email.

**Tests:** `apps/api/src/modules/teachers/teachers.phase5.test.ts` — `pnpm test:api`

### LMS revision (post Phase 5)
**Status:** Complete  
**Deliverable:** Course covers, batch seats/mode/dates, admin installments, student detail access control

- Course cover image upload (WebP) on admin + public catalog  
- Batch `deliveryMode`, `seatCapacity`, optional start/end dates; seat hard cap on assign/enroll  
- Admin office enroll: Full | 3-month | 6-month installments; dues + mark paid  
- `/admin/students/:userId` — installment dues, `accessBlocked` toggle  
- Installment reminder cron: `POST /api/v1/internal/installment-reminders`  
- UI polish (non-blocking): shared `PasswordField`, form error helpers  

**Checkpoint:** Admin enrolls with installments; student detail shows dues; full batch respects seats.

**Tests:** `apps/api/src/modules/purchases/purchases.revision.test.ts` — `pnpm test:api`

### Phase 6 — Admin CMS & contact
**Status:** Complete  
**Deliverable:** Blog (rich text), gallery, notices, settings, contact leads, media service

- TipTap editor → sanitized HTML body; CMS image uploads via shared media service  
- Extended website settings (contact/social/map/announcement bar); secrets remain env-only  
- Public: blog, gallery, trainers, contact + static about/faq/privacy/terms  
- Student `/student/notices`; admin leads list + mark read  

**Checkpoint:** Contact form → Lead + Resend; blog publish on public site.

**Tests:** `apps/api/src/modules/content/content.phase6.test.ts` — `pnpm test:api`

### Phase 7 — Hardening & launch prep
**Status:** Complete  
**Deliverable:** SPA meta/prerender where planned, Analytics hooks, backup notes, launch checklist pass

- Per-route meta via `react-helmet-async` (`Seo` helper); portals/auth/checkout `noindex`  
- Static marketing prerender after Vite build (`apps/web/scripts/prerender.mjs`)  
- Env-gated GA (`VITE_GA_MEASUREMENT_ID`) + optional GSC meta; `public/robots.txt`  
- Dynamic `GET /sitemap.xml` (static routes + published courses/blog)  
- Ops: [08-launch-checklist.md](08-launch-checklist.md)  

**Checkpoint:** `/sitemap.xml` lists public URLs; prerendered marketing HTML in `apps/web/dist`; GA stays off until measurement ID is set at build time.

**Tests:** `apps/api/src/modules/seo/seo.phase7.test.ts` — `pnpm test:api`

---

## What waits until after initial build

- Final **theme color** refinement (dark admin/teacher, light public/student)  
- Real copy, logos, trainer photos  
- Production SSLCommerz / Resend / S3 credentials  
- Complete [08-launch-checklist.md](08-launch-checklist.md) ops items (backups, restore drill, live credentials)  

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
