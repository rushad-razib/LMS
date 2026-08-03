# Project Brief

**Status:** Clarified (batches + teacher portal added 2026-08-03)  
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
- Database: PostgreSQL + Prisma  
- Monorepo: `apps/web`, `apps/api`, `packages/shared`  
- Hosting: static SPA + VPS for API and PostgreSQL  

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

- Batches (required operationally after purchase)
- Live class **links** (Zoom/Google Meet URLs posted by teacher/admin)
- Teacher portal (scoped to assigned batches)
- Email on batch assignment and batch announcements

## Explicitly out of scope for v1

- Zoom/Meet **SDK** embedding or attendance auto-tracking from Zoom
- Online exams / certificate verification  
- AI learning assistant  
- Mobile app  
- Multi-vendor marketplace  
- Public teacher self-signup (Admin creates teacher accounts)

**Payment:** Mechanism TBD in Round 2 (gateway vs manual). Purchase remains the enrollment trigger before batch assignment.

## Non-goals

- Multi-tenant platform  
- Instructor marketplace  
- SCORM / xAPI  
- Real-time chat  
- WhatsApp Business API (link button only on contact)

## Success criteria (draft)

Register/login, buy course, admin assigns batch, student sees materials + live link, teacher can post for their batch, emails for assignment/announcements, SSL, basic SEO.
