# Module: Student Portal

**Status:** Clarified · Phase 4 implemented · Phase 6 notices  

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
| `/student/notices` | Global notices |
| `/student/profile` | Profile |

## Profile fields

**At signup / admin create:** `fullName`, `email`, `password`, `phone` (required).

**Editable later on `/student/profile`:** phone, whatsappPhone, dateOfBirth, gender, nidNumber (optional), addressLine, city, district, guardianName, guardianPhone, educationLevel, occupation.

Email and full name are display-only on the student profile page.

## States

- Unverified → verify-email wall  
- Awaiting batch → empty cohort state  
- `accessBlocked` → blocked notice (no cohort content)  
- Assigned → full batch content + session links  

## Acceptance criteria

- [x] My Courses lists enrollments with awaiting / assigned state  
- [x] Cohort content gated until `batchId` set (`403 AWAITING_BATCH`)  
- [x] Assigned student can read sessions, materials, announcements  
- [x] Orders + profile pages available under student shell  
- [x] Global notices available at `/student/notices`  
