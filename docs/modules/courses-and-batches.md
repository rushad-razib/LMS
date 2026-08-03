# Module: Courses, Batches & Curriculum

**Status:** Clarified  
**Updated:** 2026-08-03 (B1–B7 locked)

## Purpose

Sell courses; deliver learning via **batches** with one teacher, batch materials, announcements, and dated live sessions.

## Locked decisions

1. Course has **many batches**.  
2. Each batch has exactly **one primary teacher** (`TEACHER` user). Admin may reassign the teacher.  
3. Students buy the **course** only — **no batch selection at checkout**.  
4. Admin assigns / reassigns enrollment → batch.  
5. Until `batchId` is set: student has purchase ownership but **no materials, announcements, or live sessions**.  
6. **Live sessions:** many per batch; teacher (or admin) creates sessions with schedule + pasted Google Meet / Zoom URL in advance.  
7. **Materials:** batch-level uploads; course may have optional **outline text** for marketing/syllabus.  
8. Announcements are batch-scoped; posting emails all students in that batch.

## Launch courses

Basic Computer, Artificial Intelligence, Web Development, Graphic Design, IELTS, Freelancing

## Data sketch

```text
Course
  - outlineText?
  - priceBdt, status, …
  └── Batch[] (teacherId, scheduleSummary?, status, …)
        ├── Enrollment[] (via enrollment.batchId)
        ├── BatchAnnouncement[]
        ├── BatchMaterial[]
        └── LiveSession[] (title, startsAt, endsAt?, meetingUrl, notes?)
```

## Public course page

Overview, duration, price, outline/syllabus text, instructor blurb, FAQ, **Buy** (no batch UI).

## Acceptance criteria

- [ ] Admin CRUD course + batches; assign one teacher per batch  
- [ ] Reassign teacher or students between batches  
- [ ] Teacher CRUD live sessions + materials + announcements for own batch  
- [ ] Student without batch sees awaiting-assignment empty state  
- [ ] Student with batch sees materials, announcements, upcoming sessions + links  
