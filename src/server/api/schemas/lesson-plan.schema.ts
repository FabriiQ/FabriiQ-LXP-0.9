import { z } from "zod";
import { BloomsTaxonomyLevel } from "@/features/bloom/types";

// Define SystemStatus enum since it's not exported from Prisma
export enum SystemStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DRAFT = "DRAFT",
  ARCHIVED = "ARCHIVED",
  DELETED = "DELETED"
}



// Define LessonPlanType enum since it's not exported from Prisma
export enum LessonPlanType {
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY"
}

// Define LessonPlanStatus enum since it's not exported from Prisma
export enum LessonPlanStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  COORDINATOR_APPROVED = "COORDINATOR_APPROVED",
  ADMIN_APPROVED = "ADMIN_APPROVED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PUBLISHED = "PUBLISHED"
}

// Base schema for lesson plan content
export const lessonPlanContentSchema = z.object({
  learningObjectives: z.array(z.string()),
  topics: z.array(z.string()),
  teachingMethods: z.array(z.string()),
  bloomsDistribution: z.record(z.nativeEnum(BloomsTaxonomyLevel), z.number()).optional(),
  learningOutcomeIds: z.array(z.string()).optional(),
  resources: z.array(z.object({
    id: z.string().optional(),
    type: z.string(),
    name: z.string(),
    description: z.string().optional(),
    url: z.string().optional()
  })),
  activities: z.array(z.object({
    id: z.string().optional(),
    type: z.string(),
    name: z.string(),
    description: z.string().optional(),
    date: z.string().optional(),
    bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional()
  })),
  assessments: z.array(z.object({
    id: z.string().optional(),
    type: z.string(),
    name: z.string(),
    description: z.string().optional(),
    date: z.string().optional(),
    bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional()
  })),
  homework: z.array(z.object({
    description: z.string(),
    dueDate: z.string().optional()
  })),
  notes: z.string().optional()
});

// Schema for creating a lesson plan
export const createLessonPlanSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  teacherId: z.string(),
  classId: z.string(),
  subjectId: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  planType: z.nativeEnum(LessonPlanType),
  content: lessonPlanContentSchema
});

// Schema for updating a lesson plan
export const updateLessonPlanSchema = z.object({
  id: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().optional(),
  subjectId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  planType: z.nativeEnum(LessonPlanType).optional(),
  content: lessonPlanContentSchema.optional(),
  status: z.nativeEnum(LessonPlanStatus).optional()
});

// Schema for submitting a lesson plan for review
export const submitLessonPlanSchema = z.object({
  id: z.string()
});

// Schema for coordinator approval
export const coordinatorApproveSchema = z.object({
  id: z.string(),
  note: z.string().optional()
});

// Schema for coordinator rejection
export const coordinatorRejectSchema = z.object({
  id: z.string(),
  note: z.string().min(1, "Rejection reason is required")
});

// Schema for admin approval
export const adminApproveSchema = z.object({
  id: z.string(),
  note: z.string().optional()
});

// Schema for admin rejection
export const adminRejectSchema = z.object({
  id: z.string(),
  note: z.string().min(1, "Rejection reason is required")
});

// Schema for adding reflection
export const addReflectionSchema = z.object({
  id: z.string(),
  reflection: z.string().min(1, "Reflection cannot be empty")
});

// Schema for querying lesson plans
export const lessonPlanQuerySchema = z.object({
  teacherId: z.string().optional(),
  classId: z.string().optional(),
  classIds: z.array(z.string()).optional(),
  subjectId: z.string().optional(),
  status: z.nativeEnum(LessonPlanStatus).optional(),
  planType: z.nativeEnum(LessonPlanType).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().optional().default(10)
});

// Export types
export type CreateLessonPlanInput = z.infer<typeof createLessonPlanSchema>;
export type UpdateLessonPlanInput = z.infer<typeof updateLessonPlanSchema>;
export type SubmitLessonPlanInput = z.infer<typeof submitLessonPlanSchema>;
export type CoordinatorApproveInput = z.infer<typeof coordinatorApproveSchema>;
export type CoordinatorRejectInput = z.infer<typeof coordinatorRejectSchema>;
export type AdminApproveInput = z.infer<typeof adminApproveSchema>;
export type AdminRejectInput = z.infer<typeof adminRejectSchema>;
export type AddReflectionInput = z.infer<typeof addReflectionSchema>;
export type LessonPlanQueryInput = z.infer<typeof lessonPlanQuerySchema>;
export type LessonPlanContent = z.infer<typeof lessonPlanContentSchema>;
