-- AlterTable: Add lessonPlanId to Activity
ALTER TABLE "activities" ADD COLUMN "lessonPlanId" TEXT;

-- AlterTable: Add lessonPlanId to Assessment
ALTER TABLE "assessments" ADD COLUMN "lessonPlanId" TEXT;

-- AddForeignKey: Add foreign key from Activity to LessonPlan
ALTER TABLE "activities" ADD CONSTRAINT "activities_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "lesson_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Add foreign key from Assessment to LessonPlan
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "lesson_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: Add index for lessonPlanId in Activity
CREATE INDEX "activities_lessonPlanId_idx" ON "activities"("lessonPlanId");

-- CreateIndex: Add index for lessonPlanId in Assessment
CREATE INDEX "assessments_lessonPlanId_idx" ON "assessments"("lessonPlanId");
