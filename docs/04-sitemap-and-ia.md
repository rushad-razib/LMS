# Sitemap and Information Architecture

**Status:** Clarified (teacher + batch 2026-08-03)

## Public nav

Home · About · Courses · Trainers · Blog · Contact · Login · Register  
*(Admission removed from nav)*  

## Public routes

`/`, `/about`, `/courses`, `/courses/:slug`, `/trainers`, `/gallery`, `/blog`, `/blog/:slug`, `/faq`, `/contact`, `/privacy`, `/terms`, `/login`, `/register`, `/forgot-password`

## Student (`STUDENT`)

Canonical routes: [modules/student-portal.md](modules/student-portal.md). Global notices at `/student/notices` (Phase 6).

| Route | Page |
|-------|------|
| `/student` | Dashboard |
| `/student/courses` | My Courses |
| `/student/courses/:slug` | Awaiting batch **or** cohort hub |
| `/student/courses/:slug/sessions` | Live sessions |
| `/student/courses/:slug/materials` | Batch materials |
| `/student/courses/:slug/announcements` | Announcements |
| `/student/orders` | Orders |
| `/student/profile` | Profile |

## Teacher (`TEACHER`)

| Route | Page |
|-------|------|
| `/teacher` | My batches |
| `/teacher/batches/:id` | Batch hub |
| `/teacher/batches/:id/announcements` | Announcements |
| `/teacher/batches/:id/materials` | Materials |
| `/teacher/batches/:id/sessions` | Live sessions |
| `/teacher/profile` | Profile |

## Admin (`ADMIN`)

| Route | Page |
|-------|------|
| `/admin` | Dashboard |
| `/admin/users` | Students / Teachers / Admins |
| `/admin/students/:userId` | Student detail (enrollments, dues, access block) |
| `/admin/orders` | Orders / enrollments + **batch assignment** + office enroll (full/installment) |
| `/admin/courses` | Courses (+ cover image) |
| `/admin/batches` | Batches (+ mode, seats, dates, teachers) |
| `/admin/batches/:id` | Batch overview (seats filled, roster) |
| `/admin/trainers` | Marketing trainer profiles |
| `/admin/notices` | Global notices |
| `/admin/gallery` | Gallery |
| `/admin/blog` | Blog |
| `/admin/leads` | Contact leads |
| `/admin/settings` | Settings |

## Hero CTAs

Browse Courses · Register  
