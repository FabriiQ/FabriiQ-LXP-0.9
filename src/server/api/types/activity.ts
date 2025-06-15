import { Prisma, SystemStatus } from "@prisma/client";
import { ServiceConfig } from "./prisma";
import { SubmissionStatus, ActivityPurpose, LearningActivityType, AssessmentType } from "../constants";
import { z } from "zod";

// Base activity input with common fields
const baseActivityInput = {
  title: z.string().min(1).max(100),
  purpose: z.nativeEnum(ActivityPurpose),
  subjectId: z.string(),
  classId: z.string(),
  content: z.record(z.any()),
  topicId: z.string().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  duration: z.number().int().optional(), // in minutes
};

// Schema for creating a learning activity
export const createLearningActivitySchema = z.object({
  ...baseActivityInput,
  purpose: z.literal(ActivityPurpose.LEARNING),
  learningType: z.nativeEnum(LearningActivityType),
  isGradable: z.boolean().optional().default(false),
});

// Schema for creating an assessment activity
export const createAssessmentActivitySchema = z.object({
  ...baseActivityInput,
  purpose: z.literal(ActivityPurpose.ASSESSMENT),
  assessmentType: z.nativeEnum(AssessmentType),
  isGradable: z.boolean().optional().default(true),
  maxScore: z.number().optional(),
  passingScore: z.number().optional(),
  weightage: z.number().optional(),
  gradingConfig: z.record(z.any()).optional(),
});

// Schema for creating a practice activity
export const createPracticeActivitySchema = z.object({
  ...baseActivityInput,
  purpose: z.literal(ActivityPurpose.PRACTICE),
  assessmentType: z.nativeEnum(AssessmentType),
  isGradable: z.boolean().optional().default(false),
});

// Combined schema for creating any type of activity
export const createActivitySchema = z.discriminatedUnion("purpose", [
  createLearningActivitySchema,
  createAssessmentActivitySchema,
  createPracticeActivitySchema
]);

// Type for activity creation input
export type CreateActivityInput = z.infer<typeof createActivitySchema>;

// Schema for updating an activity
export const updateActivitySchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.record(z.any()).optional(),
  learningType: z.nativeEnum(LearningActivityType).optional(),
  assessmentType: z.nativeEnum(AssessmentType).optional(),
  isGradable: z.boolean().optional(),
  maxScore: z.number().optional(),
  passingScore: z.number().optional(),
  weightage: z.number().optional(),
  gradingConfig: z.record(z.any()).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  duration: z.number().int().optional(),
});

// Type for activity update input
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

export interface ActivityFilters {
  subjectId?: string;
  topicId?: string;
  classId?: string;
  purpose?: ActivityPurpose;
  learningType?: LearningActivityType;
  assessmentType?: AssessmentType;
  isGradable?: boolean;
  search?: string;
  status?: SystemStatus;
}

export interface ActivityServiceConfig extends ServiceConfig {
  defaultStatus?: SystemStatus;
}

// Activity Grade types
export interface CreateActivityGradeInput {
  activityId: string;
  studentId: string;
  score?: number;
  points?: number;
  feedback?: string;
  content?: Prisma.InputJsonValue;
  attachments?: Prisma.InputJsonValue;
  status?: SubmissionStatus;
  gradedById?: string;
  timeSpentMinutes?: number; // Time spent on the activity in minutes
  learningStartedAt?: Date; // When the student started the activity
  learningCompletedAt?: Date; // When the student completed the activity

  // Commitment fields
  isCommitted?: boolean;
  commitmentId?: string;
  commitmentDeadline?: Date;
  commitmentMet?: boolean;
}

export interface UpdateActivityGradeInput {
  score?: number;
  points?: number;
  feedback?: string;
  content?: Prisma.InputJsonValue;
  attachments?: Prisma.InputJsonValue;
  status?: SubmissionStatus;
  gradedById?: string;
  timeSpentMinutes?: number; // Time spent on the activity in minutes
  learningStartedAt?: Date; // When the student started the activity
  learningCompletedAt?: Date; // When the student completed the activity

  // Commitment fields
  isCommitted?: boolean;
  commitmentId?: string;
  commitmentDeadline?: Date;
  commitmentMet?: boolean;
}

export interface ActivityGradeFilters {
  activityId?: string;
  studentId?: string;
  status?: SubmissionStatus;
  search?: string;
}

export interface BatchGradeActivitiesInput {
  activityId: string;
  grades: {
    studentId: string;
    score: number;
    feedback?: string;
  }[];
  gradedById: string;
}