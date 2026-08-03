# Module: Contact & Leads

**Status:** Draft

## Purpose

Lead generation and inquiry channel; public contact page.

## Contact page (from brief)

- Contact form  
- WhatsApp button  
- Email  
- Phone  
- Office address  
- Google Map  
- Business hours  

## Recommended defaults (pending confirmation)

1. Contact form stores a **Lead** row in DB + sends email to admin.  
2. WhatsApp is a deep link (`https://wa.me/<number>`) only — no WhatsApp Business API in v1.  
3. Map via Google Maps embed URL from Website Settings.  

## Form fields (draft proposal)

- Name  
- Email  
- Phone  
- Subject  
- Message  

## Open questions

See [open-questions.md](../open-questions.md) — Contact section.

## Acceptance criteria (draft)

- [ ] Form validation + success message  
- [ ] Admin can list leads (if DB-backed)  
- [ ] WhatsApp / email / phone / map render from settings  
