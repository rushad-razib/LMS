# Module: Auth & Accounts

**Status:** Clarified (roles updated 2026-08-03)  

## Purpose

Public student registration; Admin-provisioned Teacher and Admin accounts; JWT auth.

## Roles

| Role | How created |
|------|-------------|
| `STUDENT` | Public `/register` |
| `TEACHER` | Admin invite / create |
| `ADMIN` | Seed + Admin create |

## Locked decisions

1. Public student self-registration enabled.  
2. Course access still requires purchase + (for cohort features) batch assignment.  
3. Password at registration for students; set-password invite for teachers/admins.  
4. Password reset in v1.  
5. JWT access + httpOnly refresh cookie.  
6. Register endpoint **always** creates `STUDENT` only.

## Portals

- `/student/*` — STUDENT  
- `/teacher/*` — TEACHER  
- `/admin/*` — ADMIN  

## Acceptance criteria

- [ ] Public register → STUDENT only  
- [ ] Teacher cannot hit admin routes  
- [ ] Role guards on all three portals  
