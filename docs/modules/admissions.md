# Module: Admissions (legacy / optional)

**Status:** Clarified — **primary path superseded** (2026-08-03)  
**Replacement:** Public registration + course purchase/enrollment

## Purpose (original)

Online application for a course/batch with Admin approval.

## Current disposition

Product is now a **single-vendor LMS** (Udemy-like). Students **register publicly** and **buy/enroll** in courses. Admin-approval admission is **no longer the access gate**.

### Recommended default (pending Round 2 confirmation)

**Remove Admin-gated admission as the core LMS flow.** Optionally keep a lightweight **“Course inquiry”** contact-style form for offline/corporate leads — **or** drop the Admission page and use Contact + Buy Now only.

Until Round 2 decides, treat full admission pipeline (`PENDING` → approve → account) as **out of scope / do not build**.

## Superseded locked decisions (void)

- ~~Statuses PENDING/APPROVED/REJECTED/WAITLISTED as access control~~
- ~~Reference `ARVA-YYYY-####` as student onboarding ID~~
- ~~Approve creates login~~
- ~~One course per application as enrollment mechanism~~

## If inquiry form kept (optional)

- Fields: name, email, phone, interested course, message
- Creates a Lead row + admin email
- Does **not** create enrollments or accounts

## See also

- [auth-and-accounts.md](auth-and-accounts.md)
- [purchases-and-enrollments.md](purchases-and-enrollments.md)
- [courses-and-batches.md](courses-and-batches.md)
