# Module: Purchases & Enrollments

**Status:** Clarified (batch rules locked; payment method Round 2)  
**Depends on:** Auth, Courses/Batches, Notifications

## Lifecycle

```text
Buy Course (no batch UI)
  → Order paid/approved
  → Enrollment ACTIVE, batchId = null   # awaiting batch
  → Admin assigns batch
  → Email student
  → Cohort access (materials, announcements, live sessions)

Admin may reassign enrollment.batchId → another batch of same course → email
```

## Access rules

| State | Can see |
|-------|---------|
| Not purchased | Marketing course page only |
| Purchased, `batchId` null | My Courses entry + **Awaiting batch assignment** (no cohort content) |
| Purchased, batch assigned | Batch materials, announcements, live sessions |

## Admin

- Filter enrollments needing batch  
- Assign / reassign batch (same course’s batches only)  
- Manual grant / revoke enrollment  

## Payment

Method TBD Round 2 (P1).

## Acceptance criteria

- [ ] Checkout never lists batches  
- [ ] Assignment and reassignment email student  
- [ ] Gating enforced on APIs  
