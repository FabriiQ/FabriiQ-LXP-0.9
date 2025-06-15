import { z } from 'zod';

/**
 * Analytics Time Period Enum
 * Represents the time period for analytics data
 */
export enum AnalyticsTimePeriod {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
  CUSTOM = 'CUSTOM',
}

/**
 * Analytics Granularity Enum
 * Represents the granularity of analytics data
 */
export enum AnalyticsGranularity {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

/**
 * Analytics Entity Type Enum
 * Represents the type of entity for analytics
 */
export enum AnalyticsEntityType {
  USER = 'USER',
  COURSE = 'COURSE',
  CLASS = 'CLASS',
  PROGRAM = 'PROGRAM',
  ASSESSMENT = 'ASSESSMENT',
  ACTIVITY = 'ACTIVITY',
  CAMPUS = 'CAMPUS',
  ORGANIZATION = 'ORGANIZATION',
}

/**
 * Analytics Metric Type Enum
 * Represents the type of metric for analytics
 */
export enum AnalyticsMetricType {
  COUNT = 'COUNT',
  SUM = 'SUM',
  AVERAGE = 'AVERAGE',
  MEDIAN = 'MEDIAN',
  MIN = 'MIN',
  MAX = 'MAX',
  PERCENTAGE = 'PERCENTAGE',
  RATIO = 'RATIO',
  CUSTOM = 'CUSTOM',
}

/**
 * Analytics Visualization Type Enum
 * Represents the type of visualization for analytics
 */
export enum AnalyticsVisualizationType {
  BAR_CHART = 'BAR_CHART',
  LINE_CHART = 'LINE_CHART',
  PIE_CHART = 'PIE_CHART',
  AREA_CHART = 'AREA_CHART',
  SCATTER_PLOT = 'SCATTER_PLOT',
  HEATMAP = 'HEATMAP',
  TABLE = 'TABLE',
  NUMBER = 'NUMBER',
  GAUGE = 'GAUGE',
  RADAR = 'RADAR',
  FUNNEL = 'FUNNEL',
  SANKEY = 'SANKEY',
  TREE_MAP = 'TREE_MAP',
  CUSTOM = 'CUSTOM',
}

/**
 * Analytics Data Point Schema
 * Defines the structure of an analytics data point
 */
export const analyticsDataPointSchema = z.object({
  id: z.string().optional(),
  timestamp: z.date(),
  value: z.number(),
  label: z.string().optional(),
  category: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type AnalyticsDataPoint = z.infer<typeof analyticsDataPointSchema>;

/**
 * Analytics Series Schema
 * Defines the structure of an analytics series
 */
export const analyticsSeriesSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  data: z.array(analyticsDataPointSchema),
  metadata: z.record(z.any()).optional(),
});

export type AnalyticsSeries = z.infer<typeof analyticsSeriesSchema>;

/**
 * Analytics Dataset Schema
 * Defines the structure of an analytics dataset
 */
export const analyticsDatasetSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  entityType: z.nativeEnum(AnalyticsEntityType),
  entityId: z.string().optional(),
  metricType: z.nativeEnum(AnalyticsMetricType),
  metricName: z.string(),
  metricUnit: z.string().optional(),
  timePeriod: z.nativeEnum(AnalyticsTimePeriod),
  granularity: z.nativeEnum(AnalyticsGranularity),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  series: z.array(analyticsSeriesSchema),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AnalyticsDataset = z.infer<typeof analyticsDatasetSchema>;

/**
 * Analytics Visualization Schema
 * Defines the structure of an analytics visualization
 */
export const analyticsVisualizationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: z.nativeEnum(AnalyticsVisualizationType),
  dataset: analyticsDatasetSchema,
  config: z.record(z.any()),
  isRealTime: z.boolean().default(false),
  refreshInterval: z.number().optional(), // in seconds
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AnalyticsVisualization = z.infer<typeof analyticsVisualizationSchema>;

/**
 * Analytics Dashboard Schema
 * Defines the structure of an analytics dashboard
 */
export const analyticsDashboardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  visualizations: z.array(z.object({
    id: z.string(),
    visualizationId: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
  })),
  isPublic: z.boolean().default(false),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AnalyticsDashboard = z.infer<typeof analyticsDashboardSchema>;

/**
 * Analytics Filter Options
 * Used for filtering analytics in lists
 */
export interface AnalyticsFilterOptions {
  entityType?: AnalyticsEntityType[];
  entityId?: string;
  metricType?: AnalyticsMetricType[];
  timePeriod?: AnalyticsTimePeriod[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  searchTerm?: string;
}

/**
 * Analytics Sort Options
 * Used for sorting analytics in lists
 */
export enum AnalyticsSortField {
  TITLE = 'title',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  ENTITY_TYPE = 'entityType',
  METRIC_TYPE = 'metricType',
}

export interface AnalyticsSortOptions {
  field: AnalyticsSortField;
  direction: 'asc' | 'desc';
}
