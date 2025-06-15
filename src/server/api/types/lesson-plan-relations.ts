/**
 * Type definitions for lesson plan relations with activities and assessments
 */
import { z } from "zod";
import { SystemStatus } from "@prisma/client";

/**
 * Schema for filtering activities by lesson plan
 */
export const activityLessonPlanFilterSchema = z.object({
  lessonPlanId: z.string().optional(),
});

/**
 * Type for filtering activities by lesson plan
 */
export type ActivityLessonPlanFilter = z.infer<typeof activityLessonPlanFilterSchema>;

/**
 * Schema for filtering assessments by lesson plan
 */
export const assessmentLessonPlanFilterSchema = z.object({
  lessonPlanId: z.string().optional(),
});

/**
 * Type for filtering assessments by lesson plan
 */
export type AssessmentLessonPlanFilter = z.infer<typeof assessmentLessonPlanFilterSchema>;

/**
 * Schema for creating an activity with lesson plan
 */
export const createActivityWithLessonPlanSchema = z.object({
  lessonPlanId: z.string().optional(),
});

/**
 * Schema for updating an activity with lesson plan
 */
export const updateActivityWithLessonPlanSchema = z.object({
  lessonPlanId: z.string().optional().nullable(),
});

/**
 * Schema for creating an assessment with lesson plan
 */
export const createAssessmentWithLessonPlanSchema = z.object({
  lessonPlanId: z.string().optional(),
});

/**
 * Schema for updating an assessment with lesson plan
 */
export const updateAssessmentWithLessonPlanSchema = z.object({
  lessonPlanId: z.string().optional().nullable(),
});
