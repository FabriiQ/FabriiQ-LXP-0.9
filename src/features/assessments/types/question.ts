import { z } from 'zod';

/**
 * Question Types
 * These types define the structure of assessment questions
 */

// Question types enum
export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  MULTIPLE_RESPONSE = 'MULTIPLE_RESPONSE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY',
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
  MATCHING = 'MATCHING',
  ORDERING = 'ORDERING',
  NUMERIC = 'NUMERIC',
}

// Question difficulty enum
export enum QuestionDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

// Base question schema
export const baseQuestionSchema = z.object({
  id: z.string().optional(),
  type: z.nativeEnum(QuestionType),
  text: z.string().min(1, 'Question text is required'),
  points: z.number().min(0).default(1),
  difficulty: z.nativeEnum(QuestionDifficulty).default(QuestionDifficulty.MEDIUM),
  bloomsLevel: z.string().optional(),
  topicId: z.string().optional(),
  explanation: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Multiple choice question schema
export const multipleChoiceQuestionSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.MULTIPLE_CHOICE),
  choices: z.array(z.object({
    id: z.string().optional(),
    text: z.string().min(1, 'Choice text is required'),
    isCorrect: z.boolean().default(false),
  })).min(2, 'At least 2 choices are required'),
});

// Multiple response question schema
export const multipleResponseQuestionSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.MULTIPLE_RESPONSE),
  choices: z.array(z.object({
    id: z.string().optional(),
    text: z.string().min(1, 'Choice text is required'),
    isCorrect: z.boolean().default(false),
  })).min(2, 'At least 2 choices are required'),
});

// True/False question schema
export const trueFalseQuestionSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.TRUE_FALSE),
  correctAnswer: z.boolean(),
});

// Short answer question schema
export const shortAnswerQuestionSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.SHORT_ANSWER),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  acceptableAnswers: z.array(z.string()).optional(),
});

// Essay question schema
export const essayQuestionSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.ESSAY),
  rubric: z.array(z.object({
    criterion: z.string(),
    points: z.number(),
    levels: z.array(z.object({
      description: z.string(),
      score: z.number(),
    })),
  })).optional(),
});

// Fill in the blank question schema
export const fillInTheBlankQuestionSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.FILL_IN_THE_BLANK),
  blanks: z.array(z.object({
    id: z.string().optional(),
    correctAnswer: z.string().min(1, 'Correct answer is required'),
    acceptableAnswers: z.array(z.string()).optional(),
  })).min(1, 'At least 1 blank is required'),
});

// Matching question schema
export const matchingQuestionSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.MATCHING),
  pairs: z.array(z.object({
    id: z.string().optional(),
    left: z.string().min(1, 'Left item is required'),
    right: z.string().min(1, 'Right item is required'),
  })).min(2, 'At least 2 pairs are required'),
});

// Ordering question schema
export const orderingQuestionSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.ORDERING),
  items: z.array(z.object({
    id: z.string().optional(),
    text: z.string().min(1, 'Item text is required'),
    correctPosition: z.number().min(0),
  })).min(2, 'At least 2 items are required'),
});

// Numeric question schema
export const numericQuestionSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.NUMERIC),
  correctAnswer: z.number(),
  tolerance: z.number().min(0).default(0),
  unit: z.string().optional(),
});

// Combined question schema (union of all question types)
export const questionSchema = z.discriminatedUnion('type', [
  multipleChoiceQuestionSchema,
  multipleResponseQuestionSchema,
  trueFalseQuestionSchema,
  shortAnswerQuestionSchema,
  essayQuestionSchema,
  fillInTheBlankQuestionSchema,
  matchingQuestionSchema,
  orderingQuestionSchema,
  numericQuestionSchema,
]);

// Types derived from schemas
export type BaseQuestion = z.infer<typeof baseQuestionSchema>;
export type MultipleChoiceQuestion = z.infer<typeof multipleChoiceQuestionSchema>;
export type MultipleResponseQuestion = z.infer<typeof multipleResponseQuestionSchema>;
export type TrueFalseQuestion = z.infer<typeof trueFalseQuestionSchema>;
export type ShortAnswerQuestion = z.infer<typeof shortAnswerQuestionSchema>;
export type EssayQuestion = z.infer<typeof essayQuestionSchema>;
export type FillInTheBlankQuestion = z.infer<typeof fillInTheBlankQuestionSchema>;
export type MatchingQuestion = z.infer<typeof matchingQuestionSchema>;
export type OrderingQuestion = z.infer<typeof orderingQuestionSchema>;
export type NumericQuestion = z.infer<typeof numericQuestionSchema>;
export type Question = z.infer<typeof questionSchema>;
