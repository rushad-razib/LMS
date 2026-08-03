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
