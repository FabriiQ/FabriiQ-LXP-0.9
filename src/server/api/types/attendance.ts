import { SystemStatus } from "./user";

export interface CreateAttendanceRecordInput {
  classId: string;
  studentId: string;
  date: Date;
  status: AttendanceStatus;
  reason?: string;
  notes?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateAttendanceRecordInput {
  status?: AttendanceStatus;
  reason?: string;
  notes?: string;
  settings?: Record<string, unknown>;
  systemStatus?: SystemStatus;
}

export interface AttendanceFilters {
  classId?: string;
  studentId?: string;
  status?: AttendanceStatus;
  startDate?: Date;
  endDate?: Date;
  systemStatus?: SystemStatus;
}

export interface AttendanceServiceConfig {
  defaultStatus: SystemStatus;
  defaultAttendanceStatus: AttendanceStatus;
}

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  EXCUSED = "EXCUSED",
  SICK = "SICK",
  OTHER = "OTHER"
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  sickDays: number;
  otherDays: number;
  attendanceRate: number;
}

export interface BulkAttendanceInput {
  classId: string;
  date: Date;
  records: {
    studentId: string;
    status: AttendanceStatus;
    reason?: string;
    notes?: string;
  }[];
} 