-- Leaderboard Partitioning Migration
-- This migration converts the leaderboard_snapshots table to a partitioned table
-- and creates partitions for different time periods and entity types

-- Step 1: Create a temporary table with the same structure
CREATE TABLE "leaderboard_snapshots_temp" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entries" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
    "timeGranularity" TEXT NOT NULL DEFAULT 'all-time', -- New column for time granularity
    "partitionKey" TEXT GENERATED ALWAYS AS (type || '_' || date_trunc('month', "snapshotDate")::text) STORED, -- Partition key

    CONSTRAINT "leaderboard_snapshots_temp_pkey" PRIMARY KEY ("id")
);

-- Step 2: Copy data from the original table to the temporary table
INSERT INTO "leaderboard_snapshots_temp" (
    "id", "type", "referenceId", "snapshotDate", "entries", "metadata", "createdAt", "status"
)
SELECT 
    "id", "type", "referenceId", "snapshotDate", "entries", "metadata", "createdAt", "status"
FROM "leaderboard_snapshots";

-- Step 3: Drop the original table and its indexes
DROP TABLE "leaderboard_snapshots";

-- Step 4: Create the new partitioned table
CREATE TABLE "leaderboard_snapshots" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entries" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
    "timeGranularity" TEXT NOT NULL DEFAULT 'all-time', -- Time granularity (daily, weekly, monthly, all-time)
    "partitionKey" TEXT GENERATED ALWAYS AS (type || '_' || date_trunc('month', "snapshotDate")::text) STORED, -- Partition key

    CONSTRAINT "leaderboard_snapshots_pkey" PRIMARY KEY ("id", "partitionKey")
) PARTITION BY LIST ("partitionKey");

-- Step 5: Create partitions for different entity types and time periods
-- Class partitions by month (last 12 months)
CREATE TABLE "leaderboard_snapshots_class_current" 
    PARTITION OF "leaderboard_snapshots" 
    FOR VALUES IN ('CLASS_' || date_trunc('month', CURRENT_DATE)::text);

CREATE TABLE "leaderboard_snapshots_class_prev1" 
    PARTITION OF "leaderboard_snapshots" 
    FOR VALUES IN ('CLASS_' || date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::text);

CREATE TABLE "leaderboard_snapshots_class_prev2" 
    PARTITION OF "leaderboard_snapshots" 
    FOR VALUES IN ('CLASS_' || date_trunc('month', CURRENT_DATE - INTERVAL '2 month')::text);

-- Subject partitions by month (last 12 months)
CREATE TABLE "leaderboard_snapshots_subject_current" 
    PARTITION OF "leaderboard_snapshots" 
    FOR VALUES IN ('SUBJECT_' || date_trunc('month', CURRENT_DATE)::text);

CREATE TABLE "leaderboard_snapshots_subject_prev1" 
    PARTITION OF "leaderboard_snapshots" 
    FOR VALUES IN ('SUBJECT_' || date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::text);

CREATE TABLE "leaderboard_snapshots_subject_prev2" 
    PARTITION OF "leaderboard_snapshots" 
    FOR VALUES IN ('SUBJECT_' || date_trunc('month', CURRENT_DATE - INTERVAL '2 month')::text);

-- Campus partitions by month (last 12 months)
CREATE TABLE "leaderboard_snapshots_campus_current" 
    PARTITION OF "leaderboard_snapshots" 
    FOR VALUES IN ('CAMPUS_' || date_trunc('month', CURRENT_DATE)::text);

CREATE TABLE "leaderboard_snapshots_campus_prev1" 
    PARTITION OF "leaderboard_snapshots" 
    FOR VALUES IN ('CAMPUS_' || date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::text);

CREATE TABLE "leaderboard_snapshots_campus_prev2" 
    PARTITION OF "leaderboard_snapshots" 
    FOR VALUES IN ('CAMPUS_' || date_trunc('month', CURRENT_DATE - INTERVAL '2 month')::text);

-- Default partition for older data
CREATE TABLE "leaderboard_snapshots_default" PARTITION OF "leaderboard_snapshots" DEFAULT;

-- Step 6: Copy data from the temporary table to the new partitioned table
INSERT INTO "leaderboard_snapshots" (
    "id", "type", "referenceId", "snapshotDate", "entries", "metadata", "createdAt", "status", "timeGranularity"
)
SELECT 
    "id", "type", "referenceId", "snapshotDate", "entries", "metadata", "createdAt", "status", "timeGranularity"
FROM "leaderboard_snapshots_temp";

-- Step 7: Drop the temporary table
DROP TABLE "leaderboard_snapshots_temp";

-- Step 8: Create indexes on the partitioned table
CREATE INDEX "leaderboard_snapshots_type_referenceId_idx" ON "leaderboard_snapshots" ("type", "referenceId");
CREATE INDEX "leaderboard_snapshots_snapshotDate_idx" ON "leaderboard_snapshots" ("snapshotDate");
CREATE INDEX "leaderboard_snapshots_status_idx" ON "leaderboard_snapshots" ("status");
CREATE INDEX "leaderboard_snapshots_type_idx" ON "leaderboard_snapshots" ("type");
CREATE INDEX "leaderboard_snapshots_referenceId_idx" ON "leaderboard_snapshots" ("referenceId");
CREATE INDEX "leaderboard_snapshots_type_snapshotDate_idx" ON "leaderboard_snapshots" ("type", "snapshotDate");
CREATE INDEX "leaderboard_snapshots_referenceId_snapshotDate_idx" ON "leaderboard_snapshots" ("referenceId", "snapshotDate");
CREATE INDEX "leaderboard_snapshots_timeGranularity_idx" ON "leaderboard_snapshots" ("timeGranularity");
CREATE INDEX "leaderboard_snapshots_partitionKey_idx" ON "leaderboard_snapshots" ("partitionKey");

-- Step 9: Create archive table for historical data
CREATE TABLE "archived_leaderboard_snapshots" (
    "id" TEXT NOT NULL,
    "originalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "entries" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeGranularity" TEXT NOT NULL DEFAULT 'all-time',
    "academicYear" TEXT,
    "termId" TEXT,

    CONSTRAINT "archived_leaderboard_snapshots_pkey" PRIMARY KEY ("id")
);

-- Create indexes on the archive table
CREATE INDEX "archived_leaderboard_snapshots_type_referenceId_idx" ON "archived_leaderboard_snapshots" ("type", "referenceId");
CREATE INDEX "archived_leaderboard_snapshots_snapshotDate_idx" ON "archived_leaderboard_snapshots" ("snapshotDate");
CREATE INDEX "archived_leaderboard_snapshots_academicYear_idx" ON "archived_leaderboard_snapshots" ("academicYear");
CREATE INDEX "archived_leaderboard_snapshots_termId_idx" ON "archived_leaderboard_snapshots" ("termId");
CREATE INDEX "archived_leaderboard_snapshots_timeGranularity_idx" ON "archived_leaderboard_snapshots" ("timeGranularity");
