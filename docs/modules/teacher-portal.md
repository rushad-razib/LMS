# Module: Teacher Portal

**Status:** Clarified  
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

## Acceptance criteria

- [ ] 403 on unassigned batches  
- [ ] Session list ordered by `startsAt`  
- [ ] Students see upcoming + past sessions with links  
- [ ] Announcement triggers batch email  
