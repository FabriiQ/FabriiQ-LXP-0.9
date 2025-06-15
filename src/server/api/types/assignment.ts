import { SystemStatus } from "./user";

export enum AssignmentType {
  HOMEWORK = "HOMEWORK",
  PROJECT = "PROJECT",
  QUIZ = "QUIZ",
  TEST = "TEST",
  EXAM = "EXAM",
  PRESENTATION = "PRESENTATION",
  PARTICIPATION = "PARTICIPATION",
  OTHER = "OTHER"
}

export enum AssignmentStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  GRADED = "GRADED",
  ARCHIVED = "ARCHIVED"
}

export interface CreateAssignmentInput {
  classId: string;
  title: string;
  description: string;
  type: AssignmentType;
  dueDate: Date;
  totalPoints: number;
  weight: number;
  instructions?: string;
  resources?: string[];
  settings?: Record<string, unknown>;
}

export interface UpdateAssignmentInput {
  title?: string;
  description?: string;
  type?: AssignmentType;
  dueDate?: Date;
  totalPoints?: number;
  weight?: number;
  instructions?: string;
  resources?: string[];
  settings?: Record<string, unknown>;
  status?: AssignmentStatus;
  systemStatus?: SystemStatus;
}

export interface AssignmentFilters {
  classId?: string;
  type?: AssignmentType;
  status?: AssignmentStatus;
  startDate?: Date;
  endDate?: Date;
  systemStatus?: SystemStatus;
  search?: string;
}

export interface CreateSubmissionInput {
  assignmentId: string;
  studentId: string;
  content: string;
  attachments?: string[];
  settings?: Record<string, unknown>;
}

export interface UpdateSubmissionInput {
  content?: string;
  attachments?: string[];
  settings?: Record<string, unknown>;
  status?: AssignmentStatus;
  systemStatus?: SystemStatus;
}

export interface SubmissionFilters {
  assignmentId?: string;
  studentId?: string;
  status?: AssignmentStatus;
  systemStatus?: SystemStatus;
}

export interface AssignmentServiceConfig {
  defaultStatus: SystemStatus;
  defaultAssignmentStatus: AssignmentStatus;
  defaultSubmissionStatus: AssignmentStatus;
}

export interface AssignmentStats {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  averageScore: number;
  totalPoints: number;
  earnedPoints: number;
}

export interface BulkGradeInput {
  assignmentId: string;
  grades: {
    submissionId: string;
    points: number;
    feedback?: string;
  }[];
} 