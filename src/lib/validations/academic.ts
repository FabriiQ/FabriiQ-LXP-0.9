import { z } from 'zod';

// Date range validation
export const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(
  (data) => data.startDate < data.endDate,
  { message: "End date must be after start date" }
);

// Class capacity validation
export const classCapacitySchema = z.object({
  minCapacity: z.number().min(1),
  maxCapacity: z.number().min(1),
  currentCount: z.number().min(0),
}).refine(
  (data) => data.minCapacity <= data.maxCapacity,
  { message: "Minimum capacity must be less than or equal to maximum capacity" }
).refine(
  (data) => data.currentCount <= data.maxCapacity,
  { message: "Current count must not exceed maximum capacity" }
).refine(
  (data) => data.currentCount >= 0,
  { message: "Current count cannot be negative" }
);

// Assessment template validation
export const assessmentTemplateSchema = z.object({
  maxScore: z.number().positive(),
  passingScore: z.number().min(0),
  weightage: z.number().min(0).max(1),
}).refine(
  (data) => data.passingScore <= data.maxScore,
  { message: "Passing score must not exceed maximum score" }
);

// Student profile metrics validation
export const studentMetricsSchema = z.object({
  attendanceRate: z.number().min(0).max(100).optional(),
  academicScore: z.number().min(0).max(100).optional(),
  participationRate: z.number().min(0).max(100).optional(),
});

// Teacher profile metrics validation
export const teacherMetricsSchema = z.object({
  teachingLoad: z.number().min(0).optional(),
  studentFeedbackScore: z.number().min(0).max(5).optional(),
  attendanceRate: z.number().min(0).max(100).optional(),
}); 