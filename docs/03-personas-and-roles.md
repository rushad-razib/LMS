# Personas and Roles

**Status:** Clarified (Teacher + batch model 2026-08-03)

## Personas

### Visitor

- Browses catalog; Register / Login; Contact

### Student

- Self-registers, purchases courses
- After Admin **batch assignment**: materials, announcements, live class links for that batch
- Email on batch assignment and (configurable) announcements

### Teacher

- Account created by Admin (no public teacher signup)
- Assigned to one or more batches (possibly across courses)
- For assigned batches only: announcements, upload materials, set/update live Meet/Zoom link
- **Cannot** manage payments, publish courses, or assign students to batches (Admin)

### Admin

- Catalog, batches, assign teachers to batches, assign students to batches after purchase
- Orders/enrollments, CMS, settings, create Teacher users

## Roles

| Role | Portal | Created by |
|------|--------|------------|
| `STUDENT` | `/student/*` | Public register |
| `TEACHER` | `/teacher/*` | Admin |
| `ADMIN` | `/admin/*` | Seed / Admin |

## Permission matrix (draft)

| Capability | Student | Teacher | Admin |
|------------|---------|---------|-------|
| Buy course | Yes | — | — |
| View own batch materials / live link | Yes (assigned) | Yes (assigned batches) | Yes |
| Post batch announcement | — | Yes (own batches) | Yes |
| Upload batch materials | — | Yes (own batches) | Yes |
| Set live class link | — | Yes (own batches) | Yes |
| Assign student → batch | — | — | Yes (assign + reassign) |
| Assign teacher → batch | — | — | Yes (one primary; reassign) |
| Create live sessions | — | Yes (own batch) | Yes |
| Manage orders / CMS | — | — | Yes |
