# Module: Courses, Batches & Curriculum

**Status:** Clarified · Phase 2 + LMS revision (seats / mode / covers)  

## Locked decisions

1. Course → many batches; **one primary teacher** per batch (Admin reassignable).  
2. Buy **course** only; Admin assigns/reassigns batch.  
3. Pre-batch: no materials/announcements/sessions.  
4. Many dated **LiveSession**s (Meet/Zoom URL pasted).  
5. Materials = batch uploads; course has optional **outline text** (public syllabus).  
6. Prices = whole **BDT integers**.  
7. Announcement emails all batch students.  
8. Batch has **ONLINE | OFFLINE** delivery mode, **seatCapacity**, optional **startDate / endDate**.  
9. Seats are a hard cap — cannot assign/enroll into a full batch.  
10. Course may have a single **cover image** (admin upload → public list/detail).

## Public course page

Cover image (if any), overview, duration, price, outline/bullets, FAQ, **Buy** (SSLCommerz) — no batch UI, no Admission CTA.

## Admin batch overview

`/admin/batches/:id` shows seats filled (`25/30`), mode, dates, schedule, teacher, status, and enrolled students (link to student detail).

## Launch courses

Basic Computer, Artificial Intelligence, Web Development, Graphic Design, IELTS, Freelancing

## Data sketch

```text
Course { outlineText?, priceBdt, coverImageKey?, coverImageUrl?, status, … }
  └── Batch { teacherId, deliveryMode, seatCapacity, startDate?, endDate?, … }
        ├── Enrollment[] (ACTIVE count = seats filled)
        ├── BatchAnnouncement[]
        ├── BatchMaterial[]
        └── LiveSession[] { title, startsAt, endsAt?, meetingUrl, notes? }
```
