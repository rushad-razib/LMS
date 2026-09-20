# Module: Contact & Leads

**Status:** Clarified (Round 3) · Phase 6 implemented

## Purpose

Public contact page + lead capture.

## Page contents

- Contact form  
- WhatsApp deep link (`wa.me`)  
- Email, phone, address, business hours (from Settings)  
- Google Map embed (from Settings)  

## Form fields

- Name, Email, Phone, Subject, Message  

## Locked behavior

1. Persist submission as **Lead** in DB  
2. Email Admin via Resend (inbox = Settings `contactEmail`, else `ADMIN_EMAIL`)  
3. Success message on UI even if email fails (log failure); prefer both succeed  
4. Rate limit: 5 submissions / 15 minutes / IP  

## Admin

- List / view leads; mark read  

## Acceptance criteria

- [x] Validation + spam-friendly rate limit  
- [x] Lead row created  
- [x] Admin notification email attempted  
