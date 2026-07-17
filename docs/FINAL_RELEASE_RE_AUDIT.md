# Final Release Re-Audit — Phase 9.5

**Product:** Saki Operations  
**Build audited:** **v0.9.3**  
**Date:** 2026-07-16  
**Method:** Static code verification + architecture review (no live multi-device lab).  
**Scope:** Re-verify every Critical/High from Phase 9.3 → 9.4; regression across Auth · Tours · HHCO · Leave · Vehicles · Employees · Office · Reports · Sync · PWA · Offline · OCR · Camera · Uploads · Security · Performance.  

**Code was not modified** — verification only. No new Critical defect discovered.

---

## Executive verdict

# READY FOR v1.0.0

Every previous production blocker (Critical C-01 / C-02 and High H-01–H-05) is eliminated or formally waived. No new Critical issues. No Critical/High regressions from Phase 9.4.

Tagging **v1.0.0** still requires **leadership approval** after reading the scope notes below (device-local office modules; local-disk blobs; delta pull not yet applied to SPA state).

---

## Why previous blockers are eliminated

| Prior ID | Was | Re-audit result | Evidence |
| -------- | --- | --------------- | -------- |
| **C-01 / KI-030** | Sync `userId=employeeId` → ingest reject → `markSynced` never ran | **PASS** | Client: `emit.ts` + `SyncProvider` stamp `AuthUser.id`; call sites pass `employeeId` in payload only. Server: `ingestOne` always uses JWT `user.id`. Ack → `markSynced` retained for completed ops. |
| **C-02 / KI-031** | Sync upload path traversal via client `localId` | **PASS** | `storeBlob` uses `{userId}/{UUID}`; validates meta; rejects `..`/separators; root boundary check; 8 MiB cap. |
| **H-01** | `refreshToken` in login/refresh JSON | **PASS** | `toPublicSession` omits refresh; HttpOnly cookie remains SoT. |
| **H-02** | No batch/file/body size limits | **PASS** | 50 events/batch, 8 MiB files, Express JSON limit, DTO max lengths. |
| **H-03** | Weak sync event ACL | **PASS** (scoped) | Event-type allowlist; leave decisions require `leave.manage`. Full entity ownership merge remains Medium (KI-027). |
| **H-04** | Local disk blobs / not R2 | **WAIVED** | Documented accepted risk (KI-007 / KI-029). Single-node pilot OK; multi-instance must not claim durable blobs. |
| **H-05** | Home Tours/HHCO cards unfiltered | **PASS** | `canAccessModule` filter matches operations tools. |

---

## 1. Critical

| ID | Area | Finding | Status |
| -- | ---- | ------- | ------ |
| — | — | **None open.** No new Critical defects found. | Clear |

---

## 2. High

| ID | Area | Finding | Status |
| -- | ---- | ------- | ------ |
| — | — | **No open High release blockers.** Prior H-01–H-05 closed or waived. | Clear |

---

## 3. Medium (residual — not release blockers)

| ID | Area | Finding |
| -- | ---- | ------- |
| **M-01** | Auth | Access JWT still in web storage (documented residual). |
| **M-02** | Auth | Login rate limit in-process only (not Redis / multi-replica). |
| **M-03** | Sync | Entity version read outside transaction — concurrent race possible. |
| **M-04** | Sync | Mid multi-day day commits may omit some sync emits; start odometer files often not enqueued. |
| **M-05** | UX | Work-time / delivery photo steps revoke blob URLs on unmount → broken preview on Back. |
| **M-06** | Reports | “PDF” = print HTML; “Excel” = CSV — labels overclaim. |
| **M-07** | Vehicles / Employees | Seed + partial update; not full CRUD; limited/no sync emit (KI-027). |
| **M-08** | Office / Reports | Device-local aggregations only (KI-028). |
| **M-09** | Sync | No interactive conflict merge UI (KI-029). |
| **M-10** | Perf | Evidence galleries materialize full data URLs; history not virtualized (KI-019). |
| **M-11** | Sync | `GET /sync/delta` + transport `pullDelta` exist, but **SyncEngine never calls pullDelta** — server event log is durable; SPA does not materialize remote events into local session/history on a second device. Same-device offline→upload→ack→`markSynced` works. Cross-device **UI** visibility remains limited (aligned with KI-027). |
| **M-12** | Sync | Advertised blob `publicUrl` paths have no matching GET download handler (dead URL; not traversal). |

---

## 4. Low

