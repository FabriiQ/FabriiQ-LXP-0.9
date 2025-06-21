import { z } from 'zod';

/**
 * Essay Assessment Types
 * Specific types for essay-based assessments
 */

// Essay submission status
export enum EssaySubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  GRADED = 'GRADED',
  RETURNED = 'RETURNED',
}

// AI grading modes
export enum AIGradingMode {
  DISABLED = 'DISABLED',
  MANUAL = 'MANUAL', // Manual grading only
  ASSIST = 'ASSIST', // AI provides suggestions, teacher makes final decision
  AUTO = 'AUTO', // AI grades automatically with teacher review option
  AUTOMATIC = 'AUTOMATIC', // AI grades automatically on submission
}

// Plagiarism detection result
export const plagiarismResultSchema = z.object({
  similarityPercentage: z.number().min(0).max(100),
  sources: z.array(z.object({
    text: z.string(),
    similarity: z.number().min(0).max(100),
    source: z.string().optional(),
    studentId: z.string().optional(),
    submissionId: z.string().optional(),
  })),
  flagged: z.boolean(),
  checkedAt: z.date(),
});

// AI grading result
export const aiGradingResultSchema = z.object({
  overallScore: z.number().min(0),
  maxScore: z.number().min(0),
  percentage: z.number().min(0).max(100),
  criteriaScores: z.array(z.object({
    criterionId: z.string(),
    score: z.number().min(0),
    maxScore: z.number().min(0),
    feedback: z.string(),
    confidence: z.number().min(0).max(1), // AI confidence level
  })),
  overallFeedback: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  bloomsLevelAnalysis: z.record(z.string(), z.number()).optional(),
  gradedAt: z.date(),
  model: z.string(), // AI model used
  confidence: z.number().min(0).max(1), // Overall confidence
});

// Essay submission schema
export const essaySubmissionSchema = z.object({
  id: z.string().optional(),
  assessmentId: z.string(),
  studentId: z.string(),
  content: z.string().min(1, 'Essay content is required'),
  wordCount: z.number().min(0),
  status: z.nativeEnum(EssaySubmissionStatus).default(EssaySubmissionStatus.DRAFT),
  submittedAt: z.date().optional(),
  lastSavedAt: z.date(),
  
  // Grading results
  manualGrading: z.object({
    score: z.number().min(0).optional(),
    maxScore: z.number().min(0).optional(),
    feedback: z.string().optional(),
    criteriaScores: z.array(z.object({
      criterionId: z.string(),
      score: z.number().min(0),
      feedback: z.string().optional(),
    })).optional(),
    gradedBy: z.string().optional(),
    gradedAt: z.date().optional(),
  }).optional(),
  
  aiGrading: aiGradingResultSchema.optional(),
  plagiarismResult: plagiarismResultSchema.optional(),
  
  // Metadata
  timeSpent: z.number().min(0).optional(), // in minutes
  revisionCount: z.number().min(0).default(0),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    type: z.string(),
    size: z.number(),
  })).optional(),
});

// Essay grading criteria
export const essayGradingCriterionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  weight: z.number().min(0).max(100).default(1),
  bloomsLevel: z.string().optional(),
  maxScore: z.number().min(0),
  levels: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    score: z.number().min(0),
    feedback: z.string().optional(),
  })),
});

// Essay assessment settings
export const essayAssessmentSettingsSchema = z.object({
  wordLimit: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(1).optional(),
    showCounter: z.boolean().default(true),
  }).optional(),
  
  timeLimit: z.object({
    enabled: z.boolean().default(false),
    minutes: z.number().min(1).optional(),
    showTimer: z.boolean().default(true),
    autoSubmit: z.boolean().default(false),
  }).optional(),
  
  drafts: z.object({
    enabled: z.boolean().default(true),
    autoSaveInterval: z.number().min(30).default(60), // seconds
    maxDrafts: z.number().min(1).default(10),
  }).optional(),
  
  plagiarismDetection: z.object({
    enabled: z.boolean().default(false),
    threshold: z.number().min(0).max(100).default(20),
    checkAgainstDatabase: z.boolean().default(true),
    checkAgainstInternet: z.boolean().default(false),
    checkAgainstSubmissions: z.boolean().default(true),
  }).optional(),
  
  aiGrading: z.object({
    mode: z.nativeEnum(AIGradingMode).default(AIGradingMode.DISABLED),
    model: z.string().default('gemini-2.0-flash'),
    temperature: z.number().min(0).max(2).default(0.3),
    requireTeacherReview: z.boolean().default(true),
    confidenceThreshold: z.number().min(0).max(1).default(0.7),
  }).optional(),
  
  rubric: z.object({
    enabled: z.boolean().default(true),
    criteria: z.array(essayGradingCriterionSchema),
    totalPoints: z.number().min(0),
    passingScore: z.number().min(0),
    showToStudents: z.boolean().default(true),
  }).optional(),
});

// Type exports
export type PlagiarismResult = z.infer<typeof plagiarismResultSchema>;
export type AIGradingResult = z.infer<typeof aiGradingResultSchema>;
export type EssaySubmission = z.infer<typeof essaySubmissionSchema>;
export type EssayGradingCriterion = z.infer<typeof essayGradingCriterionSchema>;
export type EssayAssessmentSettings = z.infer<typeof essayAssessmentSettingsSchema>;

// Input schemas for API
export const createEssaySubmissionSchema = essaySubmissionSchema.omit({
  id: true,
  lastSavedAt: true,
  revisionCount: true,
});

export const updateEssaySubmissionSchema = essaySubmissionSchema.partial().extend({
  id: z.string(),
});

export const gradeEssaySubmissionSchema = z.object({
  submissionId: z.string(),
  criteriaScores: z.array(z.object({
    criterionId: z.string(),
    score: z.number().min(0),
    feedback: z.string().optional(),
  })),
  overallFeedback: z.string().optional(),
  useAIAssist: z.boolean().default(false),
});

export const requestAIGradingSchema = z.object({
  submissionId: z.string(),
  mode: z.nativeEnum(AIGradingMode).default(AIGradingMode.ASSIST),
  includeExplanation: z.boolean().default(true),
});

export const checkPlagiarismSchema = z.object({
  submissionId: z.string(),
  content: z.string(),
  threshold: z.number().min(0).max(100).default(20),
  checkSources: z.object({
    database: z.boolean().default(true),
    internet: z.boolean().default(false),
    submissions: z.boolean().default(true),
  }).optional(),
});

// Type exports for inputs
export type CreateEssaySubmission = z.infer<typeof createEssaySubmissionSchema>;
export type UpdateEssaySubmission = z.infer<typeof updateEssaySubmissionSchema>;
export type GradeEssaySubmission = z.infer<typeof gradeEssaySubmissionSchema>;
export type RequestAIGrading = z.infer<typeof requestAIGradingSchema>;
export type CheckPlagiarism = z.infer<typeof checkPlagiarismSchema>;
