# Phase 9.1 — Production Blocker Report

**Version:** v0.9.1  
**Date:** 2026-07-15  
**Scope:** Close Critical + High audit blockers only (no Saki Sync, no new business features).

---

## 1. Critical issues resolved

| ID | Issue | Resolution |
| -- | ----- | ---------- |
| **C-01** | JWT can boot with missing/placeholder/short secret | `resolveJwtSecret()` fails closed in production before Nest binds; clear `[FATAL]` log + `process.exit(1)`. Min length 32. Known placeholders rejected. |

---

## 2. High issues resolved

| ID | Issue | Resolution |
| -- | ----- | ---------- |
| **H-02** | Module authorization missing | Expanded permissions; web `RequirePermission` on Tours/HHCO/Leave/Vehicles/Employees/Office/Reports; API `ModulesController` enforces `@Roles` / `@Permissions`; home cards filtered by grants. |
| **H-03** | Tokens in web storage | Refresh token **no longer** stored in localStorage/sessionStorage. HttpOnly cookie is refresh SoT. Access token remains memory + short reload cache. Documented in [AUTH_TOKEN_STORAGE.md](./AUTH_TOKEN_STORAGE.md). |
| **H-04** | Guards unused / API auth weak | Global Jwt + Roles + Permissions guards retained and **wired** via metadata on module routes; auth endpoints remain `@Public` where appropriate; Helmet enabled; password-reset rate-limited. |
| **H-05** | PWA not installable | `vite-plugin-pwa` generates SW + precache; install prompt + SW update detection wired; Chromium install criteria met when served over HTTPS. |

**Explicitly deferred (not in this phase):**

| ID | Issue | Reason |
| -- | ----- | ------ |
| **H-01** | Sync is local mark only (KI-020) | Phase **9.2 Saki Sync** — awaiting approval |

---

## 3. Remaining risks

1. **Access JWT still JS-readable** (short TTL mitigation) — full cookie access auth needs BFF/CSRF work.  
2. **Leave / Vehicles / Employees remain device-local** (KI-027) — route ACL + permission UI closed; data SoT is still the device until Sync/API.  
3. **In-memory login rate limit** does not share across replicas.  
4. **End-commit non-atomic** IDB writes (pre-existing Medium).  
5. Placeholders in `.env.example` are still valid for **development** only.

---

## 4. Remaining technical debt

| Item | Tracker |
| ---- | ------- |
| True cloud sync drain | KI-020 → Phase 9.2 |
| API-backed Leave/Vehicles/Employees/Office | KI-027 / KI-028 |
| Orphan draft purge UI | KI-018 |
| History virtualization | KI-019 |
| Final PWA brand icons | KI-004 |
| Password reset delivery channel | KI-009 |
| Redis-backed rate limiting | security follow-up |

---

## 5. Updated production readiness score

| Dimension | Pre-9.1 | Post-9.1 | Note |
| --------- | ------- | -------- | ---- |
| Feature completeness | 9 | 9 | unchanged |
| Field ops reliability | 8 | 8 | Sync still local |
| Office tooling fidelity | 7 | 7.5 | route ACL added |
| Security / API hardening | 7 | **8.5** | JWT fail-closed, Helmet, module ACL, cookie refresh |
| Observability | 6 | 6 | unchanged |
| PWA / install readiness | 6 | **8.5** | SW + install + update |
| **Overall** | **7.5** | **8.2 / 10** | Production **candidate**; Sync still required for multi-device SoT |

---

## Recommendation

### READY FOR PHASE 9.2 (Saki Sync)

Critical and High audit items in scope for 9.1 are closed. Proceed to Phase 9.2 when approved — do not mark v1.0.0 until Sync honesty (H-01 / KI-020) is addressed or formally waived.
