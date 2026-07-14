# Database seeds

Development-only sample data. **Never run in production.**

## Guards

1. `NODE_ENV` must not be `production`
2. `ALLOW_DEV_SEED` must be exactly `true`

## Usage

```bash
# From repo root (requires DATABASE_URL in .env)
ALLOW_DEV_SEED=true pnpm db:seed
```

Optional: set `DEV_SEED_PASSWORD` (min 12 chars). If unset, the seeder uses its local default for convenience.

Sample employee IDs created by `dev-users.ts` are for local login only and are not bootstrapped by the API.
