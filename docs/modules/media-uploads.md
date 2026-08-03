# Module: Media Uploads

**Status:** Clarified (Round 3)

## Storage

- **S3-compatible** object storage (AWS S3, Cloudflare R2, MinIO, etc.)  
- Private or signed URLs for batch materials; public CDN URLs for marketing images as appropriate  

## Size limits

| Kind | Max |
|------|-----|
| Images (covers, gallery, avatars, etc.) | **2MB** (pre-conversion input) |
| Materials / documents (PDF, etc.) | **10MB** |

## Shared image service (locked)

All image uploads go through a **common media service** that:

1. Accepts `png`, `jpg`, `jpeg` (and optionally `webp` passthrough)  
2. **Converts** png/jpg/jpeg → **WebP** before storing  
3. Rejects other image types / oversized files  
4. Returns stored object key + public/signed URL  

Documents (PDF, etc.) skip image conversion; store as-is with MIME allowlist.

## Used by

- Student/teacher/admin avatars & photos  
- Blog covers, gallery  
- Batch material file uploads  
- Course marketing images  

## Acceptance criteria

- [ ] png/jpg/jpeg stored as webp  
- [ ] Size/MIME validation  
- [ ] Single service used by all upload endpoints  
