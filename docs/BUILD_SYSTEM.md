# Build System

## Toolchain

Saki Operations uses pnpm workspaces and Turborepo. TypeScript is used across Web, API, and shared packages.

## Build identity

The root `package.json` version is the only manually maintained application version.

`scripts/generate-build-meta.mjs` generates `packages/build-info/src/generated.ts` with:

- Application name
- Root package version
- Short Git commit SHA
- UTC build timestamp
- Development, staging, or production environment
- Company, support, platform, license, and Sync Engine identity

Git SHA is resolved from common CI variables first, then from `git rev-parse --short=7 HEAD`. Environment is resolved from `APP_ENV`, `VITE_APP_ENV`, `NODE_ENV`, or Vite mode.

## Commands

```bash
pnpm install
pnpm build:meta
pnpm typecheck
pnpm build
```

Web and API build scripts regenerate metadata automatically. Do not edit `generated.ts` manually.

## Release workflow

1. Update root `package.json` version.
2. Commit and push.
3. CI builds Web and API.
4. Build metadata captures the commit, environment, and timestamp.
5. Deploy the generated artifacts.

No React component, constants file, or environment variable requires a version-number edit.
