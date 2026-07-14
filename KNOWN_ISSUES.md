# Known Issues

Tracking list for bugs, limitations, and technical debt in **Saki Operations**.

> Add new items as they are discovered. Resolve items with a PR reference and move them to **Resolved**.

---

## Status legend

| Status       | Meaning                                      |
| ------------ | -------------------------------------------- |
| Open         | Acknowledged; not fixed                      |
| Investigating| Root cause under analysis                    |
| Accepted risk| Won’t fix for now; documented consciously    |
| Resolved     | Fixed; keep brief history for auditability   |

---

## Open

| ID     | Area        | Severity | Description | Notes |
| ------ | ----------- | -------- | ----------- | ----- |
| KI-001 | Web / PWA   | Low      | Service worker not implemented yet | Intentional until Saki Sync phase |
| KI-004 | Assets      | Low      | PWA icons are temporary solid placeholders | Replace with final brand assets from `assets/` before production |
| KI-005 | Tooling     | Low      | Local `pnpm` may require `corepack`/`npx pnpm` depending on machine PATH | Documented in README setup |
| KI-010 | Web / UX    | Low      | Profile, Notifications, Settings are shell placeholders | Rebuild in later phases after Trips Ops |
| KI-011 | Web / UX    | Low      | Offline / maintenance / generic error routes exist but are not auto-routed from network state | Banner covers offline; full-page routes reserved for deep links / future |
| KI-012 | UI package  | Low      | Domain cards (`ModuleCard`, `TripCard`, …) unused by current screens | Reuse in Phase 7.1+ instead of one-offs where practical |
| KI-013 | Forms       | Low      | `@saki-operations/forms` partially used (VehicleSelector); broader form kit still unused | Expand when HHCO / service forms need shared patterns |
| KI-018 | Tours / Session | Medium | Orphan `draft` sessions if Start commit fails after `createDraft` | Does not block Start (`findActive` ignores drafts). Engine has no public delete; purge UI/API later |
| KI-019 | Tours / Perf | Low | Previous Operations list is not virtualized | Animation capped at 12 items in 7.2E; virtualize if histories grow large |
| KI-020 | Sync | Medium | “Synced” is local mark / queue status — true cloud drain still Saki Sync phase | Tours finish marks synced when online; offline stays Ready for Sync |

---

## Investigating

_None at this time._

---

## Accepted risk

| ID     | Area     | Description | Rationale |
| ------ | -------- | ----------- | --------- |
| KI-007 | Storage  | R2 env contract without upload implementation | Avoid premature storage code before Sync/modules need it |
| KI-009 | Auth     | Password reset delivery is placeholder (no email/SMS yet) | Notification channel arrives with later phases |
| KI-014 | Web / UX | Crash fallback uses hardcoded EN/SI copy | Providers may be dead; i18n unavailable during fatal render failures |

---

## Resolved

| ID     | Area | Description | Resolved in |
| ------ | ---- | ----------- | ----------- |
| KI-002 | Database | Booking-era domain models removed; Vehicle + User retained | v0.7.0 |
| KI-003 | Web / Build | Route-level code splitting added for major screens | v0.7.1 |
| KI-006 | Auth | JWT config without auth flows | v0.3.0 |
| KI-008 | Auth | Auth users were in-memory with hardcoded demo identities | Prisma + dev-only seeder |
| KI-015 | Web / A11y | Login marked identifier invalid for any form error | v0.7.1 |
| KI-016 | Web / A11y | Missing skip-to-content link | v0.7.1 |
| KI-017 | Web / A11y | Loading buttons lacked `aria-busy` | v0.7.1 |
| KI-021 | UI / Button | `Button asChild` ignored `disabled` (links still navigated) | v0.7.8 |
| KI-022 | Tours / Multi-Day | Stale `currentDay` could open wrong day task | v0.7.8 |
| KI-023 | Tours / Multi-Day | Overnight wall-clock hours inflated multi-day totals | v0.7.8 |

---

## How to file a known issue

1. Assign the next `KI-XXX` ID.
2. Set severity: `Critical` · `High` · `Medium` · `Low`.
3. Include area (`Web`, `API`, `Database`, `i18n`, `DevOps`, etc.).
4. Describe impact and workaround if any.
5. Link related PRs/issues when available.

### Severity guide

| Severity | Use when |
| -------- | -------- |
| Critical | Data loss, security breach, production outage |
| High     | Major feature broken; no practical workaround |
| Medium   | Partial breakage; workaround exists |
| Low      | Cosmetic, debt, or deferred-by-design items |
