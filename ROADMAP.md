# Roadmap

Strategic delivery plan for **Saki Operations** — an **Operations & Workforce Management PWA** for field staff of Saki Tours & Weddings and HHCO Helmet Delivery.

Status legend:

| Status      | Meaning                                      |
| ----------- | -------------------------------------------- |
| Completed   | Delivered and accepted for this phase scope  |
| In Progress | Actively being built                         |
| Pending     | Not started                                  |
| Archived    | Removed from product scope; do not build     |
| Blocked     | Waiting on dependency or decision            |

---

## Product purpose

Saki Operations exists **only** to support day-to-day field operations:

- Record working hours (with photo evidence)
- Record odometer readings (with photo evidence)
- Capture, store, and sync photo evidence
- Calculate total KM and OT
- Store employee operational history
- Track vehicle full-service intervals
- Operate offline with automatic sync when online

### What this product is not

Saki Operations **does not** replace the existing **Saki Tours desktop software**.

That desktop system remains the **only** booking and office management system for:

- Customers, quotations, bookings, invoices, payments, and pricing
- Office booking workflows and booking lifecycles

**Nothing related to bookings or customers belongs in this application.**

---

## Phase overview

| Phase | Name                                      | Status    |
| ----- | ----------------------------------------- | --------- |
| 1     | Project Foundation                        | Completed |
| 2     | Design System                             | Completed |
| 3     | App Shell                                 | Completed |
| 4     | Authentication                            | Completed |
| 5     | Home Dashboard                            | Completed |
| 5.5   | Global Form System                        | Completed |
| 6     | Scope Realignment (docs)                  | Completed |
| 7.0   | Project Cleanup (booking purge)           | Completed |
| 7.0.1 | Foundation QA / UX / Performance polish   | Completed |
| 7.0.5 | OCR Foundation (odometer engine)          | Completed |
| 7.1   | Operations Session Engine                 | Completed |
| 7.2A–F| Saki Tours Operations                     | Completed |
| 7.2   | Saki Tours Operations (module complete)   | Completed |
| 7.3   | HHCO Helmet Delivery Operations           | Completed |
| 7.4   | Leave Management                          | Completed |
| 7.5   | Vehicle Management                        | Completed |
| 7.6   | Employee Management                       | Completed |
| 7.7   | Office Dashboard                          | Completed |
| 7.8   | Reports                                   | Completed |
| 7.9   | Application Polish                        | Completed |
| 8     | Production QA (application-wide)          | Completed |
| 9     | Production Hardening                      | Completed |
| 9.1   | Production Blockers (audit Critical/High) | Completed |
| 9.2   | Enterprise Saki Sync                        | Completed |
| 9.3   | Final Production Audit                      | Completed — was DO NOT RELEASE |
| 9.4   | Production Blocker Fixes (C/H from 9.3)     | Completed |
| 9.5   | Final Release Re-Audit                      | Completed — **READY FOR v1.0.0** |
| 10.0  | Automated Application Versioning            | Completed |
| 10.1  | Enterprise Build Information                | Completed |
| 10.2  | Production Polish (identity / confidence)   | Completed |
| —     | **v1.0.0 Production Release**             | **Awaiting leadership approval** |

> Phase 10.2 is polish-only (branding, splash, icons, About, health, diagnostics, docs). No business workflow changes.  
> Phase 9.5 on **v0.9.3** recommends **READY FOR v1.0.0**. Prior Critical/High blockers verified closed. Tag only after leadership approval.  
> See [FINAL_RELEASE_RE_AUDIT.md](./docs/FINAL_RELEASE_RE_AUDIT.md) and [PRODUCTION_POLISH_REPORT.md](./docs/PRODUCTION_POLISH_REPORT.md).

See also: [Production Readiness Report](./docs/PRODUCTION_READINESS_REPORT.md), [Phase 8 QA](./docs/PHASE_8_QA.md), [Phase 9 Hardening](./docs/PHASE_9_HARDENING.md).

---

## Archived / removed from roadmap

These items are **out of scope**. Do not design, build, or revive them:

| Former item                         | Reason                                      |
| ----------------------------------- | ------------------------------------------- |
| Office Booking Wizard               | Desktop software owns bookings              |
| Customer management / selectors     | Customers belong to desktop                 |
| Booking creation / assignment       | Not an operations concern                   |
| Booking lifecycle & statuses        | Not an operations concern                   |
| Quotations / invoices / payments    | Financial office work stays on desktop      |
| Financial / billing screens         | Out of product purpose                      |
| Booking-related business logic      | Superseded by Trip Log domain               |
| Phase 6A “booking domain foundation” | **Purged** in Phase 7.0                          |
| Phase 6B Office Booking Module      | Cancelled                                   |
| CustomerSelector (enterprise)       | **Removed** in Phase 7.0                    |

