import { PrismaClient, SystemStatus, DayOfWeek, PeriodType, AttendanceStatusType, ActivityPurpose, LearningActivityType, AssessmentType } from '@prisma/client';
import { ServiceConfig } from "./prisma";

export interface ClassServiceContext {
  prisma: PrismaClient;
  maxEnrollmentCapacity?: number;
}

export interface CreateClassInput {
  code: string;
  name: string;
  courseCampusId: string;
  campusId: string;
  termId: string;
  minCapacity?: number;
  maxCapacity?: number;
  classTeacherId?: string;
  facilityId?: string;
  programCampusId: string;
}

export interface UpdateClassInput {
  name?: string;
  minCapacity?: number;
  maxCapacity?: number;
  classTeacherId?: string;
  facilityId?: string;
  status?: SystemStatus;
}

export interface ClassFilters {
  courseCampusId?: string;
  termId?: string;
  classTeacherId?: string;
  facilityId?: string;
  programCampusId?: string;
  status?: SystemStatus;
  search?: string;
}

export interface EnrollStudentInput {
  classId: string;
  studentId: string;
  createdById: string;
}

export interface AssignTeacherInput {
  classId: string;
  teacherId: string;
  assignmentType: 'PRIMARY' | 'ASSISTANT';
}

export interface CreateActivityInput {
  classId: string;
  title: string;
  purpose: ActivityPurpose;
  learningType?: LearningActivityType;
  assessmentType?: AssessmentType;
  subjectId: string;
  topicId?: string;
  content: string;
  isGradable?: boolean;
  maxScore?: number;
  passingScore?: number;
  weightage?: number;
  gradingConfig?: any;
}

export interface UpdateActivityInput {
  title?: string;
  purpose?: ActivityPurpose;
  learningType?: LearningActivityType;
  assessmentType?: AssessmentType;
  content?: string;
  isGradable?: boolean;
  maxScore?: number;
  passingScore?: number;
  weightage?: number;
  gradingConfig?: any;
  status?: SystemStatus;
}

export interface CreatePeriodInput {
  classId: string;
  dayOfWeek: DayOfWeek;
  startTime: Date;
  endTime: Date;
  type: PeriodType;
  facilityId?: string;
  subjectId?: string;
  assignmentId: string;
}

export interface UpdatePeriodInput {
  startTime?: Date;
  endTime?: Date;
  facilityId?: string;
  status?: SystemStatus;
}

export interface ScheduleFilters {
  classId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface BulkEnrollStudentsInput {
  classId: string;
  studentIds: string[];
  createdById: string;
}

export interface BulkMarkAttendanceInput {
  classId: string;
  date: Date;
  attendance: Array<{
    studentId: string;
    status: AttendanceStatusType;
    remarks?: string;
  }>;
}

export interface ExportClassDataInput {
  classId: string;
  type: 'ATTENDANCE' | 'GRADES' | 'STUDENTS' | 'SCHEDULE';
  format: 'CSV' | 'EXCEL';
  startDate?: Date;
  endDate?: Date;
}

export interface ClassServiceConfig extends ServiceConfig {
  defaultStatus?: SystemStatus;
  maxEnrollmentCapacity?: number;
}

