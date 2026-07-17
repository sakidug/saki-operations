-- Operations V2 — vehicle operational status
-- Applied via `prisma migrate` / `db:migrate:deploy`

CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'ON_TRIP', 'SERVICE');

ALTER TABLE "vehicles" ADD COLUMN "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE';

CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");
