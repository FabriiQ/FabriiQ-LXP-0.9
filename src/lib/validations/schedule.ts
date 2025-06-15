import { z } from 'zod';

// Time range validation
export const timeRangeSchema = z.object({
  startTime: z.date(),
  endTime: z.date(),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: "End time must be after start time" }
);

// Schedule period validation
export const schedulePeriodSchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  type: z.enum(['LECTURE', 'LAB', 'TUTORIAL', 'WORKSHOP', 'EXAM']),
  startTime: z.date(),
  endTime: z.date(),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: "End time must be after start time" }
);

// Teacher schedule validation
export const teacherScheduleSchema = z.object({
  teacherId: z.string(),
  termId: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
}).refine(
  (data) => !data.endDate || data.startDate < data.endDate,
  { message: "End date must be after start date if provided" }
);

// Facility schedule validation
export const facilityScheduleSchema = z.object({
  facilityId: z.string(),
  termId: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
}).refine(
  (data) => !data.endDate || data.startDate < data.endDate,
  { message: "End date must be after start date if provided" }
); 