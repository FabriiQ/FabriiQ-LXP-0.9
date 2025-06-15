-- Add learning time fields to ActivityGrade model
ALTER TABLE "activity_grades" ADD COLUMN "timeSpentMinutes" INTEGER;
ALTER TABLE "activity_grades" ADD COLUMN "learningStartedAt" TIMESTAMP(3);
ALTER TABLE "activity_grades" ADD COLUMN "learningCompletedAt" TIMESTAMP(3);

-- Add indexes for learning time fields
CREATE INDEX "activity_grades_timeSpentMinutes_idx" ON "activity_grades"("timeSpentMinutes");
CREATE INDEX "activity_grades_learningStartedAt_idx" ON "activity_grades"("learningStartedAt");
CREATE INDEX "activity_grades_learningCompletedAt_idx" ON "activity_grades"("learningCompletedAt");

-- Add lessonPlanId to Activity model if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'activities' AND column_name = 'lessonPlanId') THEN
        ALTER TABLE "activities" ADD COLUMN "lessonPlanId" TEXT;
        CREATE INDEX "activities_lessonPlanId_idx" ON "activities"("lessonPlanId");
    END IF;
END
$$;
