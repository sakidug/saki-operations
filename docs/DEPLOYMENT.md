# Deployment Guide

## Requirements

- Node.js 20+
- pnpm 9+
- PostgreSQL
- HTTPS for production PWA and secure cookies
- Persistent upload storage for single-node deployment; durable object storage is required for multi-instance deployment

## Environment

Set production values for:

- `NODE_ENV=production`
- `APP_ENV=production`
- `VITE_APP_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET` (minimum 32 characters; no placeholders)
- `APP_URL`, `API_URL`, `VITE_API_URL`, `CORS_ORIGIN`
- `SYNC_UPLOAD_DIR`

Use `staging` for both `APP_ENV` and `VITE_APP_ENV` in staging deployments.

## Deploy

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm --filter @saki-operations/database db:migrate:deploy
pnpm build
```

Deploy `apps/web/dist` as the static PWA and run `apps/api/dist/main.js` for the API.

## Verification

1. Open `/api/v1/health`.
2. Confirm version, build, environment, built time, API status, database status, server time, uptime, and Sync Engine.
3. Confirm the splash, dashboard build card, and Settings About show the same version/build.
4. Confirm the manifest and icons load without 404s.
5. Install the PWA and verify install/update prompts.
6. Verify login, offline startup, and sync status without changing operational records.

## Rollback

Redeploy the previous Web and API artifacts together. Confirm their build hashes match in Settings About and health before reopening access.
