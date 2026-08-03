# Module: Notifications

**Status:** Clarified (Round 3)  
**Provider:** **Resend** (`RESEND_API_KEY` in env)

## Events

| Event | Recipient |
|-------|-----------|
| Email verification (register / admin-create student) | Student |
| Resend verification | Student |
| Order paid (SSLCommerz) | Student |
| Admin enrolled student | Student |
| Batch assigned / reassigned | Student |
| Batch announcement | All students in batch |
| Password reset | User |
| Teacher / Admin invite (set-password) | Teacher / Admin |
| Contact form | Admin inbox address from settings |

## Rules

- Failures logged; do not roll back enrollment/announcement persistence unless transactionally required  
- From-domain configured in Resend  

## Acceptance criteria

- [ ] Verification + batch emails deliver in staging with Resend  
- [ ] Contact lead notifies admin  
