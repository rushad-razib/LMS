# Module: Purchases & Enrollments

**Status:** Clarified · Phase 3 + LMS revision (admin installments)  
**Depends on:** Auth, Courses/Batches, Notifications, SSLCommerz

## Two enrollment channels

### 1. Frontend — online gateway (required)

- Student (verified, when setting ON) buys course on site  
- Payment via **SSLCommerz** (cards and other methods SSLCommerz already supports)  
- On payment success → `Order PAID` (full `priceBdt`) → `Enrollment ACTIVE`, `batchId = null`  
- Admin later assigns batch  
- **Installments are not available** on the frontend path  

### 2. Admin panel — office / assisted enroll

For walk-ins who pay at the office (cash, card terminal, or other means):

- Admin selects/creates student + course  
- Records payment method note (`CASH`, `CARD`, `SSLCOMMERZ_OFFLINE`, `OTHER`, etc.)  
- Payment mode: **Full** | **3 months** | **6 months** installment  
- Full: one PAID `Order` for full price + `Enrollment`  
- Installment: first installment collected now (PAID order for installment 1 amount); remaining months as `Installment` rows (`DUE`); later months marked paid only by admin  
- Optionally assign batch in same flow or later (respects seat capacity)  
- Does **not** require the student to complete frontend checkout  

```text
Frontend:  Register → Verify → Buy full (SSLCommerz) → Enrollment → Admin assigns batch
Office:    Admin enrolls (full or installment) → Enrollment → Admin assigns batch
```

## Installments (admin only)

- Equal integer splits; remainder BDT on **first** installment (e.g. 12001 / 3 → 4001, 4000, 4000)  
- Installment 1 paid at enrollment; 2..N due on the **1st** of each following calendar month; pay-by = due + 9 days (default **10th**)  
- Overdue status does **not** auto-block access; admin may set `Enrollment.accessBlocked`  
- Monthly due emails (student + admins) via cron on the 1st  

## Access rules

| State | Can see |
|-------|---------|
| Not enrolled | Marketing only |
| Enrolled, `batchId` null | Awaiting batch (no cohort content) |
| `accessBlocked` | Blocked notice (no cohort content) |
| Batch assigned | Materials, announcements, live sessions |

## Checkout UI

- **No batch picker** ever on frontend  

## Prices

- Whole **BDT integers** (`priceBdt`)  
- Free courses (`0`): still create enrollment without gateway charge (instant), then await batch  
- Free courses cannot use installments  

## Data sketch

- `Order`: userId, courseId, amountBdt, channel (`ONLINE` | `ADMIN`), paymentMethod?, provider, providerRef?, status, createdAt  
- `Enrollment`: userId, courseId, orderId?, batchId?, accessBlocked, status, …  
- `InstallmentPlan`: enrollmentId, totalBdt, months (3|6), graceDays (10), status  
- `Installment`: sequence, amountBdt, dueDate, payByDate, status (`DUE`|`PAID`|`OVERDUE`), orderId?  

## Acceptance criteria

- [x] Frontend paid path goes through SSLCommerz (full amount)  
- [x] Admin can enroll without frontend payment (full or installment)  
- [x] Both paths produce enrollment awaiting batch (unless batch chosen)  
- [x] Assignment/reassignment emails fire  
- [x] Admin student detail shows due vs total and can mark installments paid / block access  
