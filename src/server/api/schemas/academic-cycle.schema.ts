import { z } from "zod";
import { SystemStatus } from "@prisma/client";

// Define AcademicCycleType enum since it's not exported from Prisma
export enum AcademicCycleType {
  SEMESTER = "SEMESTER",
  TRIMESTER = "TRIMESTER",
  QUARTER = "QUARTER",
  YEAR = "YEAR"
}

export const createAcademicCycleSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  type: z.nativeEnum(AcademicCycleType),
  institutionId: z.string(),
  campusIds: z.array(z.string()),
  status: z.nativeEnum(SystemStatus).default(SystemStatus.ACTIVE),
});

export const updateAcademicCycleSchema = z.object({
  id: z.string(),
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  type: z.nativeEnum(AcademicCycleType).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

export const dateRangeSchema = z.object({
  institutionId: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  type: z.nativeEnum(AcademicCycleType).optional(),
});

export const upcomingCyclesSchema = z.object({
  institutionId: z.string(),
  limit: z.number().optional().default(5),
});

export type CreateAcademicCycleInput = z.infer<typeof createAcademicCycleSchema>;
export type UpdateAcademicCycleInput = z.infer<typeof updateAcademicCycleSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type UpcomingCyclesInput = z.infer<typeof upcomingCyclesSchema>;
