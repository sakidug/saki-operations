-- Phase 7.0: drop booking / customer / booking-trip domain (ops PWA realignment)

DROP TABLE IF EXISTS "trip_evidence" CASCADE;
DROP TABLE IF EXISTS "booking_activities" CASCADE;
DROP TABLE IF EXISTS "vehicle_assignments" CASCADE;
DROP TABLE IF EXISTS "assistant_assignments" CASCADE;
DROP TABLE IF EXISTS "driver_assignments" CASCADE;
DROP TABLE IF EXISTS "trip_days" CASCADE;
DROP TABLE IF EXISTS "trips" CASCADE;
DROP TABLE IF EXISTS "bookings" CASCADE;
DROP TABLE IF EXISTS "customers" CASCADE;

DROP TYPE IF EXISTS "AssignmentStatus";
DROP TYPE IF EXISTS "EvidenceSyncStatus";
DROP TYPE IF EXISTS "TripEvidenceType";
DROP TYPE IF EXISTS "TripDurationType";
DROP TYPE IF EXISTS "BookingStatus";
DROP TYPE IF EXISTS "BookingType";
