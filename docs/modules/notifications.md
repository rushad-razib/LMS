# Module: Notifications

**Status:** Draft (batch-aware)

## Events (v1 draft)

| Event | Recipient | Channel |
|-------|-----------|---------|
| Registered | Student | Optional welcome email |
| Order paid / enrollment created | Student | Email |
| **Batch assigned / reassigned** | Student | **Email (required)** |
| **Batch announcement posted** | Students in batch | **Email (recommended)** |
| Live link updated | Students in batch | Email optional / announcement |
| Password reset | User | Email |
| Contact form | Admin | Email |
| Teacher invited | Teacher | Set-password email |

## Defaults

- SMTP or provider TBD  
- No SMS / WhatsApp API in v1  