**Still useful after realignment (reuse, do not expand toward bookings):**

- `VehicleSelector`, `EmployeeSelector` (operations staff / fleet pickers)
- Global form system, design system, auth, shell, offline-cache scaffolding

---

## Phase 1 — Project Foundation

**Status:** Completed

- Monorepo structure (apps, packages, docs, docker, database, scripts)
- TypeScript, ESLint, Prettier, environment contract, Git ignore
- NestJS + Prisma + PostgreSQL scaffolding
- Docker deployment baseline
- Mirrored frontend/backend modules
- Root governance documentation

## Phase 2 — Design System

**Status:** Completed

- Design tokens, dark-default themes, brand remaps
- Reusable component library
- i18n foundation (English + Sinhala)
- Responsive, accessible patterns

## Phase 3 — App Shell

**Status:** Completed

- Layout chrome, routing placeholders, bootstrap lifecycle
- Splash, language selection, error/loading, online/offline banner
- PWA install/update helpers (service worker deferred)

## Phase 4 — Authentication

**Status:** Completed

- JWT session lifecycle, roles/permissions architecture
- Localized auth flows (en/si)

## Phase 5 — Home Dashboard

**Status:** Completed

- Post-auth landing with module entry cards (Tours & HHCO)
- Quick actions and responsive layout

> **Follow-up (after approval):** Module copy and routes must describe **Operations** (Trip Logs / Delivery Logs), not booking management.

## Phase 5.5 — Global Form System

**Status:** Completed

- Shared `@saki-operations/forms` for operational forms
- Zod + React Hook Form enterprise patterns
- Reusable fields including photo/file foundations

## Phase 6 — Scope Realignment (documentation)

**Status:** Completed

- Product purpose redefined as Operations & Workforce Management PWA
- Roadmap / architecture updated; booking/customer/finance scope archived
- Desktop Saki Tours remains booking SoT

## Phase 7.0 — Project Cleanup

**Status:** Completed

Purged booking-system foundations to match the approved product direction:

- Removed NestJS `saki-tours` booking/customer/trip API module
- Removed Prisma booking domain (Customer, Booking, Trip, assignments, BookingActivity, TripEvidence) while **keeping** `Vehicle` and auth `User`
- Removed booking permissions, lifecycle constants, booking types, and `CustomerSelector`
- Retained auth, roles, dashboard, forms, Vehicle/Employee selectors, PWA/offline/photo foundations

**No new operational features in this phase.**

## Phase 7.0.1 — Foundation QA / UX / Performance polish

**Status:** Completed

- Reviewed splash, language, auth, dashboard, placeholders, navigation, errors
- Polished spacing, glass radius/shadow, touch targets, empty/loading states
- Accessibility: skip link, `aria-busy`, field-level invalid states, reduced motion
- Route-level lazy loading for major screens
- No Trip Log / HHCO features

## Phase 7.0.5 — OCR Foundation

**Status:** Completed

Reusable odometer OCR module (`@saki-operations/ocr`) shared by future Tours + HHCO workflows:

- Capture Odometer → camera → process → detect KM + confidence
- Accept or edit manually; photo still attached if OCR fails
- Replaceable OCR providers (digital implemented; analog prepared)
- Offline evidence queue + best-effort gallery save
- **No** Trip Log / HHCO screens in this phase

## Phase 7.1 — Operations Session Engine

**Status:** Completed

Reusable work-session engine (`@saki-operations/operations-session`) shared by Tours + HHCO:

- Lifecycle draft → started → in_progress → completed → synced
- Resume unfinished sessions after crash / reload
- Employee, vehicle, moduleId, times, odometers, hours, KM + custom fields
- Extensible evidence (photo + OCR meta + offline/upload status)
- Integrates `@saki-operations/ocr` for odometer accept/edit
- IndexedDB offline persistence
- **No** Tours / HHCO / Reports / Leave / Service UI

## Phase 7.2A — Saki Tours Operations (Start Operation)

**Status:** Completed

Start Operation workflow on the Session Engine + OCR foundation. No booking reference. No customer details.

### Delivered

