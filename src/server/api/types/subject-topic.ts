import { Prisma, SystemStatus } from "@prisma/client";
import { ServiceConfig } from "./prisma";
import { CompetencyLevel, SubjectNodeType } from "../constants";

export interface CreateSubjectTopicInput {
  code: string;
  title: string;
  description?: string;
  context?: string;
  learningOutcomes?: string;
  nodeType: SubjectNodeType;
  orderIndex: number;
  estimatedMinutes?: number;
  competencyLevel?: CompetencyLevel;
  keywords?: string[];
  bloomsDistribution?: Record<string, number>;
  subjectId: string;
  parentTopicId?: string;
  status?: SystemStatus;
}

export interface UpdateSubjectTopicInput {
  title?: string;
  description?: string;
  context?: string;
  learningOutcomes?: string;
  nodeType?: SubjectNodeType;
  orderIndex?: number;
  estimatedMinutes?: number;
  competencyLevel?: CompetencyLevel;
  keywords?: string[];
  parentTopicId?: string | null; // null to remove parent
  status?: SystemStatus;
}

export interface SubjectTopicFilters {
  subjectId?: string;
  nodeType?: SubjectNodeType;
  parentTopicId?: string | null; // null for root topics
  search?: string;
  status?: SystemStatus;
}

export interface SubjectTopicServiceConfig extends ServiceConfig {
  defaultStatus?: SystemStatus;
}