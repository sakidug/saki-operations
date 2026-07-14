# Railway deployment

Saki Operations is a **pnpm + Turborepo monorepo**. Deploy API and web as **separate Railway services** from the same repo. Keep each service’s **Root Directory** at the **repository root** so workspace packages resolve.

---

## Web service (`@saki-operations/web`)

Vite builds a static SPA. Railway must **build** that output, then **serve** `apps/web/dist` — never run the Vite **dev** server in production.

### Do not use

```bash
pnpm --filter @saki-operations/web dev
```

That is local HMR only and is not acceptable for production.

### Railway settings

| Setting | Value |
|---------|--------|
| Root Directory | `/` (monorepo root) |
| Install Command | `pnpm install --frozen-lockfile` *(or leave default with Corepack/pnpm)* |
| Build Command | `pnpm exec turbo run build --filter=@saki-operations/web` |
| Start Command | `pnpm --filter @saki-operations/web start` |
| Watch paths (optional) | `apps/web/**`, `packages/**` |

Equivalent explicit build (same dependency order):

```bash
pnpm --filter @saki-operations/types build \
  && pnpm --filter @saki-operations/constants build \
  && pnpm --filter @saki-operations/web build
```

`@saki-operations/web`’s own `build` script also builds `types` then `constants` first, so a plain `pnpm --filter @saki-operations/web build` after install is enough.

### Why `types` + `constants` must exist before web typecheck

Web imports `@saki-operations/forms` (public package entry). Forms sources import `@saki-operations/types` and `@saki-operations/constants`. Those packages expose **compiled** `dist` for runtime `import`/`require`. If `dist` is missing, TypeScript reports `TS2307` against forms files such as `schemas/primitives.ts` and the selectors — not because the app imports `../../packages/.../src`, but because those public packages cannot resolve their dist builds yet.

### What `start` does

Defined in `apps/web/package.json`:

```text
serve dist -s -n -l tcp://0.0.0.0:${PORT:-4173}
```

- Serves the Vite `dist` folder
- `-s` — SPA fallback to `index.html` (React Router)
- Binds Railway’s `PORT` on all interfaces
- Does **not** run Vite

### Build-time env (Vite)

Set on the Railway **web** service (available at build time):

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Public API base URL (e.g. `https://api.example.com/api/v1`) |
| `VITE_APP_NAME` | Optional display name |
| `VITE_APP_TAGLINE` | Optional tagline |

Only `VITE_*` values are embedded in the client bundle. Do not put secrets in Vite env.

### Local verification (same path as Railway)

```bash
pnpm install
pnpm --filter @saki-operations/web build
PORT=4173 pnpm --filter @saki-operations/web start
```

Or with Turbo (builds workspace `^build` graph automatically):

```bash
pnpm exec turbo run build --filter=@saki-operations/web
```

---

## API service (`@saki-operations/api`)

| Setting | Value |
|---------|--------|
| Root Directory | `/` |
| Build Command | `pnpm --filter @saki-operations/types build && pnpm --filter @saki-operations/database db:generate && pnpm --filter @saki-operations/api build` |
| Start Command | `pnpm --filter @saki-operations/api start` |

Configure `DATABASE_URL`, JWT secrets, and other API env on the API service (see `.env.example`).

---

## Docker alternative

`docker/Dockerfile.web` still builds the SPA and serves it with **nginx** (compose / self-host). Railway’s Node path above uses **`serve`** instead of nginx so Nixpacks/Node can run a normal start command without a custom image.