- Tours Operations home: **Start New Operation** + **View Previous Operations** (placeholder)
- Step 1 — Vehicle (`VehicleSelector`)
- Step 2 — Hire type: Wedding Hire / Airport Transfer / Tour
- Step 3 — Start location, Destination, Ending location, Number of days (multi-day when days > 1)
- Step 4 — Start odometer: photo → OCR → Accept / Edit / Retake (manual if OCR fails)
- Step 5 — Start time: photo + automatic device clock (driver cannot edit)
- Step 6 — Start Operation: persist session immediately (offline IndexedDB)
- Success: vehicle, hire type, start time, status **In Progress**

### Explicitly not in 7.2A

- End Operation, history list, reports, leave, HHCO, office features

## Phase 7.2B — Saki Tours Operations (End Operation)

**Status:** Completed

Complete an in-progress Tours session on the Session Engine + OCR foundation.

### Delivered

- Active operation protection (max one `started` / `in_progress` per driver)
- Home **Current Operation** card + Continue Operation
- End odometer (OCR) + end work time photo
- Working hours + total KM preview before finish
- Review + Finish → status **Completed** (online: mark synced / offline: queue)
- Success screen with sync status

### Explicitly not in 7.2B

- Previous Operations list, multi-day daily workflow, reports, leave, HHCO, office dashboards

## Phase 7.2C — Saki Tours Operations (Multi-Day)

**Status:** Completed

One Operations Session spans multiple days with daily records (not separate operations per day).

### Delivered

- Day 1 / middle / final capture rules
- Progress card + Today's Tasks
- Daily + total working hours; KM once (start→end odometer)
- Offline day evidence + customFields preparation for History
- Active session remains singular for the whole multi-day hire

### Explicitly not in 7.2C

- Previous Operations UI, reports, leave, HHCO, office dashboards

## Phase 7.2D — Saki Tours Operations (Previous Operations)

**Status:** Completed

Read-only history of completed Tours sessions from the Session Engine (IndexedDB).

### Delivered

- List cards (hire type, vehicle, dates, hours, KM, days, sync)
- This Month statistics
- Search (vehicle / hire type) + month / year / sync filters
- Detail summary + timeline (incl. multi-day day blocks) + photo gallery
- Offline visibility for queued and synced sessions

### Explicitly not in 7.2D

- Reports, leave, HHCO, office dashboards, edits to completed operations

## Phase 7.2E — Saki Tours Operations (Polish & QA)

**Status:** Completed (v0.7.8)

UX polish, accessibility, edge-case hardening, and QA for Tours Start / End / Multi-Day / History. No new business features.

### Delivered

- Flow QA: Start, Continue, End, Multi-Day, History, Timeline, Photo Viewer, OCR, manual odometer, session recovery, offline path
- Responsive / a11y / performance polish on Tours screens
- Bug fixes (disabled Continue, multi-day day selection & hours, double-commit races, filter empty states, localized OCR labels)
- Docs: CHANGELOG, KNOWN_ISSUES, VERSIONING bump to **v0.7.8**

### Explicitly not in 7.2E

- HHCO, Leave, Reports, Vehicles module, Office dashboards

## Phase 7.2F — Saki Tours Operations (Production QA Fixes)

**Status:** Completed (still **v0.7.8**)

Final production QA for Tours — camera/OCR mobile fixes, mobile chrome, intentional shell placeholders, performance/a11y polish. **No new business features. No HHCO implementation.**

### Delivered

- Safari/iOS-safe camera capture + OCR pipeline (no I/O read failures)
- Mobile safe-area / top-nav density improvements
- Intentional Profile / Notifications / Settings shell screens
- Docs updated; version remains **v0.7.8**

### Explicitly not in 7.2F

- HHCO Operations, Leave, Reports, Vehicles module, Office dashboards

## Phase 7.2 — Saki Tours Operations (module)

**Status:** Completed (through 7.2F)

Drivers **manually create a Trip Log**. No booking reference. No customer details. No booking assignment.

Domain models for Trip Logs consume the Session Engine + OCR foundation.

### Full workflow (delivered)

**Hire type + trip setup** — 7.2A.

**Time & odometer (with photo on each required capture)**

**Single-day hires**

- Start work time + photo — 7.2A
- Start odometer + photo — 7.2A
- End work time + photo — 7.2B
- End odometer + photo — 7.2B

**Multi-day hires**

| Day        | Required captures                                      |
| ---------- | ------------------------------------------------------ |
| Day 1      | Start work time, End work time, Start odometer (+ photos) |
| Middle days | Start work time, End work time (+ photos)             |
| Final day  | End work time, End odometer (+ photos)                 |

**App calculates:** total working hours, total KM.

**History** — 7.2D. **Polish & QA** — 7.2E.

---

