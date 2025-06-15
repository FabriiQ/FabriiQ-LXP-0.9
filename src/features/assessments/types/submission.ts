import { z } from 'zod';
import { SubmissionStatus } from './enums';

/**
 * Submission Types
 * These types define the structure of assessment submissions
 */

// Base submission schema
export const submissionSchema = z.object({
  id: z.string().optional(),
  assessmentId: z.string(),
  studentId: z.string(),
  content: z.record(z.string(), z.any()).optional(), // Answers to questions
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    contentType: z.string(),
    size: z.number(),
  })).optional(),
  score: z.number().optional(),
  grade: z.string().optional(),
  status: z.nativeEnum(SubmissionStatus).default(SubmissionStatus.DRAFT),
  gradingDetails: z.record(z.string(), z.any()).optional(), // Detailed grading information
  feedback: z.string().optional(),
  comments: z.string().optional(),
  submittedAt: z.date().optional(),
  gradedAt: z.date().optional(),
  gradedById: z.string().optional(),
});

// Submission creation schema
export const createSubmissionSchema = submissionSchema.omit({
  id: true,
  score: true,
  grade: true,
  gradingDetails: true,
  gradedAt: true,
  gradedById: true,
});

// Submission update schema
export const updateSubmissionSchema = submissionSchema.partial().extend({
  id: z.string(),
});

// Submission with relations
export const submissionWithRelationsSchema = submissionSchema.extend({
  assessment: z.object({
    id: z.string(),
    title: z.string(),
    maxScore: z.number().optional(),
    passingScore: z.number().optional(),
  }),
  student: z.object({
    id: z.string(),
    name: z.string(),
  }),
  gradedBy: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Grade submission schema
export const gradeSubmissionSchema = z.object({
  id: z.string(),
  score: z.number().min(0),
  feedback: z.string().optional(),
  gradingDetails: z.record(z.string(), z.any()).optional(),
});

// Bulk grade submissions schema
export const bulkGradeSubmissionsSchema = z.object({
  submissions: z.array(gradeSubmissionSchema),
  gradedById: z.string(),
});

// Types derived from schemas
export type Submission = z.infer<typeof submissionSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
export type SubmissionWithRelations = z.infer<typeof submissionWithRelationsSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type BulkGradeSubmissionsInput = z.infer<typeof bulkGradeSubmissionsSchema>;

// Answer types for different question types
export interface MultipleChoiceAnswer {
  questionId: string;
  choiceId: string;
}

export interface MultipleResponseAnswer {
  questionId: string;
  choiceIds: string[];
}

export interface TrueFalseAnswer {
  questionId: string;
  answer: boolean;
}

export interface ShortAnswerAnswer {
  questionId: string;
  answer: string;
}

export interface EssayAnswer {
  questionId: string;
  answer: string;
}

export interface FillInTheBlankAnswer {
  questionId: string;
  answers: Record<string, string>; // blankId -> answer
}

export interface MatchingAnswer {
  questionId: string;
  matches: Record<string, string>; // leftId -> rightId
}

export interface OrderingAnswer {
  questionId: string;
  order: string[]; // Array of item IDs in the order selected by student
}

export interface NumericAnswer {
  questionId: string;
  answer: number;
}
