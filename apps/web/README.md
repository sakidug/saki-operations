# Web application (`@saki-operations/web`)

React 19 + Vite + Tailwind CSS + shadcn/ui + Framer Motion.

## Local development

```bash
# from monorepo root
pnpm --filter @saki-operations/web dev
# or
pnpm dev:web
```

Runs Vite HMR on http://localhost:5173. Local development is unchanged.

## Production (Railway)

Production **must not** use `vite` / `pnpm … dev`. Build static assets, then serve `dist` with a production static server.

| Step | Command |
|------|---------|
| Build | `pnpm --filter @saki-operations/web build` (builds `types` + `constants` first) |
| Start | `pnpm --filter @saki-operations/web start` |

`start` serves `apps/web/dist` with SPA fallback (`serve -s`) on `0.0.0.0:$PORT` (default `4173` locally).

Optional local check of a production build:

```bash
pnpm --filter @saki-operations/web build
pnpm --filter @saki-operations/web start
# or: pnpm --filter @saki-operations/web preview
```

See [docs/railway.md](../../docs/railway.md) for full Railway service settings.

## Phase 3 — App Shell

- Splash + bootstrap lifecycle
- Language first-run gate
- Routing + reusable layouts
- Responsive navigation chrome
- Online/offline banner + PWA install/update helpers
- Error + loading experiences

Domain modules remain under `src/modules/*` for later phases.
