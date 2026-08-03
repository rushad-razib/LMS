# ADR-009: Payments — SSLCommerz + Admin enroll

**Status:** Accepted  
**Date:** 2026-08-03

## Decision

- Frontend course purchase: **SSLCommerz** only (credentials in env)  
- Admin panel: create enrollment/order for office payments (cash, card, etc.) without student gateway checkout  
- Success → Enrollment with `batchId = null` until Admin assigns batch  
- Prices in whole BDT integers  

## Consequences

- Webhook/IPN handling and idempotency required  
- Two order channels: `ONLINE` | `ADMIN`  