## Phase 7.3 / Phase 8 — HHCO Helmet Delivery Operations

**Status:** In Progress

Driver logs a delivery operations record:

- Vehicle
- Assistants (optional)
- Start time + photo
- End time + photo
- Start odometer + photo
- End odometer + photo
- Furthest destination
- Vehicle parked location

**App calculates:** working hours, total KM.

---

## Phase 7.4 — Leave (local-first)

**Status:** Completed

Offline leave module on the web app (localStorage):

- Balance cards (sick 7 / casual 7 / annual 14 defaults)
- Apply leave → pending; office/admin approve or reject
- Calendar month summary + history for the signed-in employee
- Routes: `/modules/leave`, apply, detail `:id`

## Phase 7.5 — Vehicles (local-first)

**Status:** Completed

Fleet list/detail seeded from Tours fleet catalog with richer local records:

- Odometer, next service, insurance, license, maintenance notes
- Document/photo uploads persisted as data URLs on device
- Routes: `/modules/vehicles`, detail `:vehicleId`

## Phase 7.6 — Employees (local-first)

**Status:** Completed

Employee directory seeded from known EMP ids:

- Filter drivers vs office; drivers see own profile only for list/detail access rules
- Contact, emergency contact, role, permission tags; optional local photo
- Routes: `/modules/employees`, detail `:employeeId`

Home dashboard **Operations tools** links Leave / Vehicles / Employees for all roles (simplified access).

## Phase 7.7 — Office Dashboard (local)

**Status:** Completed

Local-first office overview aggregated from IndexedDB operations sessions + employee/vehicle stores:

- Live unfinished Tours (`saki_tours`) and HHCO (`hhco`) sessions
- Employees online (store `status: available` when present, else active-session / seed approximate)
- Vehicles active (assigned/busy/unavailable or on live sessions)
- Pending sync, today KPIs, multi-day active, last 10 completed activities
- Route: `/modules/office-dashboard` · `data-brand="office"` · EN/SI `officeDash.*`

## Phase 7.8 — Reports (local)

**Status:** Completed

Offline report builders from IndexedDB sessions:

- Daily / monthly summaries, employee (hours/km), vehicle, Tours, HHCO
- Period switch via `?period=daily|monthly`
- Export PDF (print / printable HTML) and Export Excel (UTF-8 CSV) — no heavy PDF libs
- Routes: `/modules/reports`, `/modules/reports/:reportType` · EN/SI `reportsOps.*`

Home dashboard **Operations tools** also links Office Dashboard and Reports.

---

## Phase 9 — Photo Evidence & Offline Sync (Saki Sync)

**Status:** Pending

Every captured photo must:

1. Open the device camera
2. Attach to the trip / delivery log
3. Save a copy to the phone gallery (where platform APIs allow)
4. Persist locally for offline use
5. Upload automatically when connectivity returns

Offline:

- Forms and photos remain on device
- Upload queue is maintained

Online:

- Automatic upload
- Upload progress visibility
- Records marked as synced

Uses `storage/offline-cache` and (when approved) the PWA service worker.

---

## Phase 10 — Vehicle Full-Service Tracking

**Status:** Pending

Vehicle profiles expose **only**:

- Current odometer
- Last full service KM
- Next full service KM
- KM remaining
- Full service history

Service reminders derive from the latest submitted odometer.

**No** fuel, tyre, insurance, or repair management.

---

## Phase 11 — Operational History & OT Surfaces

**Status:** Pending

- Employee operational history views
- OT and hours summaries for workforce review
- No booking metrics, no financial ledgers

---

## Phase 12 — Production Release

**Status:** Pending

- Hardening, observability, backups, runbooks
- Production deploy to `sakitours.app`
- Version bump to **v1.0.0** per [VERSIONING.md](./VERSIONING.md)

---

## Deferred / not in near-term ops scope

Reassess only if product leadership explicitly reopens them **without** reintroducing booking/customer management:

- Payroll module (may later consume OT totals — **not** booking finance)
- Broad “Office Dashboard” as a booking/command centre (**cancelled** as booking UI)
- Admin panel (limited fleet/employee config may be needed earlier; full admin is later)

---

## Roadmap rules

1. Do not start **HHCO Operations** until Phase **7.2E** is accepted and leadership approves.
2. Do not add customers, bookings, quotations, invoices, payments, or pricing to any phase.
3. Update this file when a phase status changes.
4. Update [CHANGELOG.md](./CHANGELOG.md) in the same change set as phase delivery.
5. Architecture changes require approval — see [DECISIONS.md](./DECISIONS.md) and Cursor project rules.
