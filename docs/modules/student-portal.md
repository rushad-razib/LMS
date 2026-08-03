# Module: Student Portal

**Status:** Clarified  

## Access

- Email verified required when Admin setting `emailVerificationRequired` is ON.  
- Materials only under assigned batch (no standalone downloads page).  
- Multiple course enrollments supported.

## Pages

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

## States

- Unverified → verify-email wall  
- Awaiting batch → empty cohort state  
- Assigned → full batch content + session links  
