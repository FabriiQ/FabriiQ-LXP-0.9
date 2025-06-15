import { SystemStatus } from "./user";
import { ServiceConfig } from "./prisma";

export interface CreateCourseInput {
  code: string;
  name: string;
  description?: string;
  credits: number;
  level: number;
  programId: string;
  settings?: Record<string, unknown>;
}

export interface UpdateCourseInput {
  name?: string;
  description?: string;
  credits?: number;
  level?: number;
  settings?: Record<string, unknown>;
  status?: SystemStatus;
}

export interface CourseFilters {
  programId?: string;
  code?: string;
  level?: number;
  status?: SystemStatus;
  search?: string;
}

export interface CreateCourseCampusInput {
  courseId: string;
  campusId: string;
  startDate?: Date;
  endDate?: Date;
  settings?: Record<string, unknown>;
}

export interface UpdateCourseCampusInput {
  startDate?: Date;
  endDate?: Date;
  settings?: Record<string, unknown>;
  status?: SystemStatus;
}

export interface CourseCampusFilters {
  courseId?: string;
  campusId?: string;
  status?: SystemStatus;
}

export interface CreateCoursePrerequisiteInput {
  courseId: string;
  prerequisiteCourseId: string;
  type: string;
  settings?: Record<string, unknown>;
}

export interface UpdateCoursePrerequisiteInput {
  type?: string;
  settings?: Record<string, unknown>;
  status?: SystemStatus;
}

export interface CoursePrerequisiteFilters {
  courseId?: string;
  prerequisiteCourseId?: string;
  type?: string;
  status?: SystemStatus;
}

export interface CourseServiceConfig extends ServiceConfig {
  defaultStatus?: SystemStatus;
} 