# Module: Auth & Accounts

**Status:** Clarified (email verification locked Round 2)  

## Purpose

Public student registration; Admin-provisioned Teacher, Student, and Admin accounts; JWT auth with email verification gate.

## Roles

| Role | How created |
|------|-------------|
| `STUDENT` | Public `/register` **or** Admin create |
| `TEACHER` | Admin invite / create |
| `ADMIN` | Seed + Admin create |

## Locked decisions

1. Public student self-registration enabled.  
2. **Email verification required** before student can access `/student/*` (when verification setting is ON).  
3. Applies to **both** frontend registration and **Admin-created** student accounts (send verification email after create).  
4. **Website setting:** `emailVerificationRequired` (or similar) toggle in Admin Settings — **ON for production**; can be **OFF for development/testing**.  
5. When toggle is OFF: students may access portal without verifying (dev only).  
6. Register endpoint **always** creates `STUDENT` only.  
7. Admins may create additional users with role `ADMIN` (same permissions; no RBAC matrix in v1).  
8. Password at registration for public signup; Admin-created students get verification (+ set-password as needed).  
9. Password reset in v1.  
10. JWT access + httpOnly refresh cookie.  
11. **Admin-only user delete** (`DELETE /auth/admin/users/:id`). Hard delete; email may be reused.  
12. Admin **cannot delete their own** account (`403 CANNOT_DELETE_SELF`). Deleting other Admins is allowed.  
13. Deleting a **Teacher** keeps batches. By default `teacherId` becomes `null`. Confirm lists batch names; admin may optionally reassign all those batches to another teacher in the same delete.  
14. Deleting a **Student** now cascades profile + auth tokens. **Phase 3:** refuse delete (`409`) if the student has `Order` / `Enrollment` rows.

## Student access gate

```text
Login OK
  → if emailVerificationRequired AND !emailVerified
       → block /student/* (show “verify your email” + resend)
  → else allow portal
```

Purchase/checkout from frontend should also require verified email when toggle is ON (same gate).

## Portals

- `/student/*` — STUDENT (verified when setting ON)  
- `/teacher/*` — TEACHER  
- `/admin/*` — ADMIN  

## Acceptance criteria

- [ ] Register sends verification email when setting ON  
- [ ] Admin create student sends verification email when setting ON  
- [ ] Unverified student cannot open student portal when setting ON  
- [ ] Setting OFF skips verification checks  
- [ ] Resend verification available  
- [ ] Admin can delete users except themselves; teacher delete lists batch names and can reassign  
