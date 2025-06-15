# Lesson Plan Relations

This document describes the implementation of relations between Lesson Plans, Activities, and Assessments.

## Schema Changes

The following changes were made to the Prisma schema:

1. Added `lessonPlanId` field to the `Activity` model:
   ```prisma
   model Activity {
     // existing fields...
     lessonPlanId   String? // New field for lesson plan association
     // existing fields...
     
     // Relationships
     // existing relationships...
     lessonPlan     LessonPlan?     @relation(fields: [lessonPlanId], references: [id])
     // existing relationships...
     
     @@index([lessonPlanId]) // New index for lesson plan association
   }
   ```

2. Added `lessonPlanId` field to the `Assessment` model:
   ```prisma
   model Assessment {
     // existing fields...
     lessonPlanId   String? // New field for lesson plan association
     // existing fields...
     
     // Relationships
     // existing relationships...
     lessonPlan     LessonPlan?     @relation(fields: [lessonPlanId], references: [id])
     // existing relationships...
     
     @@index([lessonPlanId]) // New index for lesson plan association
   }
   ```

3. Added relations to the `LessonPlan` model:
   ```prisma
   model LessonPlan {
     // existing fields...
     
     // Relations
     // existing relations...
     activities          Activity[]       // Activities associated with this lesson plan
     assessments         Assessment[]     // Assessments associated with this lesson plan
   }
   ```

## Migration

A migration file was created to add these fields to the database:

```sql
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
```

## Usage

With these changes, you can now:

1. Associate activities with lesson plans:
   ```javascript
   // Create an activity linked to a lesson plan
   const activity = await prisma.activity.create({
     data: {
       title: "Activity Title",
       // other activity fields...
       lessonPlan: {
         connect: { id: lessonPlanId }
       }
     }
   });
   
   // Or update an existing activity
   const updatedActivity = await prisma.activity.update({
     where: { id: activityId },
     data: {
       lessonPlan: {
         connect: { id: lessonPlanId }
       }
     }
   });
   ```

2. Associate assessments with lesson plans:
   ```javascript
   // Create an assessment linked to a lesson plan
   const assessment = await prisma.assessment.create({
     data: {
       title: "Assessment Title",
       // other assessment fields...
       lessonPlan: {
         connect: { id: lessonPlanId }
       }
     }
   });
   
   // Or update an existing assessment
   const updatedAssessment = await prisma.assessment.update({
     where: { id: assessmentId },
     data: {
       lessonPlan: {
         connect: { id: lessonPlanId }
       }
     }
   });
   ```

3. Query activities and assessments for a lesson plan:
   ```javascript
   const lessonPlan = await prisma.lessonPlan.findUnique({
     where: { id: lessonPlanId },
     include: {
       activities: true,
       assessments: true
     }
   });
   
   // Access the activities and assessments
   const activities = lessonPlan.activities;
   const assessments = lessonPlan.assessments;
   ```

## Implementation Notes

- The `lessonPlanId` field is optional (`String?`), allowing activities and assessments to exist without being associated with a lesson plan.
- Indexes were added to improve query performance when filtering activities or assessments by lesson plan.
- The relations use `ON DELETE SET NULL`, meaning if a lesson plan is deleted, the associated activities and assessments will remain but their `lessonPlanId` will be set to `null`.
