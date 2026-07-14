-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('wedding_hire', 'airport_transfer', 'tour');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM (
  'quotation',
  'pending_confirmation',
  'confirmed',
  'driver_assigned',
  'vehicle_dispatched',
  'trip_started',
  'trip_in_progress',
  'trip_completed',
  'verified_by_office',
  'closed',
  'cancelled',
  'on_hold'
);

-- CreateEnum
CREATE TYPE "TripDurationType" AS ENUM ('single_day', 'multi_day');

-- CreateEnum
CREATE TYPE "TripEvidenceType" AS ENUM (
  'garage_departure',
  'garage_return',
  'vehicle_photo',
  'additional'
);

-- CreateEnum
CREATE TYPE "EvidenceSyncStatus" AS ENUM ('pending', 'synced', 'failed');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('scheduled', 'active', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "label" TEXT,
    "make" TEXT,
    "model" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "reference_code" TEXT NOT NULL,
    "type" "BookingType" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'quotation',
    "status_before_hold" "BookingStatus",
    "trip_duration_type" "TripDurationType" NOT NULL,
    "customer_id" TEXT NOT NULL,
    "title" TEXT,
    "notes" TEXT,
    "quotation_notes" TEXT,
    "scheduled_start_at" TIMESTAMP(3) NOT NULL,
    "scheduled_end_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_days" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "start_work_time" TIMESTAMP(3),
    "end_work_time" TIMESTAMP(3),
    "garage_departure_time" TIMESTAMP(3),
    "garage_return_time" TIMESTAMP(3),
    "start_location" TEXT,
    "destination" TEXT,
    "ending_location" TEXT,
    "odometer_start" INTEGER,
    "odometer_end" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_assignments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'scheduled',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_assignments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "assistant_id" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'scheduled',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_assignments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'scheduled',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_activities" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT,
    "from_status" "BookingStatus",
    "to_status" "BookingStatus",
    "message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_evidence" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "trip_day_id" TEXT,
    "type" "TripEvidenceType" NOT NULL,
    "storage_key" TEXT,
    "client_local_id" TEXT,
    "sync_status" "EvidenceSyncStatus" NOT NULL DEFAULT 'pending',
    "mime_type" TEXT,
    "byte_size" INTEGER,
    "captured_at" TIMESTAMP(3),
    "uploaded_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");
CREATE INDEX "customers_name_idx" ON "customers"("name");
CREATE UNIQUE INDEX "vehicles_registration_number_key" ON "vehicles"("registration_number");
CREATE UNIQUE INDEX "bookings_reference_code_key" ON "bookings"("reference_code");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "bookings_type_idx" ON "bookings"("type");
CREATE INDEX "bookings_customer_id_idx" ON "bookings"("customer_id");
CREATE INDEX "bookings_scheduled_start_at_scheduled_end_at_idx" ON "bookings"("scheduled_start_at", "scheduled_end_at");
CREATE INDEX "bookings_created_by_id_idx" ON "bookings"("created_by_id");
CREATE UNIQUE INDEX "trips_booking_id_key" ON "trips"("booking_id");
CREATE UNIQUE INDEX "trip_days_trip_id_day_number_key" ON "trip_days"("trip_id", "day_number");
CREATE INDEX "trip_days_trip_id_idx" ON "trip_days"("trip_id");
CREATE INDEX "driver_assignments_booking_id_idx" ON "driver_assignments"("booking_id");
CREATE INDEX "driver_assignments_driver_id_starts_at_ends_at_idx" ON "driver_assignments"("driver_id", "starts_at", "ends_at");
CREATE INDEX "driver_assignments_status_idx" ON "driver_assignments"("status");
CREATE INDEX "assistant_assignments_booking_id_idx" ON "assistant_assignments"("booking_id");
CREATE INDEX "assistant_assignments_assistant_id_starts_at_ends_at_idx" ON "assistant_assignments"("assistant_id", "starts_at", "ends_at");
CREATE INDEX "assistant_assignments_status_idx" ON "assistant_assignments"("status");
CREATE INDEX "vehicle_assignments_booking_id_idx" ON "vehicle_assignments"("booking_id");
CREATE INDEX "vehicle_assignments_vehicle_id_starts_at_ends_at_idx" ON "vehicle_assignments"("vehicle_id", "starts_at", "ends_at");
CREATE INDEX "vehicle_assignments_status_idx" ON "vehicle_assignments"("status");
CREATE INDEX "booking_activities_booking_id_created_at_idx" ON "booking_activities"("booking_id", "created_at");
CREATE INDEX "booking_activities_action_idx" ON "booking_activities"("action");
CREATE INDEX "booking_activities_actor_id_idx" ON "booking_activities"("actor_id");
CREATE UNIQUE INDEX "trip_evidence_client_local_id_key" ON "trip_evidence"("client_local_id");
CREATE INDEX "trip_evidence_trip_id_idx" ON "trip_evidence"("trip_id");
CREATE INDEX "trip_evidence_trip_day_id_idx" ON "trip_evidence"("trip_day_id");
CREATE INDEX "trip_evidence_type_idx" ON "trip_evidence"("type");
CREATE INDEX "trip_evidence_sync_status_idx" ON "trip_evidence"("sync_status");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trips" ADD CONSTRAINT "trips_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_days" ADD CONSTRAINT "trip_days_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assistant_assignments" ADD CONSTRAINT "assistant_assignments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assistant_assignments" ADD CONSTRAINT "assistant_assignments_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_activities" ADD CONSTRAINT "booking_activities_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_activities" ADD CONSTRAINT "booking_activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "trip_evidence" ADD CONSTRAINT "trip_evidence_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_evidence" ADD CONSTRAINT "trip_evidence_trip_day_id_fkey" FOREIGN KEY ("trip_day_id") REFERENCES "trip_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "trip_evidence" ADD CONSTRAINT "trip_evidence_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
