import { 
  AcademicCycle, 
  Term, 
  Course, 
  Institution,
  Class,
  Assessment,
  FacilitySchedule,
  GradeBook,
  TeacherSchedule,
  AcademicCalendarEvent,
  User,
  Prisma,
  SystemStatus,
} from '@prisma/client';

// Define the enums that are missing from Prisma client
export enum AcademicCycleType {
  ANNUAL = 'ANNUAL',
  SEMESTER = 'SEMESTER',
  TRIMESTER = 'TRIMESTER',
  QUARTER = 'QUARTER',
  CUSTOM = 'CUSTOM'
}

export enum TermType {
  SEMESTER = 'SEMESTER',
  TRIMESTER = 'TRIMESTER',
  QUARTER = 'QUARTER',
  THEME_BASED = 'THEME_BASED',
  CUSTOM = 'CUSTOM'
}

export enum TermPeriod {
  FALL = 'FALL',
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  WINTER = 'WINTER',
  FIRST_QUARTER = 'FIRST_QUARTER',
  SECOND_QUARTER = 'SECOND_QUARTER',
  THIRD_QUARTER = 'THIRD_QUARTER',
  FOURTH_QUARTER = 'FOURTH_QUARTER',
  FIRST_TRIMESTER = 'FIRST_TRIMESTER',
  SECOND_TRIMESTER = 'SECOND_TRIMESTER',
  THIRD_TRIMESTER = 'THIRD_TRIMESTER',
  THEME_UNIT = 'THEME_UNIT'
}

export enum AcademicEventType {
  REGISTRATION = 'REGISTRATION',
  ADD_DROP = 'ADD_DROP',
  WITHDRAWAL = 'WITHDRAWAL',
  EXAMINATION = 'EXAMINATION',
  GRADING = 'GRADING',
  ORIENTATION = 'ORIENTATION',
  GRADUATION = 'GRADUATION',
  OTHER = 'OTHER'
}

// ============= Base Interfaces =============
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  createdBy?: string;
  updatedBy?: string | null;
}

// ============= Academic Cycle Types =============
export interface AcademicCycleWithRelations extends AcademicCycle {
  terms?: TermWithRelations[];
  institution?: Institution;
  calendarEvents?: AcademicCalendarEvent[];
  creator?: User;
  updater?: User;
  _count?: {
    terms: number;
    calendarEvents: number;
  };
}

export interface CreateAcademicCycleInput {
  code: string;
  name: string;
  description?: string | null;
  type: AcademicCycleType;
  startDate: Date;
  endDate: Date;
  duration?: number; // in months
  institutionId: string;
  createdBy: string;
  status?: SystemStatus;
}

export interface UpdateAcademicCycleInput extends Partial<Omit<CreateAcademicCycleInput, 'createdBy'>> {
  id: string;
  updatedBy: string;
}

// ============= Term Types =============
export interface TermWithRelations extends Term {
  course?: Course;
  academicCycle?: AcademicCycle;
  classes?: Class[];
  assessments?: Assessment[];
  facilitySchedules?: FacilitySchedule[];
  gradeBooks?: GradeBook[];
  teacherSchedules?: TeacherSchedule[];
  creator?: User;
  updater?: User;
  _count?: {
    classes: number;
    assessments: number;
  };
}

export interface CreateTermInput {
  code: string;
  name: string;
  description?: string;
  termType: TermType;
  termPeriod: TermPeriod;
  startDate: Date;
  endDate: Date;
  courseId: string;
  academicCycleId: string;
  createdBy: string;
  status?: SystemStatus;
}

export interface UpdateTermInput extends Partial<Omit<CreateTermInput, 'createdBy'>> {
  id: string;
  updatedBy: string;
}

// ============= Calendar Event Types =============
export interface CreateCalendarEventInput {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: AcademicEventType;
  academicCycleId: string;
  createdBy: string;
  status?: SystemStatus;
}

export interface UpdateCalendarEventInput extends Partial<Omit<CreateCalendarEventInput, 'createdBy'>> {
  id: string;
  updatedBy: string;
}

// ============= Filter Types =============
export interface BaseFilters {
  search?: string;
  status?: SystemStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface AcademicCycleFilters extends BaseFilters {
  institutionId?: string;
  type?: AcademicCycleType;
}

export interface TermFilters extends BaseFilters {
  courseId?: string;
  academicCycleId?: string;
  termType?: TermType;
  termPeriod?: TermPeriod;
}

export interface CalendarEventFilters extends BaseFilters {
  academicCycleId?: string;
  type?: AcademicEventType;
}

// ============= Validation Rules =============
export const DATE_VALIDATION_RULES = {
  startBeforeEnd: (startDate: Date, endDate: Date): boolean => {
    return startDate < endDate;
  },
  noOverlap: (
    startDate: Date, 
    endDate: Date, 
    existingRanges: { startDate: Date; endDate: Date }[]
  ): boolean => {
    return !existingRanges.some(range => 
      (startDate <= range.endDate && endDate >= range.startDate)
    );
  },
  withinAcademicCycle: (
    startDate: Date,
    endDate: Date,
    cycleStart: Date,
    cycleEnd: Date
  ): boolean => {
    return startDate >= cycleStart && endDate <= cycleEnd;
  }
};

// ============= Type Guards =============
export const isAcademicCycleType = (type: string): type is AcademicCycleType => {
  return Object.values(AcademicCycleType).includes(type as AcademicCycleType);
};

export const isTermType = (type: string): type is TermType => {
  return Object.values(TermType).includes(type as TermType);
};

export const isTermPeriod = (period: string): period is TermPeriod => {
  return Object.values(TermPeriod).includes(period as TermPeriod);
};

export const isAcademicEventType = (type: string): type is AcademicEventType => {
  return Object.values(AcademicEventType).includes(type as AcademicEventType);
};

// Add Prisma specific types for updates
export type EnumSystemStatusFieldUpdateOperationsInput = {
  set: SystemStatus;
};

export type EnumTermPeriodFieldUpdateOperationsInput = {
  set: TermPeriod;
};

// ============= Form Value Types =============
export interface AcademicCycleFormValues {
  code: string;
  name: string;
  description?: string;
  type: AcademicCycleType;
  startDate: Date;
  endDate: Date;
}
