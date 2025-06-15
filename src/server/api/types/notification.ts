import { SystemStatus } from "./user";
import { ServiceConfig } from "./prisma";

export enum NotificationType {
  SYSTEM = "SYSTEM",
  USER = "USER",
  CLASS = "CLASS",
  ASSIGNMENT = "ASSIGNMENT",
  GRADE = "GRADE",
  ATTENDANCE = "ATTENDANCE",
  RESOURCE = "RESOURCE",
  OTHER = "OTHER"
}

export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT"
}

export enum NotificationChannel {
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
  SMS = "SMS",
  PUSH = "PUSH"
}

export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  FAILED = "FAILED"
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  priority: NotificationPriority;
  channel: NotificationChannel;
  metadata?: Record<string, unknown>;
  scheduledFor?: Date;
  expiresAt?: Date;
  settings?: Record<string, unknown>;
}

export interface UpdateNotificationInput {
  title?: string;
  content?: string;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  metadata?: Record<string, unknown>;
  scheduledFor?: Date;
  expiresAt?: Date;
  settings?: Record<string, unknown>;
  status?: NotificationStatus;
  systemStatus?: SystemStatus;
}

export interface NotificationFilters {
  userId?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  startDate?: Date;
  endDate?: Date;
  systemStatus?: SystemStatus;
  search?: string;
}

export interface BulkNotificationInput {
  userIds: string[];
  type: NotificationType;
  title: string;
  content: string;
  priority: NotificationPriority;
  channel: NotificationChannel;
  metadata?: Record<string, unknown>;
  scheduledFor?: Date;
  expiresAt?: Date;
  settings?: Record<string, unknown>;
}

export interface SendTemplatedNotificationInput {
  templateId: string;
  userId: string;
  variables: Record<string, string>;
  scheduledFor?: Date;
  expiresAt?: Date;
  settings?: Record<string, unknown>;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  notificationsByType: Record<NotificationType, number>;
  notificationsByPriority: Record<NotificationPriority, number>;
  notificationsByChannel: Record<NotificationChannel, number>;
  notificationsByStatus: Record<NotificationStatus, number>;
}

export interface NotificationServiceConfig extends ServiceConfig {
  defaultStatus?: SystemStatus;
  defaultPriority?: NotificationPriority;
  defaultChannel?: NotificationChannel;
  retentionPeriod?: number;
}