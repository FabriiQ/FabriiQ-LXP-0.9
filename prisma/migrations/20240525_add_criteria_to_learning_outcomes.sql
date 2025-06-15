-- Add criteria fields to learning_outcomes table
ALTER TABLE "learning_outcomes" ADD COLUMN IF NOT EXISTS "has_criteria" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "learning_outcomes" ADD COLUMN IF NOT EXISTS "criteria" JSONB;
ALTER TABLE "learning_outcomes" ADD COLUMN IF NOT EXISTS "performance_levels" JSONB;
