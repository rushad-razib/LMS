# ADR-006: Email via Resend

**Status:** Accepted  
**Date:** 2026-08-03

## Decision

Transactional email through **Resend**. API key in env only.

Covers verification, password reset, purchases, batch assignment, announcements, contact leads, invites.

## Consequences

- Need verified sending domain  
- Simpler than raw SMTP for v1  
