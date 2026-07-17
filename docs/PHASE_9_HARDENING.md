# Phase 9 — Production Hardening Review

**Version:** v0.9.0  
**Status:** Review complete for pre-1.0; continuous follow-ups tracked in KNOWN_ISSUES.

## Security

- JWT auth on API; RequireAuth on module routes  
- bcrypt cost 12 for admin create script  
- No booking/finance data in app attack surface  
- **Follow-up:** rate-limit login; rotate JWT secrets in Railway; ensure CORS locked to production origin

## API validation

- NestJS DTOs for auth/user paths  
- Operations sessions currently client-side IndexedDB (engine)  
- **Follow-up:** when Saki Sync lands, validate all session payloads server-side (zod/class-validator)

## Error handling

- Route error screens + crash boundary with bilingual fallback  
- Wizard failures keep photo blobs on device  
- **Follow-up:** centralize toast/error taxonomy for office modules

## Logging

- API structured Nest logger  
- Client console sparingly  
- **Follow-up:** redact PII; add correlation IDs for sync jobs

## Database optimization

- Prisma User/Vehicle retained; booking domain purged  
- **Follow-up:** indexes for sync receipt tables when introduced

## Image optimization

- Captures stored as blobs in IndexedDB; JPEG normalize on OCR path  
- Gallery lazy-load patterns in Tours/HHCO history  
- **Follow-up:** R2 upload compression pipeline (KI-007 / Sync)

## Performance & caching

- Vite code-splitting; static `serve` for production web  
- **Follow-up:** HTTP cache headers on CDN; optional SW caching strategy (KI-001)

## Checklist before v1.0 tag

- [ ] Production env secrets reviewed  
- [ ] Admin password set via `ADMIN_PASSWORD` (not default)  
- [ ] HTTPS only  
- [ ] Smoke: Tours + HHCO odometer OCR on device  
- [ ] Confirm railway.md start command (serve dist)
