# Module: Student Portal

**Status:** Clarified  
**Depends on:** Auth, Purchases, Courses/Batches, Notifications

## Pages

| Route | Page |
|-------|------|
| `/student` | Dashboard |
| `/student/courses` | My Courses |
| `/student/courses/:slug` | Course hub (awaiting batch **or** cohort content) |
| `/student/courses/:slug/sessions` | Live sessions (when assigned) |
| `/student/courses/:slug/materials` | Batch materials |
| `/student/courses/:slug/announcements` | Batch announcements |
| `/student/orders` | Orders |
| `/student/profile` | Profile |

No standalone global downloads library in v1 (materials live under batch).

## States

- **Awaiting batch:** message that Admin will assign a batch; no materials/sessions  
- **Assigned:** materials, announcements, session schedule with Meet/Zoom links  

## Emails received

- Batch assigned / reassigned  
- Each new batch announcement  

## Acceptance criteria

- [ ] Awaiting state has no cohort API data leakage  
- [ ] Sessions show schedule + open-link CTA  
- [ ] Multiple course enrollments supported in UI  
