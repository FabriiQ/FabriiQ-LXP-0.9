-- Add institutionId to leaderboard_snapshots table
ALTER TABLE "leaderboard_snapshots" ADD COLUMN "institutionId" TEXT;

-- Create index on institutionId
CREATE INDEX "leaderboard_snapshots_institutionId_idx" ON "leaderboard_snapshots" ("institutionId");

-- Update partition key to include institutionId
ALTER TABLE "leaderboard_snapshots" DROP COLUMN "partitionKey";
ALTER TABLE "leaderboard_snapshots" ADD COLUMN "partitionKey" TEXT GENERATED ALWAYS AS ("institutionId" || '_' || type || '_' || date_trunc('month', "snapshotDate")::text) STORED;

-- Add institutionId to archived_leaderboard_snapshots table
ALTER TABLE "archived_leaderboard_snapshots" ADD COLUMN "institutionId" TEXT;

-- Create index on institutionId for archived table
CREATE INDEX "archived_leaderboard_snapshots_institutionId_idx" ON "archived_leaderboard_snapshots" ("institutionId");

-- Add foreign key constraints
ALTER TABLE "leaderboard_snapshots" ADD CONSTRAINT "leaderboard_snapshots_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "archived_leaderboard_snapshots" ADD CONSTRAINT "archived_leaderboard_snapshots_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
