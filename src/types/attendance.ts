import { AttendanceStatusType } from "@/server/api/constants";

export interface StudentProfile {
  id: string;
  user: {
    name: string;
    email: string;
  };
  enrollmentNumber: string;
  currentGrade?: string;
  attendanceRate?: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: Date;
  status: AttendanceStatusType;
  remarks?: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  sickDays?: number;
  otherDays?: number;
  attendanceRate: number;
  statusCounts?: {
    PRESENT: number;
    ABSENT: number;
    LATE: number;
    EXCUSED: number;
    SICK?: number;
    OTHER?: number;
  };
  stats?: {
    totalDays: number;
    statusCounts?: {
      PRESENT: number;
      ABSENT: number;
      LATE: number;
      EXCUSED: number;
      SICK?: number;
      OTHER?: number;
    };
  };
}

export interface PieChartData {
  id: string;
  label: string;
  value: number;
  color: string;
}
