import { SystemStatus } from "./user";
import { Prisma } from "@prisma/client";

export enum ResourceType {
  FILE = "FILE",
  FOLDER = "FOLDER",
  LINK = "LINK"
}

export enum ResourceAccess {
  PRIVATE = "PRIVATE",
  SHARED = "SHARED",
  PUBLIC = "PUBLIC"
}

export interface Resource {
  id: string;
  title: string;
  description?: string | null;
  type: ResourceType;
  url?: string | null;
  access: ResourceAccess;
  ownerId: string;
  parentId?: string | null;
  tags: string[];
  settings?: Prisma.JsonValue;
  status: SystemStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface ResourcePermission {
  id: string;
  resourceId: string;
  userId: string;
  access: ResourceAccess;
  settings?: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateResourceInput {
  title: string;
  description: string;
  type: ResourceType;
  url: string;
  access: ResourceAccess;
  ownerId: string;
  parentId?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  settings?: Record<string, unknown>;
}

export interface UpdateResourceInput {
  title?: string;
  description?: string;
  type?: ResourceType;
  url?: string;
  access?: ResourceAccess;
  parentId?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  settings?: Record<string, unknown>;
  systemStatus?: SystemStatus;
}

export interface ResourceFilters {
  type?: ResourceType;
  access?: ResourceAccess;
  ownerId?: string;
  parentId?: string;
  tags?: string[];
  systemStatus?: SystemStatus;
  search?: string;
}

export interface ResourcePermissionInput {
  resourceId: string;
  userId: string;
  access: ResourceAccess;
  settings?: Record<string, unknown>;
}

export interface ResourceServiceConfig {
  defaultStatus: SystemStatus;
  defaultAccess: ResourceAccess;
  maxFileSize: number;
  allowedFileTypes: string[];
  storagePath: string;
}

export interface ResourceStats {
  totalResources: number;
  totalSize: number;
  resourcesByType: Record<ResourceType, number>;
  resourcesByAccess: Record<ResourceAccess, number>;
  storageUsed: number;
  storageLimit: number;
}

export interface BulkResourceInput {
  resources: CreateResourceInput[];
  ownerId: string;
  parentId?: string;
}

export interface ResourceSearchResult extends Resource {
  ownerName?: string | null;
  parentName?: string | null;
  childCount?: number;
  permissionCount?: number;
  relevanceScore: number;
  permissions?: Array<{
    id: string;
    userId: string;
    access: ResourceAccess;
    settings?: Prisma.JsonValue;
    userName?: string | null;
  }>;
} 