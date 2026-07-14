# Versioning

**Saki Operations** follows [Semantic Versioning 2.0.0](https://semver.org/).

Format: `MAJOR.MINOR.PATCH` → `vMAJOR.MINOR.PATCH`

**Current version:** **v0.7.8** — Saki Tours Polish & QA (Phase 7.2E)

**Product direction:** Operations & Workforce Management PWA — see [ROADMAP.md](./ROADMAP.md) and [ARCHITECTURE.md](./ARCHITECTURE.md)

> Next implementation gate: **Phase 7.3 / Phase 8 — HHCO Helmet Delivery Operations** (awaiting approval). Do not ship booking features under any version.

---

## Product identity (version narrative)

| Era | Versions | Product meaning |
| --- | -------- | --------------- |
| Foundation | `v0.1.x`–`v0.5.x` | Shell, design system, auth, dashboard |
| Forms | `v0.6.0` | Global form system |
| Selectors | `v0.6.1` | Vehicle / Employee selectors (Customer later removed) |
| Ops docs pivot | docs under Unreleased → absorbed | Booking scope removed from roadmap |
| Cleanup | `v0.7.0` | Booking domain / APIs / CustomerSelector purged |
| Foundation QA | `v0.7.1` | Shell polish, a11y, route code-splitting |
| OCR foundation | `v0.7.2` | Replaceable odometer OCR + capture UI |
| Session engine | `v0.7.3` | Reusable Operations Session Engine |
| Tours Start Ops | `v0.7.4` | Phase 7.2A Start Operation workflow |
| Tours End Ops | `v0.7.5` | Phase 7.2B End Operation + active-op guard |
| Tours Multi-Day | `v0.7.6` | Phase 7.2C multi-day daily records |
| Tours History | `v0.7.7` | Phase 7.2D Previous Operations |
| Tours Ops polish | `v0.7.8` | Phase 7.2E Polish & QA |
| HHCO Ops | planned | Phase 7.3 / Phase 8 |
| First production | `v1.0.0` | Hardened ops PWA on sakitours.app |

Saki Operations is **not** versioned as a booking management product. Desktop Saki Tours remains booking/customer/finance SoT.

---

## Version channels

| Range     | Meaning |
| --------- | ------- |
| `v0.x.x`  | **Development** — foundation and pre-production delivery |
| `v1.0.0`  | **First production release** (ops PWA) |
| `v1.x.x`  | Backward-compatible production improvements |
| `v2.x.x`  | **Major feature releases** / breaking platform changes |

---

## What bumps what

| Change type | Bump | Examples |
| ----------- | ---- | -------- |
| Breaking API/module contract | `MAJOR` | Auth token format change; remove public endpoint |
| Backward-compatible feature | `MINOR` | New ops module, Trip Log API, sync engine |
| Bug fix / docs / chore | `PATCH` | Lint fixes, copy fixes, dependency patches |

During `v0.x.x`, `MINOR` bumps may include structural foundation changes (e.g. `v0.7.0` booking purge). Breaking changes must still be called out explicitly in [CHANGELOG.md](./CHANGELOG.md).

**Scope rule:** Version bumps must not reintroduce customers, bookings, quotations, invoices, payments, or pricing into the product.

---

## Release process (summary)

1. Complete phase work on a branch/PR.
2. Update:
   - Root `package.json` `version`
   - `apps/web` `APP_VERSION` (and any displayed version surface)
   - [CHANGELOG.md](./CHANGELOG.md) (`Unreleased` → dated section)
   - [ROADMAP.md](./ROADMAP.md) status if needed
3. Tag release: `vX.Y.Z`
4. Build and deploy via approved pipeline/scripts under `scripts/release/`

---

## Changelog policy

- **Required** on every development phase delivery
- Use Keep a Changelog sections: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`
- Do not bury breaking changes — call them out under `Changed` / `Removed` with migration notes

---

## Pre-release labels (optional)

When needed for staging:

| Label | Use |
| ----- | --- |
| `-alpha.N` | Internal unstable builds |
| `-beta.N`  | Feature-complete candidate |
| `-rc.N`    | Release candidate |

Example: `v1.0.0-rc.1`

---

## Package versions inside the monorepo

- Root version is the **product version** (source of truth for releases).
- Internal workspace packages may remain `0.0.1` until independently versioned publication is required.
- Do not publish private packages to public registries.
