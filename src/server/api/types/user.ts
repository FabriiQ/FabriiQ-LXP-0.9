import type { Prisma } from ".prisma/client";
import { ServiceConfig } from "./prisma";
import type { UserType, AccessScope, SystemStatus } from "@prisma/client";

// Instead of redeclaring, export from Prisma
export { SystemStatus, UserType, AccessScope } from '@prisma/client';

export interface CreateUserInput {
  name?: string;
  email?: string;
  username: string;
  phoneNumber?: string;
  password?: string;
  userType: UserType;
  accessScope: AccessScope;
  primaryCampusId?: string;
  institutionId: string;
  profileData?: Record<string, any>;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  userType?: UserType;
  accessScope?: AccessScope;
  primaryCampusId?: string;
  status?: SystemStatus;
  profileData?: Record<string, any>;
}

export interface CreateProfileInput {
  userId: string;
  enrollmentNumber?: string;
  currentGrade?: string;
  academicHistory?: Prisma.JsonValue;
  interests?: string[];
  achievements?: Prisma.JsonValue[];
  specialNeeds?: Prisma.JsonValue;
  guardianInfo?: Prisma.JsonValue;
}

export interface UpdateProfileInput {
  currentGrade?: string;
  academicHistory?: Prisma.JsonValue;
  interests?: string[];
  achievements?: Prisma.JsonValue[];
  specialNeeds?: Prisma.JsonValue;
  guardianInfo?: Prisma.JsonValue;
}

export interface UserServiceConfig extends ServiceConfig {
  defaultUserStatus?: SystemStatus;
  passwordHashRounds?: number;
}

export interface UserFilters {
  institutionId?: string;
  campusId?: string;
  userType?: UserType;
  status?: SystemStatus;
  search?: string;
}

export interface ProfileFilters {
  userId?: string;
  enrollmentNumber?: string;
  currentGrade?: string;
  status?: SystemStatus;
}

export interface UserWithProfile {
  id: string;
  name?: string;
  email?: string;
  username: string;
  userType: UserType;
  status: SystemStatus;
  studentProfile?: StudentProfileData;
  teacherProfile?: TeacherProfileData;
  coordinatorProfile?: CoordinatorProfileData;
}

interface BaseProfileData {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProfileData extends BaseProfileData {
  enrollmentNumber: string;
  currentGrade?: string;
  academicHistory?: Prisma.JsonValue;
  interests: string[];
  achievements: Prisma.JsonValue[];
  specialNeeds?: Prisma.JsonValue;
  guardianInfo?: Prisma.JsonValue;
  attendanceRate?: number;
  academicScore?: number;
  participationRate?: number;
}

export interface TeacherProfileData extends BaseProfileData {
  specialization?: string;
  qualifications: Prisma.JsonValue[];
  certifications: Prisma.JsonValue[];
  experience: Prisma.JsonValue[];
  expertise: string[];
  publications: Prisma.JsonValue[];
  achievements: Prisma.JsonValue[];
  teachingLoad?: number;
  studentFeedbackScore?: number;
  attendanceRate?: number;
}

export interface CoordinatorProfileData extends BaseProfileData {
  department?: string;
  qualifications: Prisma.JsonValue[];
  responsibilities: string[];
  managedPrograms: Prisma.JsonValue[];
  managedCourses: Prisma.JsonValue[];
  performance?: Prisma.JsonValue;
} 