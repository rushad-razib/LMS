# Project Brief

**Status:** Approved (2026-08-03)  
**Project:** AR Visionary Academy  
**Parent company:** AR Ventures

## Website goals (v1)

- Public student registration and login
- Course promotion and catalog
- Course purchase → Admin assigns **batch** → access batch materials, announcements, live class links
- Live classes via **Zoom / Google Meet links** (not embedded Zoom SDK)
- Teacher tools for assigned batches
- Brand building, contact / leads

## Product type (v1)

**Single-vendor LMS with cohort batches** (not a multi-seller marketplace):

- Public marketing + Register / Login + Buy course
- **Batches** per course (multiple batches; teachers assigned per batch)
- **Admin** assigns purchased students to a batch
- **Student portal:** My Courses, batch materials, announcements, live Meet/Zoom links
- **Teacher portal:** announcements, materials, live class link for assigned batches
- Admin: catalog, batches, teachers, orders/enrollments, CMS, settings

## Locked technical stack

- Frontend: Vite + React SPA + TypeScript + Tailwind CSS + React Router  
- Backend: Express + TypeScript (modular layered architecture)  
- Database: MySQL + Prisma
- Monorepo: `apps/web`, `apps/api`, `packages/shared`
- Hosting: static SPA + VPS for API and MySQL

## Design direction

- Premium, minimal, modern, mobile-first  
- Fonts: Poppins, Inter  
- Colors: Navy `#0F172A`, Blue `#2563EB`, White `#FFFFFF`, Light Gray `#F8FAFC`  

## Launch courses (v1)

1. Basic Computer  
2. Artificial Intelligence  
3. Web Development  
4. Graphic Design  
5. IELTS  
6. Freelancing  

## Product evolution

| Phase | Model |
|-------|--------|
| Original brief | Admission → admin approve account |
| LMS pivot | Public register + buy → materials |
| **Current (locked intent)** | Public register + buy → **admin assigns batch** → batch materials / announcements / **live Meet links**; **Teacher** role manages assigned batches |

## In scope for v1 (updated)

- Batches (required operationally after purchase/admin enroll)
- Live sessions with Meet/Zoom URLs
- Teacher portal (assigned batches)
- SSLCommerz checkout on frontend + Admin office enroll
- Email verification for students (Admin Settings toggle for dev)
- Email on batch assignment and batch announcements

## Explicitly out of scope for v1

- Zoom/Meet **SDK** embedding or attendance auto-tracking from Zoom
- Online exams / certificate verification  
- AI learning assistant  
- Mobile app  
- Multi-vendor marketplace  
- Public teacher self-signup (Admin creates teacher accounts)
- Public Admission / admin-gated admission pipeline

**Payment:** Frontend = **SSLCommerz**. Admin panel can enroll for walk-in cash/card/other.

## Non-goals

- Multi-tenant platform  
- Instructor marketplace  
- SCORM / xAPI  
- Real-time chat  
- WhatsApp Business API (link button only on contact)

## Success criteria (draft)

Register → verify email → buy via SSLCommerz (or Admin enroll) → batch assign → materials/sessions; teacher tools; SSL; basic SEO.
