/**
 * Core API Types
 * This file contains common interfaces and types used across the API layer
 */

import { type inferAsyncReturnType } from "@trpc/server";
import { prisma } from "@/server/db";
import { getSessionCache } from "@/utils/session-cache";
import { type Session } from "next-auth";
import type {
  SystemStatus,
  UserType,
  AccessScope,
  AnalyticsEventType,
  SubmissionStatus,
  GradingType,
  GradingScale,
  AttendanceStatusType,
} from "../constants";

/**
 * Server context configuration
 */
interface CreateContextOptions {
  session: Session | null;
  prisma: typeof prisma;
}

/**
 * Inner context creator - creates context without incoming request
 */
export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma: opts.prisma,
  };
};

/**
 * Context creator for API routes
 */
export const createTRPCContext = async (_opts: { req?: Request }) => {
  // Get the session from the request
  const session = await getSessionCache();

  return createInnerTRPCContext({
    session,
    prisma,
  });
};

export type Context = inferAsyncReturnType<typeof createTRPCContext>;

/**
 * Common response types
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Common input types
 */
export interface PaginationInput {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DateRangeInput {
  startDate: Date;
  endDate: Date;
}

/**
 * Common filter types
 */
export interface BaseFilters {
  status?: SystemStatus | SubmissionStatus | AttendanceStatusType;
  search?: string;
}

export interface SubmissionFilters extends BaseFilters {
  studentId?: string;
  activityId?: string;
  assessmentId?: string;
}

export interface GradeFilters extends BaseFilters {
  studentId?: string;
  subjectId?: string;
  assessmentId?: string;
  activityId?: string;
  gradingType?: GradingType;
  gradingScale?: GradingScale;
}

/**
 * Error types
 */
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Audit types
 */
export interface AuditMetadata {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
}

/**
 * Permission types
 */
export interface PermissionCheck {
  entityType: string;
  action: string;
  entityId?: string;
  campusId?: string;
}

/**
 * Analytics types
 */
export interface AnalyticsEventInput {
  type: AnalyticsEventType;
  metadata: Record<string, unknown>;
  entityId?: string;
  campusId?: string;
}

/**
 * Cache configuration types
 */
export interface CacheConfig {
  ttl: number;
  key: string;
  namespace?: string;
}

// Custom user type for our session
export interface CustomUser {
  id: string;
  userType: UserType;
  accessScope: AccessScope | null;
  primaryCampusId: string | null;
}

export {
  UserType,
  SystemStatus,
  AccessScope,
  AnalyticsEventType,
  SubmissionStatus,
  GradingType,
  GradingScale,
  AttendanceStatusType,
} from "../constants";