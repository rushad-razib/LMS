# Module: Courses, Batches & Curriculum

**Status:** Clarified  

## Locked decisions

1. Course → many batches; **one primary teacher** per batch (Admin reassignable).  
2. Buy **course** only; Admin assigns/reassigns batch.  
3. Pre-batch: no materials/announcements/sessions.  
4. Many dated **LiveSession**s (Meet/Zoom URL pasted).  
5. Materials = batch uploads; course has optional **outline text** (public syllabus).  
6. Prices = whole **BDT integers**.  
7. Announcement emails all batch students.

## Public course page

Overview, duration, price, outline/bullets, FAQ, **Buy** (SSLCommerz) — no batch UI, no Admission CTA.

## Launch courses

Basic Computer, Artificial Intelligence, Web Development, Graphic Design, IELTS, Freelancing

## Data sketch

```text
Course { outlineText?, priceBdt, status, … }
  └── Batch { teacherId, … }
        ├── BatchAnnouncement[]
        ├── BatchMaterial[]
        └── LiveSession[] { title, startsAt, endsAt?, meetingUrl, notes? }
```
