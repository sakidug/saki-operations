# Saki Operations Architecture

## Product boundary

Saki Operations is a mobile-first operations and workforce PWA for Saki Tours & Weddings (Pvt) Ltd. The application covers field operations, workforce records, offline capture, and operational reporting. Booking, customer, and finance workflows remain outside this product.

## Monorepo

- `apps/web`: React 19, Vite, Tailwind CSS, PWA shell.
- `apps/api`: NestJS API, JWT authorization, health and sync endpoints.
- `database`: Prisma schema, migrations, and development seeds.
- `packages/ui`: shared UI components and design tokens.
- `packages/i18n`: English and Sinhala resources.
- `packages/build-info`: generated application identity shared by Web and API.
- `packages/operations-session`: offline operations session engine.
- `packages/sync`: IndexedDB queue, backoff, acknowledgements, and audit records.
- `packages/ocr`: odometer image capture and OCR abstraction.

## Runtime flow

1. Vite or the API build runs `scripts/generate-build-meta.mjs`.
2. The build identity is generated from root `package.json`, Git, clock, and environment.
3. The Web bootstrap initializes locale, theme, session, network, PWA, sync, and build information.
4. Operational actions commit locally before synchronization.
5. The API validates authentication, authorization, payloads, event ACLs, and upload boundaries.
6. PostgreSQL persists authentication and sync records; local browser storage supports offline continuity.

## Security boundaries

- JWT secrets fail closed in production.
- Refresh tokens use an HttpOnly cookie.
- Roles and permissions protect API and Web routes.
- Sync user identity is derived from the authenticated JWT.
- Upload storage keys are generated server-side and constrained to the configured root.
- Helmet, validation pipes, body limits, and rate limits are enabled.

## Production identity

`@saki-operations/build-info` is the shared metadata service. Root `package.json` is the version source of truth. Git SHA, timestamp, and environment are generated automatically at build time. The same identity appears in the dashboard, splash screen, Settings About, error diagnostics, API health, and API startup logs.
