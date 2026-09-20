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
| Installment due (1st of month) | Student + all Admins |
| Password reset | User |
| Teacher / Admin invite (set-password) | Teacher / Admin |
| Contact form | Admin inbox address from settings |

## Installment reminders

- Secured cron: `POST /api/v1/internal/installment-reminders` with header `x-cron-secret: $CRON_SECRET`  
- Run daily from cPanel cron; job no-ops except on the 1st when dues exist  
- Student email includes amount and “please clear the due amount by [payByDate]”  

## Rules

- Failures logged; do not roll back enrollment/announcement persistence unless transactionally required  
- From-domain configured in Resend  

## Acceptance criteria

- [ ] Verification + batch emails deliver in staging with Resend  
- [x] Contact lead notifies admin (attempted; Phase 6)  
