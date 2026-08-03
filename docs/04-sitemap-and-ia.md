# Sitemap and Information Architecture

**Status:** Clarified (teacher + batch 2026-08-03)

## Public nav

Home · About · Courses · Trainers · Blog · Contact · Login · Register  

## Public routes

`/`, `/about`, `/courses`, `/courses/:slug`, `/trainers`, `/gallery`, `/blog`, `/blog/:slug`, `/faq`, `/contact`, `/privacy`, `/terms`, `/login`, `/register`, `/forgot-password`

## Student (`STUDENT`)

| Route | Page |
|-------|------|
| `/student` | Dashboard |
| `/student/courses` | My Courses |
| `/student/courses/:slug` | Batch hub (materials, announcements, live link) |
| `/student/notices` | Notices |
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
| `/admin/students` | Students |
| `/admin/teachers` | Teachers |
| `/admin/orders` | Orders / enrollments + **batch assignment** |
| `/admin/courses` | Courses |
| `/admin/batches` | Batches (+ assign teachers) |
| `/admin/trainers` | Marketing trainer profiles |
| `/admin/notices` | Global notices |
| `/admin/gallery` | Gallery |
| `/admin/blog` | Blog |
| `/admin/settings` | Settings |

## Hero CTAs

Browse Courses · Register  
