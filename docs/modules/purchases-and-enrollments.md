# Module: Purchases & Enrollments

**Status:** Clarified (Round 2 payment locked)  
**Depends on:** Auth, Courses/Batches, Notifications, SSLCommerz

## Two enrollment channels

### 1. Frontend — online gateway (required)

- Student (verified, when setting ON) buys course on site  
- Payment via **SSLCommerz** (cards and other methods SSLCommerz already supports)  
- On payment success → `Order PAID` → `Enrollment ACTIVE`, `batchId = null`  
- Admin later assigns batch  

### 2. Admin panel — office / assisted enroll

For walk-ins who pay at the office (cash, card terminal, or other means):

- Admin selects/creates student + course  
- Records payment method note (`CASH`, `CARD`, `SSLCOMMERZ_OFFLINE`, `OTHER`, etc.)  
- Creates `Order` (marked paid/manual) + `Enrollment`  
- Optionally assign batch in same flow or later  
- Does **not** require the student to complete frontend checkout  

```text
Frontend:  Register → Verify → Buy (SSLCommerz) → Enrollment → Admin assigns batch
Office:    Admin enrolls student (+ payment note) → Enrollment → Admin assigns batch
```

## Access rules

| State | Can see |
|-------|---------|
| Not enrolled | Marketing only |
| Enrolled, `batchId` null | Awaiting batch (no cohort content) |
| Batch assigned | Materials, announcements, live sessions |

## Checkout UI

- **No batch picker** ever on frontend  

## Prices

- Whole **BDT integers** (`priceBdt`)  
- Free courses (`0`): still create enrollment without gateway charge (instant), then await batch  

## Data sketch

- `Order`: userId, courseId, amountBdt, channel (`ONLINE` | `ADMIN`), paymentMethod?, provider, providerRef?, status, createdAt  
- `Enrollment`: userId, courseId, orderId?, batchId?, status, …

## Acceptance criteria

- [ ] Frontend paid path goes through SSLCommerz  
- [ ] Admin can enroll without frontend payment  
- [ ] Both paths produce enrollment awaiting batch  
- [ ] Assignment/reassignment emails fire  
