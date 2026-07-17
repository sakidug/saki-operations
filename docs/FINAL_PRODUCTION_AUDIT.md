# Final Production Audit Report — Phase 9.3

**Product:** Saki Operations  
**Audited build:** **v0.9.2**  
**Date:** 2026-07-15  
**Method:** Static code verification + architecture review (no live multi-device lab).  
**Scope:** Auth · Tours · HHCO · Leave · Vehicles · Employees · Office · Reports · Sync · DB · Security · Performance · A11y · PWA · Docs  

**Code was not modified for this audit** (findings only).

> **Phase 9.4 follow-up (v0.9.3):** Critical C-01/C-02 and High H-01/H-02/H-03/H-05 are **resolved**. H-04 accepted as architectural debt (local disk → R2). See [PRODUCTION_BLOCKER_RESOLUTION_9_4.md](./PRODUCTION_BLOCKER_RESOLUTION_9_4.md).  
> **Recommendation after 9.4:** **READY FOR FINAL RE-AUDIT** — not v1.0.0.

---

## Executive verdict (at audit time — v0.9.2)

# DO NOT RELEASE

v1.0.0 must not be tagged until Critical findings are fixed and re-verified.

Field Tours/HHCO/auth/PWA foundations are strong. **Saki Sync as shipped does not currently accept real field events** due to an identity mismatch, and sync file upload accepts a path-traversal vector. Office modules remain device-local.

---

## 1. Critical issues

| ID | Area | Finding | Evidence | 9.4 status |
| -- | ---- | ------- | -------- | ---------- |
| **C-01** | Sync | Client emits `userId: employeeId` (`EMP-…`); API requires JWT `AuthUser.id` (cuid). Ingest returns `rejected` for essentially all Tours/HHCO/Leave events. `markSynced` on ack never fires. Enterprise sync is non-functional. | `commit-start-operation.ts` (`userId: employeeId`); `sync.service.ts` `event.userId !== userId`; `token.service.ts` `id: user.id` | **Fixed** — AuthUser.id emitter + server JWT stamp |
| **C-02** | Sync / Files | `storeBlob` builds `storageKey` from client `localId` via `path.join` without sanitization. Authenticated caller can supply `../` sequences and write outside the upload root. | `apps/api/src/modules/sync/sync.service.ts` | **Fixed** — UUID keys + validation |

---

## 2. High issues

| ID | Area | Finding | 9.4 status |
| -- | ---- | ------- | ---------- |
| **H-01** | Auth | Login/refresh JSON still returns `refreshToken` in body while HttpOnly cookie is set — XSS can still read body token. | **Fixed** — body omits refresh |
| **H-02** | Sync | No max body / batch / file size limits on `/sync/files` (base64) or event batches — DoS / memory risk. | **Fixed** — caps enforced |
| **H-03** | Sync / Leave | Any authenticated role can ingest crafted events once C-01 is fixed; no eventType / entity ownership permission checks beyond userId match. Leave approve remains client SoT. | **Partial fix** — allowlist + `leave.manage` for decisions; full ownership merge still deferred (KI-027) |
| **H-04** | Storage | Sync blobs on local disk (not R2). Multi-instance / ephemeral FS unsafe (KI-007 / KI-029). | **Accepted risk** — architectural |
| **H-05** | UX honesty | Home Tours/HHCO **module cards** are not permission-filtered (operations tools are). Deep links still gated. | **Fixed** |

---

## 3. Medium issues

| ID | Area | Finding |
| -- | ---- | ------- |
| **M-01** | Auth | Access JWT remains in web storage (documented residual). |
| **M-02** | Auth | Login rate limit in-process only (not Redis / multi-replica). |
| **M-03** | Sync | Entity version read outside transaction — concurrent race possible. |
| **M-04** | Sync | Mid multi-day day commits do not emit sync events; start odometer files often not enqueued. |
| **M-05** | UX | Work-time / delivery photo steps revoke blob URLs on unmount → broken preview on Back. |
| **M-06** | Reports | “PDF” = print HTML; “Excel” = CSV — labels overclaim. |
| **M-07** | Vehicles / Employees | Seed + partial update only; not full CRUD; no sync emit (KI-027). |
| **M-08** | Office / Reports | Device-local aggregations only (KI-028). |
| **M-09** | Sync | No interactive conflict merge UI (KI-029). |
| **M-10** | Perf | Evidence galleries materialize full data URLs; history not virtualized (KI-019). |

---

## 4. Low issues

