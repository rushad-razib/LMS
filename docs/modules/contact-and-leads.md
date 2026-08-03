# Module: Contact & Leads

**Status:** Clarified (Round 3)

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
2. Email Admin via Resend  
3. Success message on UI even if email fails (log failure); prefer both succeed  

## Admin

- List / view leads (mark read optional nice-to-have)  

## Acceptance criteria

- [ ] Validation + spam-friendly rate limit  
- [ ] Lead row created  
- [ ] Admin notification email attempted  
