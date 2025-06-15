import { AssessmentCategory, GradingType } from "@/server/api/constants";
import { z } from "zod";

// Form schema with basic validation
export const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  subjectId: z.string().min(1, 'Subject is required'),
  topicId: z.string().optional(),
  category: z.nativeEnum(AssessmentCategory).default(AssessmentCategory.QUIZ),
  instructions: z.string().optional(),
  maxScore: z.coerce.number().min(1, 'Maximum score must be at least 1').default(100),
  passingScore: z.coerce.number().min(0, 'Passing score must be at least 0').default(50),
  weightage: z.coerce.number().min(0, 'Weightage must be at least 0').max(100, 'Weightage cannot exceed 100').default(0),
  dueDate: z.date().optional(),
  gradingType: z.nativeEnum(GradingType).default(GradingType.MANUAL),
  isPublished: z.boolean().default(false),
  allowLateSubmissions: z.boolean().default(false),
  questions: z.array(
    z.object({
      text: z.string().min(1, 'Question text is required'),
      type: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY', 'FILE_UPLOAD']).default('MULTIPLE_CHOICE'),
      options: z.array(
        z.object({
          text: z.string().min(1, 'Option text is required'),
          isCorrect: z.boolean().default(false),
        })
      ).optional().default([]),
      maxScore: z.coerce.number().min(1, 'Question score must be at least 1').default(10),
    })
  ).optional().default([]),
});

export type FormValues = z.infer<typeof formSchema>;

export interface Subject {
  id: string;
  name: string;
  code?: string;
  topics?: { id: string; name: string }[];
}

export interface AssessmentFormProps {
  classId: string;
  subjects: Subject[];
  assessment?: any;
  action: 'create' | 'edit';
}
