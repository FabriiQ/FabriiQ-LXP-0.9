import { z } from 'zod';

// Feedback response validation
export const feedbackResponseSchema = z.object({
  content: z.string().min(1),
  attachments: z.record(z.unknown()).optional(),
  studentFeedbackId: z.string().optional(),
  teacherFeedbackId: z.string().optional(),
}).refine(
  (data) => data.studentFeedbackId != null || data.teacherFeedbackId != null,
  { message: "Either student feedback ID or teacher feedback ID must be provided" }
);

// Base feedback validation
export const baseFeedbackSchema = z.object({
  type: z.enum(['ACADEMIC_PERFORMANCE', 'BEHAVIORAL', 'ATTENDANCE', 'PARTICIPATION', 'IMPROVEMENT_AREA', 'ACHIEVEMENT', 'DISCIPLINARY']),
  severity: z.enum(['POSITIVE', 'NEUTRAL', 'CONCERN', 'CRITICAL']),
  title: z.string().min(1),
  description: z.string().min(1),
  academicCycle: z.string().optional(),
  term: z.string().optional(),
  classId: z.string().optional(),
  tags: z.array(z.string()),
  attachments: z.record(z.unknown()).optional(),
});

// Student feedback validation
export const studentFeedbackSchema = z.object({
  studentId: z.string(),
  feedbackBaseId: z.string(),
});

// Teacher feedback validation
export const teacherFeedbackSchema = z.object({
  teacherId: z.string(),
  feedbackBaseId: z.string(),
}); 