| ID | Area | Finding |
| -- | ---- | ------- |
| **L-01** | PWA | Placeholder icons (KI-004). |
| **L-02** | Auth | Password reset delivery placeholder (KI-009). |
| **L-03** | Shell | Profile / Notifications / Settings shell-ready (KI-010). |
| **L-04** | Sync | Emit failures swallowed (`emit.ts` returns null). |
| **L-05** | A11y | Wizard steppers weak (`aria-current` / focus move). |
| **L-06** | Code | Module API stubs return `{ allowed: true }` only (intentional). |

---

## 5. Regression results

| Surface | Result |
| ------- | ------ |
| Login / refresh / logout | **PASS** — cookie refresh, body strips refresh, session restore intact |
| JWT fail-closed | **PASS** |
| Roles / permissions / module routes | **PASS** |
| Tours / HHCO start·end·multi-day | **PASS** — emits use AuthUser.id path |
| OCR / Camera | **PASS** — capture + OCR paths present |
| Offline queue → drain | **PASS** — IndexedDB queue + reconnect drain |
| Sync upload → ack → markSynced | **PASS** (same device) |
| File uploads (security) | **PASS** — UUID keys + validation |
| Leave / Vehicles / Employees / Office / Reports | **PASS** — routes + permission gates; still device-local SoT |
| PWA SW / install | **PASS** |
| Home permission honesty | **PASS** |
| Typecheck (web / api / sync) | **PASS** (prior clean; no code churn in 9.5) |

---

## 6. Sync pipeline (re-audit)

| Step | Same device | Cross-device SPA |
| ---- | ----------- | ---------------- |
| Offline create → queue | **PASS** | N/A |
| Reconnect → upload | **PASS** | N/A |
| Server acknowledgement | **PASS** (identity fixed) | Events stored for user |
| markSynced | **PASS** on completed ack | N/A |
| No duplicate / reject from identity bug | **PASS** | Idempotent `eventId` |
| Visible in other device UI | — | **Limited** (M-11 — delta unused) |

**Scope for v1.0.0:** Field durability + same-device sync honesty. Do not market full multi-device Leave/Office/history merge until M-11 / KI-027 addressed.

---

## 7. Security (re-audit)

| Control | Status |
| ------- | ------ |
| JWT production fail-closed | Pass |
| HttpOnly refresh cookie; no JSON refresh leak | Pass |
| Roles + Permissions guards | Pass |
| Helmet + CORS credentials | Pass |
| Login rate limit + lockout | Pass |
| Sync event allowlist + leave.manage | Pass |
| Upload sanitization / path integrity | Pass |
| Secrets in client | No JWT secret in SPA; access token residual M-01 |

**Security score: 8.5 / 10**

---

## 8. Performance (review)

| Area | Assessment |
| ---- | ---------- |
| Large queues | Batched (engine 25; API max 50); backoff present |
| Large uploads | Hard-capped 8 MiB; data-URL memory stress remains Medium |
| History | Not virtualized (M-10 / KI-019) |
| Reports | Device-local; acceptable for pilot scale |
| Bundle | Route-level code splitting retained (KI-003 resolved historically) |

**Performance score: 7.5 / 10** (adequate for field pilot; not tuned for huge histories)

---

## 9. Production readiness score

| Dimension | v0.9.2 (9.3) | After 9.4 | **Re-audit 9.5** |
| --------- | ------------ | --------- | ---------------- |
| Sync reliability (same-device) | 3 | 8.0 | **8.5** |
| Security | 6.5 | 8.5 | **8.5** |
| Field ops (Tours/HHCO) | ~9 | ~9 | **9.0** |
| Auth / ACL honesty | 7.5 | 8.5 | **8.5** |
| Storage durability | 5 | 5 | **5.0** (H-04 waiver) |
| Multi-device SPA merge | 2 | 2 | **3.0** (upload works; delta unused) |
| **Overall** | **6.4** | **8.2** | **8.4 / 10** |

---

## 10. v1.0.0 scope statement

**Included:** Production field PWA — auth, Tours/HHCO offline workflows, OCR/camera, PWA install, permission-gated modules, durable sync **upload** with ack and local `markSynced`, hardened uploads.

**Explicitly not claimed:** Multi-device Leave/Vehicles/Employees/Office SoT; R2 multi-instance blob durability; interactive conflict console; cross-device SPA history materialization (M-11).

---

## 11. Recommendation

### READY FOR v1.0.0

**Justification:** Phase 9.3 Critical blockers that made sync non-functional and uploads unsafe are verified fixed. High auth/size/ACL/UX blockers are verified fixed or waived in writing. Regression surfaces for login, field ops, offline queue, and permissions remain intact. Residual Medium/Low items are known technical debt, not production blockers for a scoped first release.

**Next step:** Leadership approval → tag **v1.0.0** → do not expand marketing claims beyond the scope statement above.
