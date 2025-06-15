import { z } from 'zod';
import { AnalyticsVisualization, AnalyticsEntityType } from '../analytics/types';

/**
 * Report Status Enum
 * Represents the current status of a report
 */
export enum ReportStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  SCHEDULED = 'SCHEDULED',
}

/**
 * Report Type Enum
 * Represents the type of report
 */
export enum ReportType {
  STANDARD = 'STANDARD',
  CUSTOM = 'CUSTOM',
  SYSTEM = 'SYSTEM',
  REGULATORY = 'REGULATORY',
}

/**
 * Report Format Enum
 * Represents the format of a report
 */
export enum ReportFormat {
  PDF = 'PDF',
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  HTML = 'HTML',
  JSON = 'JSON',
}

/**
 * Report Frequency Enum
 * Represents how often a report is generated
 */
export enum ReportFrequency {
  ONCE = 'ONCE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

/**
 * Report Visibility Enum
 * Represents who can see the report
 */
export enum ReportVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  RESTRICTED = 'RESTRICTED',
}

/**
 * Report Section Schema
 * Defines the structure of a report section
 */
export const reportSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  order: z.number(),
  content: z.string().optional(),
  visualizationId: z.string().optional(),
  visualization: z.any().optional(), // This would be the AnalyticsVisualization type
  metadata: z.record(z.any()).optional(),
});

export type ReportSection = z.infer<typeof reportSectionSchema>;

/**
 * Report Schema
 * Defines the structure of a report
 */
export const reportSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: z.nativeEnum(ReportType),
  status: z.nativeEnum(ReportStatus).default(ReportStatus.DRAFT),
  format: z.nativeEnum(ReportFormat).default(ReportFormat.PDF),
  frequency: z.nativeEnum(ReportFrequency).default(ReportFrequency.ONCE),
  visibility: z.nativeEnum(ReportVisibility).default(ReportVisibility.PRIVATE),
  entityType: z.nativeEnum(AnalyticsEntityType).optional(),
  entityId: z.string().optional(),
  sections: z.array(reportSectionSchema).default([]),
  scheduledAt: z.date().optional(),
  lastGeneratedAt: z.date().optional(),
  nextGenerationAt: z.date().optional(),
  recipients: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.record(z.any()).optional(),
});

export type Report = z.infer<typeof reportSchema>;

/**
 * Report Generation Schema
 * Defines the structure of a report generation
 */
export const reportGenerationSchema = z.object({
  id: z.string(),
  reportId: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  format: z.nativeEnum(ReportFormat),
  fileUrl: z.string().optional(),
  error: z.string().optional(),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export type ReportGeneration = z.infer<typeof reportGenerationSchema>;

/**
 * Report Template Schema
 * Defines the structure of a report template
 */
export const reportTemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: z.nativeEnum(ReportType),
  format: z.nativeEnum(ReportFormat).default(ReportFormat.PDF),
  sections: z.array(reportSectionSchema).default([]),
  tags: z.array(z.string()).default([]),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.record(z.any()).optional(),
});

export type ReportTemplate = z.infer<typeof reportTemplateSchema>;

/**
 * Report Filter Options
 * Used for filtering reports in lists
 */
export interface ReportFilterOptions {
  status?: ReportStatus[];
  type?: ReportType[];
  format?: ReportFormat[];
  frequency?: ReportFrequency[];
  visibility?: ReportVisibility[];
  entityType?: AnalyticsEntityType[];
  entityId?: string;
  createdBy?: string;
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  searchTerm?: string;
}

/**
 * Report Sort Options
 * Used for sorting reports in lists
 */
export enum ReportSortField {
  TITLE = 'title',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  SCHEDULED_AT = 'scheduledAt',
  LAST_GENERATED_AT = 'lastGeneratedAt',
  TYPE = 'type',
  STATUS = 'status',
}

export interface ReportSortOptions {
  field: ReportSortField;
  direction: 'asc' | 'desc';
}
