# ADR-004: Auth (JWT, roles, email verification)

**Status:** Accepted  
**Date:** 2026-08-03

## Decision

- Roles: `STUDENT` | `TEACHER` | `ADMIN`  
- Public register → STUDENT only  
- Admin creates TEACHER, ADMIN, and optional STUDENT  
- JWT **access** token + **httpOnly refresh** cookie  
- Password hashing: argon2 or bcrypt  
- **Email verification** required for students when Settings toggle ON; blocks `/student/*` and checkout until verified  
- Toggle `emailVerificationRequired` in Admin Settings for dev/testing  

## Consequences

- Secure cookie handling needs correct CORS/SameSite for SPA ↔ API domains  
- Resend required for verification mail  
