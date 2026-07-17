-- Phase 9.2 Saki Sync tables
-- Applied via `prisma migrate` / `db:migrate:deploy`

CREATE TYPE "SyncAckStatus" AS ENUM ('accepted', 'duplicate', 'conflict', 'rejected');

CREATE TABLE "sync_events" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "ack_status" "SyncAckStatus" NOT NULL DEFAULT 'accepted',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sync_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sync_events_event_id_key" ON "sync_events"("event_id");
CREATE INDEX "sync_events_entity_type_entity_id_idx" ON "sync_events"("entity_type", "entity_id");
CREATE INDEX "sync_events_user_id_occurred_at_idx" ON "sync_events"("user_id", "occurred_at");
CREATE INDEX "sync_events_event_type_idx" ON "sync_events"("event_type");

CREATE TABLE "sync_entity_states" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "last_event_id" TEXT,
    "last_device_id" TEXT,
    "last_user_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sync_entity_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sync_entity_states_entity_type_entity_id_key" ON "sync_entity_states"("entity_type", "entity_id");

CREATE TABLE "sync_audit_logs" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "previous_value" JSONB,
    "new_value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sync_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sync_audit_logs_event_id_idx" ON "sync_audit_logs"("event_id");
CREATE INDEX "sync_audit_logs_user_id_created_at_idx" ON "sync_audit_logs"("user_id", "created_at");

CREATE TABLE "sync_blobs" (
    "id" TEXT NOT NULL,
    "local_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "public_url" TEXT,
    "event_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sync_blobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sync_blobs_local_id_key" ON "sync_blobs"("local_id");
CREATE INDEX "sync_blobs_user_id_idx" ON "sync_blobs"("user_id");
