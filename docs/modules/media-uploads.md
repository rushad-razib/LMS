# Module: Media Uploads

**Status:** Draft

## Purpose

Store admission photos, gallery images, blog covers, downloadable files.

## Recommended defaults (pending confirmation)

1. **v1 storage:** local disk on VPS behind Express static/authenticated file routes **or** S3-compatible bucket (recommend S3-compatible if multiple servers / backups matter).  
2. Allowed types: images `jpeg/png/webp`; downloads also `pdf`.  
3. Max size: e.g. 2MB photo, 10MB download (confirm).  
4. Virus scanning out of scope for v1.  

## Open questions

See [open-questions.md](../open-questions.md) — Media section.

## Acceptance criteria (draft)

- [ ] Optional admission photo uploads successfully  
- [ ] Rejected MIME/size returns clear error  
- [ ] Student downloads only authorized files  
