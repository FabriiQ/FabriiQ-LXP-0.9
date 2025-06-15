import { TRPCError } from '@trpc/server';
import { prisma } from '../../db';
import type { SystemStatus } from '../constants';

// Define event types based on schema
type AnalyticsEventType = 
  | 'LOGIN'
  | 'ASSESSMENT_SUBMISSION'
  | 'ATTENDANCE_MARKED'
  | 'GRADE_UPDATED'
  | 'FEEDBACK_ADDED'
  | 'RESOURCE_ACCESS'
  | 'SYSTEM_ERROR'
  | 'PERFORMANCE_METRIC'
  | 'CLASS_CREATED'
  | 'CLASS_UPDATED'
  | 'ENROLLMENT_CHANGED'
  | 'TEACHER_ASSIGNED'
  | 'SCHEDULE_UPDATED'
  | 'COURSE_CREATED'
  | 'COURSE_UPDATED'
  | 'COURSE_ARCHIVED'
  | 'COURSE_ENROLLMENT_CHANGED';

type AnalyticsEventInput = {
  eventType: AnalyticsEventType;
  userId: string;
  institutionId: string;
  campusId?: string;
  metadata: any;
  sessionId?: string;
  deviceInfo?: any;
};

type AnalyticsMetricInput = {
  name: string;
  value: number;
  institutionId: string;
  campusId?: string;
  userId?: string;
  dimensions?: any;
  tags?: any;
};

type MetricData = {
  value: number;
  timestamp: Date;
};

export class AnalyticsService {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  async trackEvent(data: AnalyticsEventInput) {
    // Validate institution exists
    const institution = await this.prisma.institution.findUnique({
      where: { id: data.institutionId }
    });

    if (!institution) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Institution not found'
      });
    }

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    // If campusId is provided, validate campus exists
    if (data.campusId) {
      const campus = await this.prisma.campus.findUnique({
        where: { id: data.campusId }
      });

      if (!campus) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campus not found'
        });
      }
    }

    return this.prisma.analyticsEvent.create({
      data: {
        ...data,
        status: 'ACTIVE'
      }
    });
  }

  async trackMetric(data: AnalyticsMetricInput) {
    // Validate institution exists
    const institution = await this.prisma.institution.findUnique({
      where: { id: data.institutionId }
    });

    if (!institution) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Institution not found'
      });
    }

    // If campusId is provided, validate campus exists
    if (data.campusId) {
      const campus = await this.prisma.campus.findUnique({
        where: { id: data.campusId }
      });

      if (!campus) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campus not found'
        });
      }
    }

    // If userId is provided, validate user exists
    if (data.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId }
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }
    }

    return this.prisma.analyticsMetric.create({
      data: {
        ...data,
        status: 'ACTIVE'
      }
    });
  }

  async getEvents(params: {
    institutionId?: string;
    campusId?: string;
    userId?: string;
    eventType?: AnalyticsEventType;
    startDate?: Date;
    endDate?: Date;
    status?: SystemStatus;
    skip?: number;
    take?: number;
  }) {
    const { institutionId, campusId, userId, eventType, startDate, endDate, status = 'ACTIVE', skip = 0, take = 10 } = params;

    return this.prisma.analyticsEvent.findMany({
      where: {
        institutionId,
        campusId,
        userId,
        eventType,
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        status
      },
      include: {
        user: true,
        institution: true,
        campus: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      skip,
      take
    });
  }

  async getMetrics(params: {
    institutionId?: string;
    campusId?: string;
    userId?: string;
    name?: string;
    startDate?: Date;
    endDate?: Date;
    status?: SystemStatus;
    skip?: number;
    take?: number;
  }) {
    const { institutionId, campusId, userId, name, startDate, endDate, status = 'ACTIVE', skip = 0, take = 10 } = params;

    return this.prisma.analyticsMetric.findMany({
      where: {
        institutionId,
        campusId,
        userId,
        name,
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        status
      },
      include: {
        institution: true,
        campus: true,
        user: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      skip,
      take
    });
  }

  async aggregateMetrics(params: {
    institutionId: string;
    campusId?: string;
    name: string;
    startDate?: Date;
    endDate?: Date;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const { institutionId, campusId, name, startDate, endDate } = params;

    const metrics = await this.prisma.analyticsMetric.findMany({
      where: {
        institutionId,
        campusId,
        name,
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        status: 'ACTIVE'
      },
      select: {
        value: true,
        timestamp: true
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    // Calculate basic statistics
    const values = metrics.map((m: MetricData) => m.value);
    const sum = values.reduce((a: number, b: number) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      name,
      count: metrics.length,
      sum,
      average: avg,
      minimum: min,
      maximum: max,
      timeSeries: metrics
    };
  }
} 