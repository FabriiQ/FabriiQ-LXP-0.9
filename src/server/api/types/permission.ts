import type { Prisma } from ".prisma/client";
import type { EntityType } from "@prisma/client";
import { AccessScope, SystemStatus } from "./user";
import { ServiceConfig } from "./prisma";

export interface CreatePermissionInput {
  code: string;
  name: string;
  description?: string;
  scope: AccessScope;
  entityType?: EntityType;
}

export interface UpdatePermissionInput {
  name?: string;
  description?: string;
  scope?: AccessScope;
  entityType?: EntityType;
  status?: SystemStatus;
}

export interface AssignPermissionInput {
  userId: string;
  permissionId: string;
  campusId?: string; // Optional for campus-specific permissions
}

export interface RevokePermissionInput {
  userId: string;
  permissionId: string;
  campusId?: string;
}

export interface PermissionFilters {
  scope?: AccessScope;
  entityType?: EntityType;
  status?: SystemStatus;
  search?: string;
}

export interface UserPermissionFilters {
  userId?: string;
  permissionId?: string;
  campusId?: string;
  status?: SystemStatus;
}

export interface PermissionServiceConfig extends ServiceConfig {
  defaultPermissionStatus?: SystemStatus;
}

// Role-based access control types
export interface Role {
  name: string;
  permissions: string[]; // Permission codes
  scope: AccessScope;
}

// Default roles configuration
export const DefaultRoles: Record<string, Role> = {
  SYSTEM_ADMIN: {
    name: "System Administrator",
    permissions: ["*"], // All permissions
    scope: "SYSTEM"
  },
  SYSTEM_MANAGER: {
    name: "System Manager",
    permissions: [
      "user.view",
      "user.create",
      "user.update",
      "campus.view",
      "campus.manage",
      "program.view",
      "program.manage",
      "course.view",
      "course.manage"
    ],
    scope: "SYSTEM"
  },
  CAMPUS_ADMIN: {
    name: "Campus Administrator",
    permissions: [
      "campus.view",
      "campus.manage",
      "user.view",
      "user.create",
      "class.manage",
      "schedule.manage",
      "facility.manage"
    ],
    scope: "SINGLE_CAMPUS"
  },
  CAMPUS_COORDINATOR: {
    name: "Campus Coordinator",
    permissions: [
      "class.view",
      "class.manage",
      "schedule.view",
      "schedule.manage",
      "assessment.manage",
      "grade.manage"
    ],
    scope: "SINGLE_CAMPUS"
  },
  CAMPUS_PRINCIPAL: {
    name: "Campus Principal",
    permissions: [
      "campus.view",
      "user.view",
      "class.view",
      "class.manage",
      "schedule.view",
      "schedule.manage",
      "assessment.manage",
      "grade.manage",
      "teacher.manage",
      "student.manage",
      "analytics.view"
    ],
    scope: "SINGLE_CAMPUS"
  },
  CAMPUS_TEACHER: {
    name: "Teacher",
    permissions: [
      "class.view",
      "assessment.create",
      "assessment.grade",
      "attendance.manage",
      "feedback.create"
    ],
    scope: "SINGLE_CAMPUS"
  },
  CAMPUS_STUDENT: {
    name: "Student",
    permissions: [
      "class.view",
      "assessment.view",
      "assessment.submit",
      "feedback.view"
    ],
    scope: "SINGLE_CAMPUS"
  }
};