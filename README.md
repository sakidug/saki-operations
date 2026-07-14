# Saki Operations

**Powered by Saki Tours & Weddings**

Enterprise operations platform for Saki Tours & Weddings and HHCO Helmet Delivery.

Domain: [sakitours.app](https://sakitours.app)

## Architecture

pnpm workspaces + Turborepo monorepo with mirrored frontend/backend modules.

| Path | Package | Role |
|------|---------|------|
| `apps/web` | `@saki-operations/web` | React 19 + Vite (PWA-ready) |
| `apps/api` | `@saki-operations/api` | NestJS API + Prisma + PostgreSQL |
| `packages/ui` | `@saki-operations/ui` | Shared UI (shadcn/ui) |
| `packages/types` | `@saki-operations/types` | Shared TypeScript contracts |
| `packages/config` | `@saki-operations/config` | Shared runtime config |
| `packages/utils` | `@saki-operations/utils` | Shared utilities |
| `packages/constants` | `@saki-operations/constants` | Shared constants |
| `packages/hooks` | `@saki-operations/hooks` | Shared React hooks |
| `packages/i18n` | `@saki-operations/i18n` | English + Sinhala i18n |
| `database` | `@saki-operations/database` | Prisma schema, migrations, seeds, backups |
| `packages/eslint-config` | `@saki-operations/eslint-config` | Shared ESLint configs |
| `packages/typescript-config` | `@saki-operations/typescript-config` | Shared TSConfigs |
| `packages/prettier-config` | `@saki-operations/prettier-config` | Shared Prettier config |

## Prerequisites

- Node.js 20+
- pnpm 9+ (`corepack enable`)
- Docker (optional, for PostgreSQL and full stack)

## Getting started

```bash
pnpm install
cp .env.example .env
docker compose -f docker/docker-compose.yml up postgres -d
pnpm db:generate
pnpm dev
```

- Web: http://localhost:5173
- API health: http://localhost:3000/api/v1/health

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint the monorepo |
| `pnpm format` | Format with Prettier |
| `pnpm typecheck` | Type-check all packages |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run Prisma migrations (dev) |
| `pnpm db:seed` | Seed development sample users (`ALLOW_DEV_SEED=true`) |
| `pnpm db:studio` | Open Prisma Studio |

## Documentation

### Governance (root)

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System structure and how pieces fit together |
| [ROADMAP.md](./ROADMAP.md) | Phased delivery plan |
| [CHANGELOG.md](./CHANGELOG.md) | Versioned change history (SemVer) |
| [VERSIONING.md](./VERSIONING.md) | Versioning policy |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development rules and workflow |
| [STANDARDS.md](./STANDARDS.md) | Naming, commits, branches, API/DB conventions |
| [DECISIONS.md](./DECISIONS.md) | Architecture Decision Records |
| [SECURITY.md](./SECURITY.md) | Security policies |
| [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) | Bugs and technical debt tracker |

### Product docs

Numbered folders under `docs/` (detailed content to be added per phase).

**Current version:** v0.3.0 — Authentication

## License

Proprietary — Saki Tours & Weddings. All rights reserved.
