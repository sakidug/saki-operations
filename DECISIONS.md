# Architectural Decisions

This document records significant architecture decisions for **Saki Operations** (Architecture Decision Records — ADRs).

Format inspired by [Michael Nygard’s ADR model](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

> **Rule:** Do not reverse or silently replace a decision. Propose a new ADR, wait for approval, then implement.

---

## Decision log

| ID     | Title                                      | Status   | Date       |
| ------ | ------------------------------------------ | -------- | ---------- |
| ADR-001 | Monorepo with pnpm + Turborepo            | Accepted | 2026-07-13 |
| ADR-002 | Progressive Web App (PWA) preparation     | Accepted | 2026-07-13 |
| ADR-003 | PostgreSQL as primary database            | Accepted | 2026-07-13 |
| ADR-004 | Tailwind CSS for styling                  | Accepted | 2026-07-13 |
| ADR-005 | shadcn/ui + Radix component system        | Accepted | 2026-07-13 |
| ADR-006 | NestJS for the API                        | Accepted | 2026-07-13 |
| ADR-007 | Modules instead of features               | Accepted | 2026-07-13 |
| ADR-008 | Dark-default multi-brand design tokens    | Accepted | 2026-07-13 |
| ADR-009 | i18next for English + Sinhala             | Accepted | 2026-07-13 |
| ADR-010 | Prisma + dedicated database package       | Accepted | 2026-07-13 |
| ADR-011 | JWT auth with refresh rotation + roles    | Accepted (field auth superseded by ADR-012) | 2026-07-14 |
| ADR-012 | Guest employee entry; admin/office auth only | Accepted | 2026-07-20 |

---

## ADR-001 — Monorepo with pnpm + Turborepo

**Status:** Accepted

**Context:** Saki Operations will ship multiple domains (Tours & Weddings, HHCO, Office, Payroll, Admin) with shared UI, types, and tooling.

**Decision:** Use a pnpm workspaces monorepo orchestrated by Turborepo.

**Consequences:**

- Shared packages versioned together
- Atomic cross-app changes in one PR
- Cached builds for CI speed
- Requires discipline around package boundaries

**Alternatives considered:** Separate repos; Nx. Separate repos slow shared contracts. Nx is powerful but heavier than needed at this stage.

---

## ADR-002 — Progressive Web App (PWA) preparation

**Status:** Superseded in part by Phase 9.1 (service worker shipped)

**Context:** Field and office users need installable, resilient web access; Saki Sync will require offline capabilities later.

**Decision (original):** Prepare PWA assets now (`manifest.json`, icons, `offline.html`, robots). Defer service worker implementation until Sync requirements are approved.

**Update (2026-07-15 / v0.9.1):** Service worker + offline asset precache + install/update UX shipped via `vite-plugin-pwa` to close audit H-05. Operational **background data sync** remains deferred to Phase 9.2 (Saki Sync).

**Consequences:**

- Chromium installability available when served over HTTPS
- Asset caching must not interfere with API (`NetworkOnly` for `/api/`)
- Sync of operations sessions remains out of SW scope until 9.2

---

## ADR-003 — PostgreSQL as primary database

**Status:** Accepted

**Context:** Enterprise operational data needs relational integrity, transactions, and mature tooling.

**Decision:** PostgreSQL via Prisma ORM.

**Consequences:**

- Strong consistency for bookings, payroll, and reporting
- Requires migration discipline
- Excellent ecosystem fit with NestJS

---

## ADR-004 — Tailwind CSS for styling

**Status:** Accepted

**Context:** Need a scalable utility system that pairs with design tokens and rapid UI iteration.

**Decision:** Tailwind CSS v4 with CSS-variable design tokens.

**Consequences:**

- Consistent spacing/type/color application
- Token-driven light/dark and brand themes
- Requires linting/review to avoid one-off style sprawl

---

## ADR-005 — shadcn/ui + Radix component system

**Status:** Accepted

**Context:** Need accessible, customizable primitives owned by the repo (not a black-box UI kit).

**Decision:** Build `@saki-operations/ui` using shadcn/ui patterns on Radix primitives, Lucide icons, and Framer Motion.

**Consequences:**

- Full control over markup and tokens
- Accessibility baseline from Radix
- Component code is maintained in-repo

---

## ADR-006 — NestJS for the API

**Status:** Accepted

**Context:** Backend must support modular domains, DI, guards, validation, and enterprise structure.

**Decision:** NestJS with module-per-domain layout.

**Consequences:**

- Clear module boundaries and testability
- Familiar patterns for enterprise TypeScript teams
- Slightly more ceremony than a minimal Express app (accepted tradeoff)

---

## ADR-007 — Modules instead of features

**Status:** Accepted

**Context:** “Features” folders often become dumping grounds and diverge between FE/BE.

**Decision:** Use `src/modules/<name>` on both web and API with **identical names**.

**Consequences:**

- Predictable ownership across the stack
- Easier onboarding and code search
- Requires creating both sides when adding a domain

---

## ADR-008 — Dark-default multi-brand design tokens

**Status:** Accepted

**Context:** Multiple brands share one product shell with distinct identity colors.

**Decision:** Dark theme default; light supported; brand remaps via `data-brand` (`tours`, `hhco`, `office`, `admin`).

**Consequences:**

- One component library serves all brands
- Brand switching does not fork the design system

---

## ADR-009 — i18next for English + Sinhala

**Status:** Accepted

**Context:** Product must support English and Sinhala without hardcoded UI strings.

**Decision:** `@saki-operations/i18n` using i18next + react-i18next with namespace files.

**Consequences:**

- Scalable translation workflow
- Every new UI string needs keys in `en` and `si`
- Sinhala-capable font stack required (Noto Sans Sinhala)

---

## ADR-010 — Prisma + dedicated database package

**Status:** Accepted

**Context:** Schema ownership should not be buried inside the API app alone.

**Decision:** `@saki-operations/database` owns Prisma schema, migrations, seeds, and backups layout.

**Consequences:**

- Single canonical data layer
- API consumes generated client
- Clear home for future seed/backup scripts

---

## Proposing a new decision

1. Write a draft ADR section (Context → Decision → Consequences → Alternatives).
2. Stop implementation that depends on the change.
3. Get explicit approval.
4. Mark status `Accepted` and implement.
5. Reference the ADR in the PR and CHANGELOG.

---

## ADR-011 — JWT auth with refresh rotation + roles

**Status:** Accepted (field-staff authentication path superseded by ADR-012)

**Context:** Every employee role needs secure authentication before business modules.

**Decision:**
- Access JWT (short-lived) + refresh JWT (rotated, httpOnly cookie + client persistence for remember-me)
- Roles: driver, assistant, office, admin
- Permission grants mapped by role in `@saki-operations/constants`
- Prisma-backed auth persistence (`User`, refresh tokens, password-reset tokens)
- Sample users only via development database seeder (`ALLOW_DEV_SEED=true`); never seeded at API runtime
- Password reset delivery remains placeholder until notifications exist

**Consequences:**
- Local login requires Postgres + `pnpm db:migrate` and optional `ALLOW_DEV_SEED=true pnpm db:seed`
- Production cannot accidentally receive demo credentials from application bootstrap
- Permission UI deferred; guards are ready for future routes
- **Update (ADR-012):** Drivers and assistants no longer authenticate for field operations; JWT login is reserved for office and admin.

---

## ADR-012 — Guest employee entry; admin/office auth only

**Status:** Accepted

**Context:** Field staff needed a frictionless device home. Requiring JWT login before Start/Continue Operation conflicted with offline-first crew selection (driver chosen in the wizard).

**Decision:**
- App launch lands on a guest **Employee Entry** screen (`/entry`), not login
- Employees do **not** authenticate; Start / Continue Operation are guest-accessible
- Selected **driver** is the operations session `employeeId` / `operatorId` (and `driverId`)
- Company step (Saki Tours / HHCO) remains the module selector — choosing HHCO routes into the HHCO start wizard
- JWT authentication is retained for **office** and **admin** only; successful field-role login is rejected in the SPA
- Authenticated admin/office dashboard at `/home` is unchanged

**Consequences:**
- Field operation routes live outside `RequireAuth`
- Device-wide active-operation detection powers Continue on the entry screen
- Legacy sessions that used JWT `employeeId` remain readable; new sessions are owned by the selected driver
- Admin tools, sync payloads, GPS tracking internals, vehicle locking, finish workflow, and IndexedDB schema are unchanged

**Alternatives considered:** Cosmetic entry screen that still required JWT (rejected — does not meet “employees do not log in”); separate module chooser before Start (rejected — Company step already selects the module).

---