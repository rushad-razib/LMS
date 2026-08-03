# ADR-005: Media — S3-compatible + WebP pipeline

**Status:** Accepted  
**Date:** 2026-08-03

## Decision

- Store files in **S3-compatible** bucket  
- Shared **media/image service**: convert png/jpg/jpeg → **WebP** before upload  
- Limits: images **2MB** input; materials **10MB**  
- Signed URLs for private batch materials  

## Consequences

- Extra CPU on upload (sharp/libvips)  
- Smaller delivery size; consistent format  
