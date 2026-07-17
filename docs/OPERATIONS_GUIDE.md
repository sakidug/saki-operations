# Operations Guide

## Daily checks

1. Open Settings and review About/System Information.
2. Confirm API is Online, Database is Connected, and Sync is Healthy.
3. Confirm the version and build match the approved deployment.
4. Review pending, failed, and conflicting sync counts on Home.
5. Verify devices report sufficient browser storage and expected permissions.

## Support information

Use **Copy build information** for release identity. Use **Copy system information** for device-specific support details. The copied block includes build, browser, OS, device, screen, route, role, API, database, sync, storage, camera, and notification state.

Support contact: `operations@sakitours.com`

## Health endpoint

`GET /api/v1/health` reports:

- Application name, version, build, environment, and build time
- API status and database status
- Sync Engine version
- Server time and uptime

A degraded response requires database/connectivity investigation before field rollout.

## PWA operations

- Install only from the approved HTTPS domain.
- Apply update prompts at a safe point between operations.
- If a device shows an old build, close all tabs, reopen the PWA, and apply the update prompt.
- Use Settings About to confirm the active build after updating.

## Incident workflow

1. Record the error ID.
2. Copy System Information.
3. Record the operational action immediately before the error.
4. Preserve the device and browser state.
5. Escalate with build hash and timestamp.