| ID | Area | Finding |
| -- | ---- | ------- |
| **L-01** | PWA | Placeholder icons (KI-004). |
| **L-02** | Auth | Password reset delivery placeholder (KI-009). |
| **L-03** | Shell | Profile / Notifications / Settings shell-ready (KI-010). |
| **L-04** | Sync | Emit failures swallowed (`emit.ts` returns null). |
| **L-05** | A11y | Wizard steppers weak (`aria-current` / focus move). |
| **L-06** | Code | Module API stubs return `{ allowed: true }` only (intentional). |

---

## 5. Security assessment

| Control | Status |
| ------- | ------ |
| JWT fail-closed in production | Pass |
| Global Jwt + Roles + Permissions guards | Pass (wired) |
| Web `RequirePermission` on module routes | Pass |
| HttpOnly refresh cookie + storage strip | Pass (body still leaks — H-01) |
| Helmet + ValidationPipe | Pass |
| Rate limit on login / forgot / reset | Partial (in-memory) |
| Sync authorization depth | Fail until C-01 fixed + event ACL (H-03) |
| File upload path integrity | Fail (C-02) |

**Security score: 6.5 / 10** (would be ~8.5 after C-01/C-02/H-01/H-02).

---

## 6. Performance assessment

| Area | Status |
| ---- | ------ |
| Route code-splitting | Strong |
| Sync batching + backoff | Designed well |
| Data-URL file upload / gallery | Weak on large sets / mobile |
| Reports / history at scale | Not proven; no virtualization |
| OCR memory | Bounded terminate; multi-pass spike acceptable |

**Performance score: 7 / 10** for field pilot size; not proven at large fleet history.

---

## 7. Accessibility assessment

Skip-to-content, loading `aria-busy`, reduced-motion hooks, live regions on banners present. Weaknesses: wizard step a11y, blob broken-image on Back, reports horizontal scroll.

**Accessibility score: 7 / 10**.

---

## 8. Architecture assessment

| Layer | Judgment |
| ----- | -------- |
| Session engine + OCR | Production-candidate |
| Event-sourced Sync design | Sound |
| Sync implementation identity | Broken (C-01) |
| Office domain | Local-first pilot — not enterprise SoT |
| PWA SW + install | Production-candidate (HTTPS) |

**Architecture score: 7.5 / 10** (design) / **5.5 / 10** (as shipped for Sync honesty).

---

## Module matrix (summary)

| Module | Audit result |
| ------ | ------------ |
| Authentication | Strong — residual High on body refresh |
| Saki Tours | Strong offline field path; sync upload broken by C-01 |
| HHCO | Same as Tours |
| Leave | Pilot local + emit broken by C-01 |
| Vehicles | Pilot seed / notes — not full CRUD |
| Employees | Pilot seed / photo — not full CRUD |
| Office Dashboard | Pilot device metrics |
| Reports | Pilot; print/CSV oversold as PDF/Excel |
| Saki Sync | Design pass; runtime Critical fail |

---

## 9. Production readiness score

| Dimension | Score |
| --------- | ----- |
| Feature completeness (declared scope) | 8.5 |
| Field ops reliability (local) | 8.5 |
| Sync reliability (as shipped) | **3** |
| Security | 6.5 |
| Performance | 7 |
| Accessibility | 7 |
| PWA | 8 |
| Documentation honesty | 8 |
| **Overall** | **6.4 / 10** |

*(Down from 8.7 on v0.9.2 claim after discovering Sync identity / path Criticals.)*

---

## 10. Final recommendation

### At audit time (v0.9.2): DO NOT RELEASE

**Justification:** Two Critical defects block claiming a production multi-device sync platform:

1. **C-01** makes sync ingest reject real client events → ops stay unsynced; Phase 9.2 value is unrealized.  
2. **C-02** is an authenticated write-outside-root security defect on the sync file API.

Additionally, High items H-01–H-04 should be closed or explicitly waived in writing for a supervised single-device pilot (and marketing must not claim multi-device Leave/Vehicles/Employees SoT).

### After Phase 9.4 (v0.9.3)

See [PRODUCTION_BLOCKER_RESOLUTION_9_4.md](./PRODUCTION_BLOCKER_RESOLUTION_9_4.md).

**Recommendation: READY FOR FINAL RE-AUDIT** — do not tag **v1.0.0** until re-audit + leadership approval.

### Minimum gate before reconsidering v1.0.0

1. ~~Fix C-01~~ done in 9.4.  
2. ~~Fix C-02~~ done in 9.4.  
3. Re-run Sync stress: offline → reconnect → acknowledge → `markSynced`.  
4. Decide release positioning: **single-device field pilot** vs **multi-device enterprise** (latter needs R2 / office SoT — H-04 / KI-027).  
5. Short re-audit of Critical/High only.

**Do not tag v1.0.0 until leadership re-approves after the above.**
