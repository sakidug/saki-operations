# API application (`@saki-operations/api`)

NestJS + PostgreSQL + Prisma + JWT-ready config + Cloudflare R2 config.

Domain modules live in `src/modules/*` and must mirror `apps/web/src/modules/*`.

Cross-cutting concerns live in `src/common` and `src/infrastructure`.
Prisma schema and migrations live in `/database`.
