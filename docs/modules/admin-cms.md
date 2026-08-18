# Module: Admin CMS

**Status:** Clarified (Round 3) · Admin list UX pattern adopted

## Admin list UX pattern

Admin **index** pages (courses, batches, users, and later orders/CMS) follow:

1. `PageHeader` — title + primary **Create** action  
2. `DataTable` (`@tanstack/react-table`) — search, sortable columns, row actions  
3. `Modal` — create and edit forms; on success close + refresh  

Shared components: `apps/web/src/components/{PageHeader,DataTable,Modal}.tsx`.  
Settings stays a form page (not a list). Teacher portal reuses the same primitives in Phase 5.

## Modules

- Dashboard  
- Students (create, resend verification, enroll)  
- Teachers (create, assign to batch)  
- Admins (existing Admin can **create additional Admin** users — same `ADMIN` role, no fine-grained permissions)  
- Orders / enrollments (SSLCommerz + office enroll; assign/reassign batch)  
- Courses / Batches  
- Marketing trainers  
- Global notices / Gallery / Blog / Settings  

## Blog

- Basic CMS: title, slug, excerpt, **rich-text body**, cover image, publish flag, publishedAt  
- Rich-text editor on admin (e.g. TipTap or similar) — store HTML or editor JSON (decide at implement time; sanitize on render)

## Settings (non-secret)

- Contact phones, email, address, business hours  
- WhatsApp number, social links, map embed  
- Announcement bar  
- **`emailVerificationRequired`** toggle  

## Secrets (env only — not in Admin UI)

- `SSLCOMMERZ_*`  
- `RESEND_API_KEY`  
- DB, JWT, S3 credentials  

## KPIs

- Unassigned enrollments  
- Unverified students  
- Orders  
- Active batches  

## Acceptance criteria

- [ ] Admin can create another Admin  
- [ ] Blog rich-text create/edit/publish  
- [ ] Settings toggle affects verification gate  
- [ ] No payment/email secrets editable in UI  
