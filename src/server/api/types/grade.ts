import { SystemStatus } from "@prisma/client";
import { ServiceConfig } from "./prisma";
import { Prisma } from "@prisma/client";

export interface CreateGradeBookInput {
  classId: string;
  termId: string;
  calculationRules: Prisma.JsonValue;
  createdById: string;
}

export interface UpdateGradeBookInput {
  calculationRules?: Prisma.JsonValue;
  updatedById?: string;
}

export interface GradeBookFilters {
  classId?: string;
  termId?: string;
  search?: string;
}

export interface CreateStudentGradeInput {
  gradeBookId: string;
  studentId: string;
  assessmentGrades: Prisma.JsonValue;
  finalGrade?: number;
  letterGrade?: string;
  attendance?: number;
  comments?: string;
}

export interface UpdateStudentGradeInput {
  assessmentGrades?: Prisma.JsonValue;
  finalGrade?: number;
  letterGrade?: string;
  attendance?: number;
  comments?: string;
  status?: SystemStatus;
}

export interface StudentGradeFilters {
  gradeBookId?: string;
  studentId?: string;
  finalGrade?: number;
  status?: SystemStatus;
}

export interface CreateStudentTopicGradeInput {
  studentGradeId: string;
  topicId: string;
  score?: number;
  assessmentScore?: number;
  activityScore?: number;
}

export interface UpdateStudentTopicGradeInput {
  score?: number;
  assessmentScore?: number;
  activityScore?: number;
}

export interface StudentTopicGradeFilters {
  studentGradeId?: string;
  topicId?: string;
}

export interface GradeServiceConfig extends ServiceConfig {
  defaultStatus?: SystemStatus;
} 