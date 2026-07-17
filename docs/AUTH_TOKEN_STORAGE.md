# Authentication token storage (Phase 9.1 / H-03)

## Current production approach

| Token | Storage | Readable by JS? |
| ----- | ------- | --------------- |
| Refresh | HttpOnly cookie `saki_refresh_token` (path `/api/v1/auth`, `Secure` in production, `SameSite=Lax`) | No |
| Access | In-memory + short-lived web storage (access token only) for reload restore | Yes |

The SPA calls auth endpoints with `credentials: 'include'`. Refresh and logout prefer the cookie; the body refresh token is optional for legacy migration only.

**Refresh tokens are never written to `localStorage` / `sessionStorage`.**

## Why access tokens are not HttpOnly yet

Moving access JWTs fully into HttpOnly cookies requires either:

1. A same-origin BFF that attaches cookies to API calls, or  
2. Changing Passport JWT extraction to read cookies and carefully handling CSRF

That is a larger architectural change than Phase 9.1 allows. Residual XSS risk for the **short-lived access token** remains accepted and is mitigated by:

- Short access TTL (default `15m`)
- Refresh rotation server-side
- No long-lived refresh in web storage
- Helmet security headers on the API

## Production checklist

- Set a strong `JWT_SECRET` (≥ 32 chars, not a placeholder) — API refuses to boot otherwise
- Set `CORS_ORIGIN` to the exact SPA origin(s) with credentials enabled
- Serve SPA and API over HTTPS so `Secure` cookies work
