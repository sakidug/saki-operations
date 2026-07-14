# Changelog

All notable changes to **Saki Operations** are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Policy:** Every development phase and release **must** update this file in the same change set. See [VERSIONING.md](./VERSIONING.md) and [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## [Unreleased]

### Planned

- Phase 7.3 / Phase 8 — HHCO Helmet Delivery Operations — awaiting approval

---

## [0.7.8] — 2026-07-14

### Fixed

- `Button asChild` now respects `disabled` / `loading` (blocks navigation on Continue CTAs)
- Multi-day current-day selection prefers `in_progress` / `pending` over stale `currentDay`
- Multi-day intermediate days no longer inflate working hours via overnight wall-clock `endTime`
- Day capture: guard against double-commit while saving; recover finish when end odometer already persisted
- History empty state vs filter-empty state distinguished, with Clear filters action
- OCR “Saved / (edited)” labels localized in Start / End / Multi-Day wizards
- Evidence gallery day labels interpolate Day N; thumbnails lazy-load
- Work-time capture preview URL revoke on unmount (blob leak)
- Home hides Start while an active operation exists (Continue only)

### Changed

- Shared history sync badge helpers (`history-sync-ui`)
- History list entrance animation capped for longer lists
- Today’s tasks use icon + sr-only status (no hardcoded checkmark)
- Current Operation progressbar includes `aria-label`

### Notes

- No new Tours business features; polish & QA only
- Orphan `draft` sessions after mid-start failure still documented (KI-018)
- History list virtualization deferred (KI-019)
- Await approval before Phase 7.3 — HHCO Operations

---

## [0.7.7] — 2026-07-14

### Added

- Phase 7.2D — Saki Tours **Previous Operations** (read-only history)
- List of completed + synced Tours sessions from IndexedDB
- This Month stats: operations count, working hours, total KM
- Search by vehicle / hire type; filters for month, year, sync status
- Detail view: trip fields, odometers, hours, KM
- Animated timeline (start → odometer → daily records → end → completed)
- Photo evidence gallery with full-screen viewer
- Sync badges: Waiting / Uploading / Synchronized / Failed

### Notes

- History is read-only — completed operations cannot be edited
- Works offline for previously stored / queued / synced sessions
- Reports, leave, HHCO, office dashboards **not** in this release
- Delivered; see **0.7.8** for Polish & QA

---

## [0.7.6] — 2026-07-14

### Added

- Phase 7.2C — Saki Tours **Multi-Day Operations**
- One Operations Session spanning N days with `customFields.days` daily records
- Day 1: start time + start odometer (at Start) + end work time (no end odometer)
- Middle days: start / end work time only
- Final day: start / end work time + end odometer + Finish
- Progress card (Day X of N + percent) and Today's Tasks checklist
- Daily working hours + total working hours (sum of days); KM once from start→end odometer
- Home Current Operation card shows multi-day progress while active
- Offline-safe day captures + evidence for history preparation (`day_N_start_time` / `day_N_end_time`)

### Notes

- Previous Operations UI, reports, leave, HHCO, office dashboards **not** in this release
- Single-day End Operation (7.2B) unchanged; multi-day redirects away from that wizard
- Await approval before Phase 7.2D — Previous Operations

---

## [0.7.5] — 2026-07-14

### Added

- Phase 7.2B — Saki Tours Operations **End Operation** workflow
- Active operation protection: block Start when `started` / `in_progress` session exists
- Tours home **Current Operation** card with Continue Operation
- Continue Operation screen (vehicle, hire type, route, days, start time, status)
- End wizard: end odometer (OCR) → end work time photo → working hours + KM preview → review → Finish
- Session completion via Session Engine (`complete` → `completed`, online `markSynced`)
- Success screen: vehicle, working hours, total KM, sync status (waiting vs synchronized)
- Offline-first end path: IndexedDB persist + upload queue when offline

### Notes

- Previous Operations list, multi-day daily workflow, reports, leave, HHCO, office dashboards **not** in this release
- Full cloud sync drain remains for the Sync phase; online finish marks the session synced locally
- Await approval before Phase 7.2C — Multi-Day Operations

---

## [0.7.4] — 2026-07-14

### Added

- Phase 7.2A — Saki Tours Operations **Start Operation** workflow
- Tours Ops home: Start New Operation + View Previous Operations (placeholder)
- Wizard: Vehicle → Hire Type → Trip details → Start odometer (OCR) → Start time photo → Start
- Hire types: Wedding Hire, Airport Transfer, Tour
- Multi-day flag when Number of Days > 1 (`customFields.multiDay`)
- Session Engine persistence: draft → started → in_progress with start odometer + start time evidence
- Success screen: vehicle, hire type, start time, status **In Progress**
- Offline-first: IndexedDB session + photo evidence (no network required to start)

### Notes

- End Operation, history list, reports, leave, HHCO, and office features are **not** in this release
- Fleet catalog is local until Vehicle API lands
- Await approval before Phase 7.2B — End Operation

---

## [0.7.3] — 2026-07-14

### Added

- Phase 7.1 — Operations Session Engine (`@saki-operations/operations-session`)
- Session lifecycle: draft → started → in_progress → completed → synced
- Crash recovery via unfinished session resume (`resumeUnfinished`)
- Core fields: employee, vehicle, moduleId, times, odometers, working hours, total KM
- Extensible `customFields` + open evidence type ids (builtins for start/end odometer & time)
- Evidence items with photo, timestamp, offline/upload status, OCR meta
- OCR integration via `attachOdometerReading` (uses `@saki-operations/ocr/core`)
- IndexedDB local store for sessions + photos; pending sync listing for completed sessions
- Extension hooks for future module validators without forking the engine

### Notes

- No Saki Tours / HHCO / Reports / Leave / Vehicle Service UI
- OT calculation intentionally deferred
- Upload drain to the server remains for the Sync phase

---

## [0.7.2] — 2026-07-14

### Added

- Phase 7.0.5 — OCR Foundation (`@saki-operations/ocr`)
- Replaceable `OcrProvider` registry (default digital = Tesseract.js; analog stub prepared)
- `OdometerOcrService` — camera capture → preprocess → OCR → offline queue → gallery save
- Confidence scoring with low-confidence warning threshold (default 75%)
- Manual Accept / Edit flow with photo retained on OCR failure
- IndexedDB evidence queue (`enqueueEvidence`, sync status helpers)
- Reusable `OdometerCapture` UI + `useOdometerCapture` hook (not tied to Tours or HHCO)

### Notes

- No Trip Log or HHCO screens in this release
- Gallery save is best-effort (download / File System Access); true MediaStore APIs are platform-limited on web
- Cloud upload drain of the queue remains for the Sync phase

---

## [0.7.1] — 2026-07-14

### Fixed

- Login `aria-invalid` no longer marks identifier invalid for every form error — only empty fields
- Auth / error / connection animations now respect reduced motion
- Loading buttons expose `aria-busy`

### Improved

- Phase foundation QA polish (no new business features)
- Route-level code splitting (`React.lazy` + Suspense) for auth, dashboard, placeholders, and error screens
- Skip-to-content link in the authenticated shell
- Shared fade-up motion timings; glass card radius / shadow consistency; default input height `h-11`
- Premium empty states for unfinished module routes
- Larger quick-action touch targets; module feature chips use `rounded-md`
- Extracted `getInitials` utility; removed unused `@saki-operations/forms` web dependency until ops modules need it

### Notes

- Profile / Notifications / Settings remain intentional placeholders
- Service worker / offline photo sync still deferred

---

## [0.7.0] — 2026-07-14

### Removed

- Phase 7.0 — Project Cleanup: booking-system foundations purged
- NestJS `saki-tours` module (customers, bookings, trips APIs, DTOs, repositories, services, booking audit)
- Prisma booking domain: `Customer`, `Booking`, `Trip`, `TripDay`, `TripEvidence`, assignment tables, `BookingActivity`, related enums
- Booking permissions (`bookings.*`), trip/evidence permission placeholders, and lifecycle constants
- `@saki-operations/types` booking/customer contracts (`saki-tours.ts`)
- `CustomerSelector` and customer selector presentation types
- Migration `20260714020000_drop_booking_domain` to drop applied booking tables

### Changed

- Product permissions reduced to platform grants: employees, vehicles, reports, payroll, settings
- Prisma schema retains auth (`User`, tokens) + fleet `Vehicle` registry only
- Roadmap Phase 6 marked completed; Phase 7.0 completed; next gate is Phase 7.1

### Notes

- No Trip Log / HHCO / service-record features in this release — clean foundation only
- Vehicle and Employee selectors retained for upcoming ops modules
- Generic `AuditService` retained; booking-specific audit removed
- Empty module scaffolds (`office`, `payroll`, etc.) remain placeholders without booking logic

---

## [0.6.1] — 2026-07-14

### Added

- Phase 6B.1 — Reusable enterprise selectors in `@saki-operations/forms`
- `CustomerSelector` — search, optional inline create draft, phone / WhatsApp / email, booking count, notes
- `VehicleSelector` — premium cards with photo, registration, capacity, availability, assigned driver; unavailable disabled; search + filter
- `EmployeeSelector` — Driver / Assistant / Office / Admin; photo, employee ID, phone, availability; single + multi select; search + role filter
- Shared `SelectorShell`, `useSelectorSearch`, and `filterBySearch` utilities
- Selector presentation types in `@saki-operations/types` (`CustomerSelectorItem`, `VehicleSelectorItem`, `EmployeeSelectorItem`, …)

### Notes

- Presentational only — parents supply items and handle create/persist callbacks
- Historical note: delivered under a former booking-oriented roadmap; **CustomerSelector** is now out of product scope after the July 2026 realignment (Vehicle / Employee selectors remain useful for operations)

---


## [0.6.0] — 2026-07-14

### Added

- Phase 5.5 — Global Form System (`@saki-operations/forms`)
- Zod validation primitives (required, email, phone, date/time, currency, password, OTP, cross-field helpers)
- React Hook Form enterprise hook (`useEnterpriseForm`) with dirty/touched, reset, undo, draft save, auto-save
- Reusable fields: Text, Number, Phone, Email, Date, Time, Date Range, Select, Multi Select, Search Select, Checkbox, Radio, Switch, Text Area, Currency (Rs), Kilometer, Percentage, OTP, Password, File Upload (foundation), Image Upload (foundation)
- `Form`, `FormField`, `FormSection`, `FormGrid`, `FormActions`, `ValidationSummary`
- Focus-first-invalid + animated inline / summary errors
- UI primitives `Switch` and `Textarea` for form controls

### Notes

- No Office Booking, Driver, HHCO, Payroll, or other module screens in this release
- Historical note: Phase 6B booking work was later cancelled in the July 2026 scope realignment

---

## [0.5.2] — 2026-07-14

### Added

- Professional loading UX across splash, auth, language init, route changes, dashboard, and module placeholders
- Shared glass loading card + fade-in helpers with reduced-motion support
- Dashboard / auth / module skeleton loaders (no blank wait screens)
- Route transition progress cue inside the application shell

### Notes

- No new business features; existing page layouts preserved

---

## [0.5.1] — 2026-07-14

### Added

- Global React Error Boundary for unexpected rendering failures
- Professional dark crash recovery screen with Error ID, Reload Application, and Return Home
- Client error reporting hook prepared for future server-side logging (`reportClientErrorRemote`)

### Notes

- No business logic, provider tree, or routing changes — crash handling only

---

## [0.5.0] — 2026-07-14

### Added

- Phase 6A — Saki Tours & Weddings domain foundation
- Prisma models: Customer, Vehicle, Booking, Trip, TripDay, Driver/Assistant/Vehicle Assignment, BookingActivity, TripEvidence
- Extensible booking types: wedding hire, airport transfer, tour
- Centralized booking lifecycle (quotation → closed, plus cancelled / on hold)
- Domain validation (driver/vehicle required, dates, overlap, transitions)
- Durable booking activity audit log + console audit mirror
- Booking permission grants for office, driver, assistant, admin (no permission UI)
- NestJS `saki-tours` module: repositories, services, DTOs, controllers under `/api/v1`

### Notes

- No UI, forms, driver screens, office screens, dashboards, or reports in this phase
- Evidence storage keys prepared for R2; sync status prepared for offline upload later
- No production seed data

---

## [0.4.0] — 2026-07-14

### Added

- Phase 5 — Home Dashboard
- Greeting header with employee name, role, avatar initials, date, and live clock
- Status area: online/offline, pending sync count, app version, connection status
- Two large module entry cards (Saki Tours & Weddings, HHCO Helmet Delivery) → placeholder routes only
- Quick actions: Settings, Profile, Notifications, Logout
- Top bar notification bell with unread badge affordance and profile avatar
- Localized dashboard copy (English + Sinhala)

### Changed

- Removed hardcoded demo users from the API runtime
- Auth persistence now uses Prisma (`User`, `RefreshToken`, `PasswordResetToken`)
- Sample users are created only via the development database seeder (`ALLOW_DEV_SEED=true`)
- Roadmap renumbered: Home Dashboard is Phase 5; Tours and later phases shift forward

### Notes

- No Tours, HHCO, Office, Payroll, Reports, or trip forms in this phase
- Pending sync remains `0` until Saki Sync; unread notifications remain `0` until Notifications module

---

## [0.3.0] — 2026-07-14

### Added

- Phase 4 — Authentication
- Premium login (Employee ID / phone, password, show/hide, remember me, validation, loading, errors)
- JWT access + refresh tokens with rotation
- Secure session restore, automatic refresh, logout, and expired-session handling
- Route protection (`RequireAuth`, `RedirectIfAuthenticated`)
- Roles architecture: Driver, Assistant, Office, Admin
- Permissions architecture (trips/employees/vehicles/reports/payroll/settings) — no management UI
- Forgot / Reset / Change password flows (email/SMS delivery placeholder)
- NestJS auth module with bcrypt hashing, httpOnly refresh cookie, rate-limit + lockout readiness, audit hooks
- Prisma auth models prepared (`User`, `RefreshToken`, `PasswordResetToken`)

### Security

- Passwords hashed with bcrypt (12 rounds)
- Refresh tokens hashed at rest in store; rotated on refresh
- Global JWT guard with public-route exceptions
- Login rate limiting and account lockout hooks

### Notes

- No Home Dashboard, Tours, HHCO, payroll, or trip forms in this phase
- Password reset notification channel is placeholder until notifications phase

---

## [0.2.0] — 2026-07-13

### Added

- Phase 3 — App Shell
- Splash screen with bootstrap lifecycle (~2s)
- First-visit language selection (Sinhala / English)
- Application routing architecture
- Reusable layouts and responsive navigation
- Online / offline banner and PWA shell helpers
- Error screens and loading experience

---

## [0.1.0] — 2026-07-13

### Added

- Initial enterprise monorepo foundation (pnpm workspaces + Turborepo)
- Frontend app (`apps/web`) — React 19, Vite, Tailwind CSS, PWA asset prep
- Backend app (`apps/api`) — NestJS, JWT-ready config, Cloudflare R2 config hooks
- Shared packages — `ui`, `types`, `config`, `utils`, `constants`, `hooks`, `i18n`
- Design system and internationalization foundation
- Root enterprise documentation set

### Notes

- **Description:** Initial Enterprise Foundation

---

## Version links

- [Unreleased]: compare against latest tag when publishing
- [0.6.0]: Phase 5.5 — Global Form System
- [0.5.2]: Professional loading states
- [0.5.1]: Global Error Boundary (reliability)
- [0.5.0]: Phase 6A — Saki Tours domain foundation
- [0.4.0]: Phase 5 — Home Dashboard
- [0.3.0]: Phase 4 — Authentication
- [0.2.0]: Phase 3 — App Shell
- [0.1.0]: Phase 1–2 foundation + design system baseline
