-- Create learning_time_records table
CREATE TABLE "learning_time_records" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "timeSpentMinutes" INTEGER NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL,
  "partitionKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "learning_time_records_pkey" PRIMARY KEY ("id")
);

-- Add indexes for better query performance
CREATE INDEX "learning_time_records_studentId_idx" ON "learning_time_records"("studentId");
CREATE INDEX "learning_time_records_activityId_idx" ON "learning_time_records"("activityId");
CREATE INDEX "learning_time_records_classId_idx" ON "learning_time_records"("classId");
CREATE INDEX "learning_time_records_partitionKey_idx" ON "learning_time_records"("partitionKey");
CREATE INDEX "learning_time_records_completedAt_idx" ON "learning_time_records"("completedAt");
CREATE INDEX "learning_time_records_studentId_completedAt_idx" ON "learning_time_records"("studentId", "completedAt");
CREATE INDEX "learning_time_records_studentId_classId_idx" ON "learning_time_records"("studentId", "classId");

-- Add foreign key constraints
ALTER TABLE "learning_time_records" ADD CONSTRAINT "learning_time_records_studentId_fkey" 
  FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "learning_time_records" ADD CONSTRAINT "learning_time_records_activityId_fkey" 
  FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "learning_time_records" ADD CONSTRAINT "learning_time_records_classId_fkey" 
  FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create a function to automatically update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_learning_time_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before update
CREATE TRIGGER update_learning_time_records_updated_at
BEFORE UPDATE ON "learning_time_records"
FOR EACH ROW
EXECUTE FUNCTION update_learning_time_records_updated_at();
