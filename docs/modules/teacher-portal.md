# Module: Teacher Portal

**Status:** Clarified · Phase 5 implemented  
**Depends on:** Auth, Courses/Batches, Media, Notifications

## Purpose

Primary teacher for assigned batch(es): announcements, materials, **dated live sessions** with Meet/Zoom URLs.

## Locked capabilities

Per assigned batch:

1. **Announcements** — create/edit/delete; each create emails all students in batch  
2. **Materials** — upload/remove files (PDFs, images, etc. — limits in Media workshop)  
3. **Live sessions** — create/edit/delete sessions:
   - Title  
   - Start datetime (required)  
   - End datetime (optional)  
   - Meeting URL (Google Meet / Zoom paste)  
   - Notes (optional)  

Teacher does **not** assign students or create batches. One primary teacher per batch; Admin can reassign teacher.

## Routes

| Route | Page |
|-------|------|
| `/teacher` | My batches |
| `/teacher/batches/:id` | Overview |
| `/teacher/batches/:id/announcements` | Announcements |
| `/teacher/batches/:id/materials` | Materials |
| `/teacher/batches/:id/sessions` | Live sessions schedule |
| `/teacher/profile` | Profile |

## Profile fields

**Admin create:** `fullName`, `email`, optional `password` / `phone` → seeds `TeacherProfile`.

**Editable on `/teacher/profile`:** `fullName`, `phone`, `title`, `bio`, photo upload (`POST /teachers/profile/photo`), optional CV PDF (`POST /teachers/profile/cv`, `DELETE /teachers/profile/cv`). Email is read-only. Separate from marketing CMS trainers.

**Admin:** `/admin/teachers/:id` — view profile and upload/replace/remove CV (`POST` / `DELETE /auth/admin/teachers/:id/cv`). CV is never required at user create.

## Acceptance criteria

- [x] 403 on unassigned batches  
- [x] Session list ordered by `startsAt`  
- [x] Students see upcoming + past sessions with links  
- [x] Announcement triggers batch email  
