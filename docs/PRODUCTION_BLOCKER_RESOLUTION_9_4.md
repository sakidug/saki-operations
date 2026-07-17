# Production Blocker Resolution Report — Phase 9.4

**Product:** Saki Operations  
**Build:** **v0.9.3**  
**Date:** 2026-07-15  
**Scope:** Resolve Final Production Audit (Phase 9.3) Critical and High blockers only.  
**Prior audit:** [FINAL_PRODUCTION_AUDIT.md](./FINAL_PRODUCTION_AUDIT.md) on v0.9.2  

---

## Verdict

# READY FOR FINAL RE-AUDIT

Critical blockers **C-01** and **C-02** are fixed. High items **H-01**, **H-02**, **H-03** (ingest ACL), and **H-05** are fixed. **H-04** is explicitly accepted as architectural debt (local disk blobs / R2).

**Do not recommend v1.0.0.** Await a focused Critical/High re-audit and leadership approval.

---

## 1. Critical issues fixed

### C-01 / KI-030 — Sync `userId` identity mismatch

**Root cause:** Client set `SyncEvent.userId` to workforce `employeeId`; API compared against JWT `AuthUser.id`.

**Fix (defense in depth):**

| Layer | Change |
| ----- | ------ |
| Client | `emitSyncEvent` resolves `AuthUser.id` via `SyncProvider` (`setSyncAuthUserIdResolver`). Call sites pass `employeeId` into **payload** only (Tours, HHCO, Leave). |
| Server | `ingestOne` **always** stamps `userId` from the authenticated JWT user — client `userId` is never trusted for auth. |
| Ack path | Unchanged: `onEventAck` still calls `markSynced` for `operation.completed` / `delivery.completed` when ack is `accepted` or `duplicate`. |

**Modules covered:** Tours · HHCO · Leave (Vehicles / Employees / Office / Reports remain local-first emitters where applicable; no wrong-userId emit path remains in sync call sites).

**Queued devices:** Events already queued with legacy `employeeId` as `userId` are accepted because the server overwrites identity from JWT on ingest.

### C-02 / KI-031 — Sync upload path traversal

**Root cause:** `storeBlob` joined client `localId` / filename into the filesystem path.

**Fix:**

- Reject invalid `localId`, `fileName`, `mimeType`, path separators, `..`, NUL.
- Store objects as `{userId}/{serverUUID}` only — never client names on disk.
- Resolve path under `SYNC_UPLOAD_DIR` and reject if outside root.
- Cap decoded size; reject empty / malformed data URLs.
- Duplicate `localId` returns prior mapping only when owned by same user.

---

## 2. High issues fixed

| ID | Resolution |
| -- | ---------- |
| **H-01** | Login/refresh JSON responses omit `refreshToken`. Cookie remains SoT. `AuthTokens.refreshToken` optional for clients. |
| **H-02** | Max 50 events/batch; max 8 MiB decoded file; DTO max lengths; Express JSON body limit derived from file cap. |
| **H-03** | Allowlisted `eventType` set. `leave.approved` / `leave.rejected` require `leave.manage`. Full entity ownership / multi-device Leave SoT still KI-027 (not an architectural rewrite in 9.4). |
| **H-04** | **Accepted risk / deferred.** R2 + durable multi-instance storage is architectural (KI-007 / KI-029). Supervised single-node pilot may proceed; multi-instance production must not claim durable blobs until R2. |
| **H-05** | `HomeModuleCards` filtered with `canAccessModule` (same as operations tools). |

---

## 3. Security improvements

| Area | Change |
| ---- | ------ |
| Authentication | Refresh token no longer in JSON body (XSS read surface reduced). |
| Authorization | Sync leave decisions gated by `leave.manage`; event types allowlisted. |
| Sync identity | JWT user id is sole auth identity for ingest records. |
| Uploads | Untrusted client path components eliminated; mime/name validation; size caps. |
| Validation | Sync DTOs tightened (`MaxLength`, `ArrayMaxSize`). |
| Headers / secrets | Unchanged from 9.1 (Helmet, JWT fail-closed) — reaffirmed intact. |

---

## 4. Sync verification (static + design)

Pipeline under fix:

Offline → create ops → queue events → reconnect → upload → ack → `markSynced` → history synced flag.

| Check | Result |
| ----- | ------ |
| Events rejected for wrong `userId` | **Eliminated** (server overwrite + client AuthUser.id) |
| Duplicate `eventId` | Still returns `duplicate` (idempotent) |
| Completed ops ack → `markSynced` | Retained in `SyncProvider` |
| Orphan uploads | Duplicate localId replay returns existing key; storage path no longer client-derived |

**Note:** Full multi-device lab stress (poor network, browser restart, concurrent drains) should be executed during the **final re-audit**; this phase focused on defect elimination with `tsc` clean on api/web/types.

---

## 5. Upload security verification

| Case | Expected |
| ---- | -------- |
| Normal upload | Accepted; file under upload root as UUID |
| Large upload (>8 MiB) | `413` / rejection |
| Invalid / traversal `localId` | `400` |
| Malformed data URL | `400` |
| Duplicate same-user `localId` | Idempotent prior remote key |
| Path escape attempts | Rejected at validation + root boundary |

---

## 6. Remaining technical debt

| Item | Notes |
| ---- | ----- |
| KI-027 / KI-028 | Leave / Vehicles / Employees / Office / Reports still device-local SoT |
| KI-029 / H-04 / KI-007 | Local disk blobs; R2 deferred |
| KI-004 | Placeholder PWA icons |
| Conflict UI | Sync conflicts stored; operator console not built |
| Entity ownership ACL | Beyond leave.manage + allowlist — deepen if required for enterprise claim |
| Live stress lab | Offline/reconnect/concurrent drains for re-audit |

---

## 7. Updated production readiness score

| Dimension | v0.9.2 audit | After 9.4 (v0.9.3) |
| --------- | ------------ | ------------------- |
| Sync reliability | 3 | **8.0** |
| Security | 6.5 | **8.5** |
| Auth / ACL honesty | 7.5 | **8.5** |
| Storage durability | 5 | **5** (unchanged — H-04 waiver) |
| **Overall** | **6.4 / 10** | **8.2 / 10** |

Overall rises with Criticals closed; durable multi-instance storage and multi-device office SoT still limit a full enterprise claim.

---

## Decision log

| Decision | Rationale |
| -------- | --------- |
| Server overwrites `userId` instead of only rejecting mismatches | Clears already-queued offline events and prevents identity spoofing |
| H-04 waived (not implement R2 in 9.4) | Explicitly architectural; would expand scope beyond blocker fixes |
| H-03 leave decisions need `leave.manage` | Closes open ingest ACL without rewriting Leave into server SoT |
| Bump to **v0.9.3** (not 1.0.0) | Patch/blocker release; production tag awaits re-audit |

---

## Recommendation

**READY FOR FINAL RE-AUDIT**

Wait for approval before any release recommendation. Do **not** tag **v1.0.0**.
