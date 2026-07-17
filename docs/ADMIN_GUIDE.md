# Administrator Guide

## Account and access

- Use role and permission grants defined by the application.
- Keep office/admin credentials individual; never share accounts.
- Remove access promptly when workforce status changes.
- Review login lockouts and authentication audit activity when investigating access failures.

## Deployment identity

Settings About and `/api/v1/health` must show the approved version, commit, environment, and build time. Do not approve a deployment when Web and API build identities differ.

## Service status

- **API Online**: the Web can reach the health endpoint.
- **Database Connected**: the API completed a database probe.
- **Sync Healthy**: the local queue has no failed events or conflicts.

Unknown database status can occur when no database URL is configured; this is not valid for production.

## Device support

Use Copy System Information to collect browser, OS, device type, language, timezone, connection, PWA install mode, storage, IndexedDB, camera, notification, route, role, and screen information.

## Security

- Rotate secrets through the deployment platform.
- Do not store secrets in `.env.example` or source control.
- Use HTTPS and secure cookies in production.
- Keep uploaded files within the configured upload root.
- Review accepted risks before scaling to multiple API instances.
