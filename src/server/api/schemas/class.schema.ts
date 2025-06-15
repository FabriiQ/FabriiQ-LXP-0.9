import { z } from "zod";

export const classCapacitySchema = z.object({
  minCapacity: z.number().min(1).optional(),
  maxCapacity: z.number().min(1).optional(),
  currentCount: z.number().min(0)
}).refine((data) => {
  if (data.minCapacity && data.maxCapacity) {
    return data.minCapacity <= data.maxCapacity;
  }
  return true;
}, {
  message: "Minimum capacity must be less than or equal to maximum capacity"
}).refine((data) => {
  if (data.maxCapacity) {
    return data.currentCount <= data.maxCapacity;
  }
  return true;
}, {
  message: "Current count cannot exceed maximum capacity"
});

export const classSchema = z.object({
  name: z.string(),
  code: z.string(),
  courseCampusId: z.string(),
  termId: z.string(),
  minCapacity: z.number().optional(),
  maxCapacity: z.number().optional(),
  classTeacherId: z.string().optional(),
  facilityId: z.string().optional(),
  programCampusId: z.string().optional()
});

export const classQuerySchema = z.object({
  classId: z.string(),
  includeEnrollments: z.boolean().optional(),
  include: z.record(z.boolean()).optional()
});

export type ClassSchemaType = z.infer<typeof classSchema>;
export type ClassQuerySchemaType = z.infer<typeof classQuerySchema>;
export type ClassCapacitySchemaType = z.infer<typeof classCapacitySchema>;

export const createClassSchema = z.object({
  code: z.string(),
  name: z.string(),
  courseCampusId: z.string(),
  termId: z.string(),
  minCapacity: z.number().min(1),
  maxCapacity: z.number().min(1),
  programCampusId: z.string(),
  campusId: z.string(), // Add campusId to schema
});

export type CreateClassInput = z.infer<typeof createClassSchema>;

