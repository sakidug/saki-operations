# Architecture

**Saki Operations** is an **Operations & Workforce Management Progressive Web App (PWA)** for field staff of:

- **Saki Tours & Weddings** (trip operations / hire logs)
- **HHCO Helmet Delivery** (delivery operations logs)

Domain: [sakitours.app](https://sakitours.app)

This document is the source of truth for product boundaries and system shape after the **July 2026 scope realignment**.

---

## 1. Product boundary (critical)

### In scope

| Capability | Description |
| ---------- | ----------- |
| Working hours | Capture start/end work times with photo evidence |
| Odometer | Capture start/end (and day-rules) readings with photo evidence |
| KM totals | Derive distance from odometer checkpoints |
| OT | Derive overtime from recorded working hours (rules confirmed at implementation) |
| Photo evidence | Camera capture → trip attachment → device gallery copy → local store → sync upload |
| Employee history | Durable operational history for workforce review |
| Full-service intervals | Odometer-driven next service / KM remaining / service history |
| Offline | Local forms + photos + upload queue; auto-sync when online |

### Explicitly out of scope

Saki Operations **does not** replace the existing **Saki Tours desktop software**.

Desktop remains the **only** system for:

- Customers and customer CRM
- Quotations, bookings, invoices, payments, pricing
- Office booking workflows and booking lifecycles

**Do not implement in this codebase:**

- Customer management or customer selectors
- Booking creation, assignment, statuses, or lifecycle
- Financial / billing screens
- Booking-linked trip assignment

Operational trip logs are created **manually by drivers**. They have **no booking reference** and **no customer details**.

---

## 2. Goals

- Field-first PWA: reliable capture of time, KM, and evidence—including offline
- Two operational product modules only (Tours Ops + HHCO Ops), sharing one domain engine
- Clear separation from desktop booking/office management
- Shared design system, forms, auth, and sync infrastructure
- Production path via Docker (nginx) or Railway Node (`serve` static SPA) to sakitours.app

---

## 3. High-level diagram

```text
┌────────────────────────────────────────────────────────────────────┐
│                    Saki Operations (Ops PWA)                        │
│                                                                    │
│  apps/web                                                          │
│    ├─ Auth / Shell / Dashboard                                     │
│    ├─ Saki Tours Operations  → Trip Logs (Wedding / Airport / Tour)│
│    ├─ HHCO Operations        → Delivery Logs                       │
│    ├─ Vehicle service panel  → Full-service KM only                │
│    └─ Sync UI                → queue, progress, synced state       │
│         │                                                          │
│         │  local store + offline queue (offline-first)                │
│         ▼                                                          │
│  apps/api (NestJS)                                                 │
│    ├─ Trip / delivery log APIs                                     │
│    ├─ Evidence upload APIs                                         │
│    ├─ Vehicle service APIs                                         │
│    └─ Employee operational history                                 │
│         │                                                          │
│         ├─ PostgreSQL (Prisma / @saki-operations/database)         │
│         └─ Object storage (Cloudflare R2) for synced photos        │
│                                                                    │
│  External (NOT integrated as booking source of truth)              │
│    └─ Saki Tours desktop software — bookings / customers / finance │
└────────────────────────────────────────────────────────────────────┘
```

---

## 4. Operational modules

### 4.1 Saki Tours Operations

Driver creates a **Trip Log** (manual; no booking id, no customer).

1. **Hire type:** Wedding | Airport Transfer | Tour  
2. **Setup:** Vehicle, start location, destination, ending location, number of days  
3. **Checkpoints** (each required time/odometer capture includes a photo):

**Single-day**

- Start work time, start odometer, end work time, end odometer

**Multi-day**

| Segment | Captures |
| ------- | -------- |
| Day 1 | Start work, end work, start odometer |
| Middle days | Start work, end work |
| Final day | End work, end odometer |

**Derived:** total working hours, total KM.

### 4.2 HHCO Helmet Delivery Operations

Driver creates a **Delivery Log**:

- Vehicle, optional assistants  
- Start/end time (+ photos)  
- Start/end odometer (+ photos)  
- Furthest destination, vehicle parked location  

**Derived:** working hours, total KM.

### 4.3 Shared vehicle full-service model

Vehicle profile fields **only**:

- Current odometer  
- Last full service KM  
- Next full service KM  
- KM remaining  
- Full service history  

Reminders update from the **latest submitted odometer**.

**Not in scope:** fuel, tyres, insurance, repair ticketing.

---

## 5. Photo & evidence pipeline

For every required capture:

1. Open the device camera  
2. Attach the image to the trip/delivery log checkpoint  
3. Save a copy to the phone gallery (capabilities vary by browser/OS; document platform limits)  
4. Persist locally for offline replay  
5. Enqueue upload; when online, upload automatically and mark evidence `synced`

Evidence metadata should survive offline: local id, trip id, checkpoint type, timestamps, sync state.

---

## 6. Offline & sync (Saki Sync)

| State | Behaviour |
| ----- | --------- |
| Offline | Forms and photos stay local; upload queue grows |
| Online | Automatic drain of queue; show upload progress; mark records synced |

Architectural principles:

- **Local-first writes** for trip/delivery drafts and completed logs  
- Idempotent sync to API (stable client-generated ids)  
- Conflict policy: prefer last authoritative field values with audit/activity where needed — details decided at Phase 10 implementation  
- Existing `storage/offline-cache` is the local cache root during development  

---

## 7. Monorepo architecture

| Tool | Role |
| ---- | ---- |
| **pnpm workspaces** | Dependency linking |
| **Turborepo** | Task orchestration and caching |
| **TypeScript** | Shared contracts end-to-end |

Workspace roots:

- `apps/*` — deployable applications  
- `packages/*` — shared libraries and tooling  
- `database` — Prisma schema / migrations / seeds / backups  

---

## 8. Project structure

```text
Saki Operations/
├── apps/
│   ├── web/                 # React 19 PWA frontend
│   └── api/                 # NestJS backend
├── packages/
│   ├── ui/                  # Design system
│   ├── forms/               # Enterprise form + operational selectors
│   ├── i18n/                # en / si
│   ├── types/               # Shared contracts (ops-oriented going forward)
│   ├── config / utils / constants / hooks
│   └── eslint / typescript / prettier configs
├── database/                # Prisma (auth + Vehicle; ops domain pending)
├── docs/
├── assets/
├── storage/                 # uploads · temp · offline-cache
├── scripts/
├── docker/
└── [governance docs]
```

**Module naming rule:** Frontend module folders remain mirrored with backend modules.

**Intended runtime modules (target after realignment):**

| Module | Purpose |
| ------ | ------- |
| `auth` | Session |
| `dashboard` | Ops home |
| `saki-tours` | Trip Logs (operations) |
| `hhco` | Delivery Logs |
| `vehicles` | Fleet + full-service KM only |
| `employees` | Staff identity + operational history |
| `shared` | Cross-cutting UI/helpers |

**Deprecated product intent for modules** (do not grow booking behaviour): `office` as booking UI, customer CRM routes, financial modules. Existing scaffolds may remain empty until cleaned up post-approval.

---

## 9. Frontend (`apps/web`)

| Concern | Approach |
| ------- | -------- |
| Framework | React 19 + TypeScript |
| Bundler | Vite |
| Styling | Tailwind CSS v4 |
| Components | `@saki-operations/ui` |
| Forms | `@saki-operations/forms` |
| i18n | `@saki-operations/i18n` (en / si) |
| Theme | Dark default; brand remaps via `data-brand` |
| Structure | `src/app` shell + `src/modules/*` |
| PWA | Manifest prepared; full offline SW as part of Sync phase |

Selectors retained for ops: **Vehicle** and **Employee**.  
**CustomerSelector** was removed in Phase 7.0 cleanup.

---

## 10. Backend (`apps/api`)

| Concern | Approach |
| ------- | -------- |
| Framework | NestJS |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (implemented foundation) |
| Object storage | Cloudflare R2 for synced evidence |
| Structure | `common/` · `config/` · `infrastructure/` · `modules/` |

**Domain direction:** Trip Log / Delivery Log / Evidence / Service Interval models land in Phase 7.2+. Booking domain was removed in Phase 7.0. Odometer OCR lives in `@saki-operations/ocr` (Phase 7.0.5). Work-session lifecycle lives in `@saki-operations/operations-session` (Phase 7.1).

---

## 11. Shared packages

| Package | Purpose |
| ------- | ------- |
| `ui` | Design system |
| `forms` | Operational forms + vehicle/employee selectors |
| `i18n` | Locales |
| `types` | Shared DTOs (ops contracts going forward) |
| `config` / `utils` / `constants` / `hooks` | Cross-app helpers |
| lint/format/ts configs | Engineering standards |

---

## 12. Database

Canonical data layer: `@saki-operations/database`

```text
database/
├── schema/schema.prisma
├── migrations/
├── seeds/
└── backups/
```

**Target domain entities (conceptual):**

- Employee, Vehicle (service fields only beyond identity)  
- TripLog / TripDay / DeliveryLog  
- EvidenceArtifact (photo + checkpoint + sync state)  
- FullServiceRecord  
- SyncOutbox / queue metadata as needed  

**Not target entities:** Customer, Booking, Quotation, Invoice, Payment.

---

## 13. Storage

```text
storage/
├── uploads/
├── temp/
└── offline-cache/   # Saki Sync local queue & blobs
```

Production photo binaries: Cloudflare R2 (S3-compatible). Local folders support development and device-side caches.

---

## 14. Cross-cutting principles

1. **Ops over office** — field capture, not booking management  
2. **Desktop is booking SoT** — no dual booking systems  
3. **Modules over features** — mirrored web/API folders  
4. **No hardcoded UI copy** — i18n for visible text  
5. **Mobile-first** — large touch targets for field use  
6. **Offline-first for logs & photos**  
7. **Secrets never committed**  
8. **Architecture changes require approval** — [DECISIONS.md](./DECISIONS.md)

---

## 15. Related documents

- [ROADMAP.md](./ROADMAP.md)
- [DECISIONS.md](./DECISIONS.md)
- [STANDARDS.md](./STANDARDS.md)
- [SECURITY.md](./SECURITY.md)
- [VERSIONING.md](./VERSIONING.md)
- [CHANGELOG.md](./CHANGELOG.md)
