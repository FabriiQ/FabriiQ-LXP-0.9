import { PrismaClient, LessonPlanStatus, LessonPlanType } from '@prisma/client';
import { TRPCError } from '@trpc/server';

interface LessonPlanAnalyticsServiceContext {
  prisma: PrismaClient;
}

/**
 * Service for handling lesson plan analytics
 */
export class LessonPlanAnalyticsService {
  private prisma: PrismaClient;

  constructor({ prisma }: LessonPlanAnalyticsServiceContext) {
    this.prisma = prisma;
  }

  /**
   * Get approval rate metrics for lesson plans
   * @param campusId Optional campus ID to filter by
   * @param startDate Optional start date to filter by
   * @param endDate Optional end date to filter by
   * @returns Approval rate metrics
   */
  async getApprovalRateMetrics(
    campusId?: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      // Build the where clause
      const where: any = {};

      // Add optional filters
      if (campusId) {
        where.class = {
          campusId
        };
      }

      if (startDate) {
        where.createdAt = {
          ...where.createdAt,
          gte: startDate
        };
      }

      if (endDate) {
        where.createdAt = {
          ...where.createdAt,
          lte: endDate
        };
      }

      // Get counts by status
      const statusCounts = await this.prisma.lessonPlan.groupBy({
        by: ['status'],
        _count: {
          id: true
        },
        where
      });

      // Calculate total
      const total = statusCounts.reduce((sum, item) => sum + item._count.id, 0);

      // Calculate metrics
      const metrics = {
        total,
        draft: 0,
        submitted: 0,
        coordinatorApproved: 0,
        approved: 0,
        rejected: 0,
        approvalRate: 0,
        rejectionRate: 0,
        averageTimeToApproval: 0
      };

      // Fill in counts by status
      statusCounts.forEach(item => {
        switch (item.status) {
          case LessonPlanStatus.DRAFT:
            metrics.draft = item._count.id;
            break;
          case LessonPlanStatus.SUBMITTED:
            metrics.submitted = item._count.id;
            break;
          case LessonPlanStatus.COORDINATOR_APPROVED:
            metrics.coordinatorApproved = item._count.id;
            break;
          case LessonPlanStatus.APPROVED:
            metrics.approved = item._count.id;
            break;
          case LessonPlanStatus.REJECTED:
            metrics.rejected = item._count.id;
            break;
        }
      });

      // Calculate rates
      const processed = metrics.approved + metrics.rejected;
      metrics.approvalRate = processed > 0 ? (metrics.approved / processed) * 100 : 0;
      metrics.rejectionRate = processed > 0 ? (metrics.rejected / processed) * 100 : 0;

      // Calculate average time to approval
      const approvedLessonPlans = await this.prisma.lessonPlan.findMany({
        where: {
          ...where,
          status: LessonPlanStatus.APPROVED,
          submittedAt: { not: null },
          adminApprovedAt: { not: null }
        },
        select: {
          submittedAt: true,
          adminApprovedAt: true
        }
      });

      if (approvedLessonPlans.length > 0) {
        const totalTimeInHours = approvedLessonPlans.reduce((sum, plan) => {
          const submittedAt = plan.submittedAt!;
          const approvedAt = plan.adminApprovedAt!;
          const timeInHours = (approvedAt.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
          return sum + timeInHours;
        }, 0);

        metrics.averageTimeToApproval = totalTimeInHours / approvedLessonPlans.length;
      }

      return metrics;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get approval rate metrics: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get lesson plan metrics by teacher
   * @param campusId Optional campus ID to filter by
   * @param startDate Optional start date to filter by
   * @param endDate Optional end date to filter by
   * @returns Lesson plan metrics by teacher
   */
  async getMetricsByTeacher(
    campusId?: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      // Build the where clause
      const where: any = {};

      // Add optional filters
      if (campusId) {
        where.class = {
          campusId
        };
      }

      if (startDate) {
        where.createdAt = {
          ...where.createdAt,
          gte: startDate
        };
      }

      if (endDate) {
        where.createdAt = {
          ...where.createdAt,
          lte: endDate
        };
      }

      // Get lesson plans grouped by teacher
      const lessonPlans = await this.prisma.lessonPlan.findMany({
        where,
        include: {
          teacher: {
            include: {
              user: true
            }
          }
        }
      });

      // Group by teacher
      const teacherMap = new Map();
      
      lessonPlans.forEach(plan => {
        const teacherId = plan.teacherId;
        const teacherName = plan.teacher.user.name;
        
        if (!teacherMap.has(teacherId)) {
          teacherMap.set(teacherId, {
            id: teacherId,
            name: teacherName,
            total: 0,
            draft: 0,
            submitted: 0,
            coordinatorApproved: 0,
            approved: 0,
            rejected: 0,
            approvalRate: 0
          });
        }
        
        const teacherStats = teacherMap.get(teacherId);
        teacherStats.total++;
        
        switch (plan.status) {
          case LessonPlanStatus.DRAFT:
            teacherStats.draft++;
            break;
          case LessonPlanStatus.SUBMITTED:
            teacherStats.submitted++;
            break;
          case LessonPlanStatus.COORDINATOR_APPROVED:
            teacherStats.coordinatorApproved++;
            break;
          case LessonPlanStatus.APPROVED:
            teacherStats.approved++;
            break;
          case LessonPlanStatus.REJECTED:
            teacherStats.rejected++;
            break;
        }
      });
      
      // Calculate approval rates
      teacherMap.forEach(stats => {
        const processed = stats.approved + stats.rejected;
        stats.approvalRate = processed > 0 ? (stats.approved / processed) * 100 : 0;
      });
      
      return Array.from(teacherMap.values());
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get metrics by teacher: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get lesson plan metrics by subject
   * @param campusId Optional campus ID to filter by
   * @param startDate Optional start date to filter by
   * @param endDate Optional end date to filter by
   * @returns Lesson plan metrics by subject
   */
  async getMetricsBySubject(
    campusId?: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      // Build the where clause
      const where: any = {
        subject: { isNot: null }
      };

      // Add optional filters
      if (campusId) {
        where.class = {
          campusId
        };
      }

      if (startDate) {
        where.createdAt = {
          ...where.createdAt,
          gte: startDate
        };
      }

      if (endDate) {
        where.createdAt = {
          ...where.createdAt,
          lte: endDate
        };
      }

      // Get lesson plans grouped by subject
      const lessonPlans = await this.prisma.lessonPlan.findMany({
        where,
        include: {
          subject: true
        }
      });

      // Group by subject
      const subjectMap = new Map();
      
      lessonPlans.forEach(plan => {
        if (!plan.subject) return;
        
        const subjectId = plan.subjectId!;
        const subjectName = plan.subject.name;
        
        if (!subjectMap.has(subjectId)) {
          subjectMap.set(subjectId, {
            id: subjectId,
            name: subjectName,
            total: 0,
            draft: 0,
            submitted: 0,
            coordinatorApproved: 0,
            approved: 0,
            rejected: 0,
            approvalRate: 0
          });
        }
        
        const subjectStats = subjectMap.get(subjectId);
        subjectStats.total++;
        
        switch (plan.status) {
          case LessonPlanStatus.DRAFT:
            subjectStats.draft++;
            break;
          case LessonPlanStatus.SUBMITTED:
            subjectStats.submitted++;
            break;
          case LessonPlanStatus.COORDINATOR_APPROVED:
            subjectStats.coordinatorApproved++;
            break;
          case LessonPlanStatus.APPROVED:
            subjectStats.approved++;
            break;
          case LessonPlanStatus.REJECTED:
            subjectStats.rejected++;
            break;
        }
      });
      
      // Calculate approval rates
      subjectMap.forEach(stats => {
        const processed = stats.approved + stats.rejected;
        stats.approvalRate = processed > 0 ? (stats.approved / processed) * 100 : 0;
      });
      
      return Array.from(subjectMap.values());
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get metrics by subject: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get lesson plan metrics by month
   * @param campusId Optional campus ID to filter by
   * @param year Year to filter by (defaults to current year)
   * @returns Lesson plan metrics by month
   */
  async getMetricsByMonth(
    campusId?: string,
    year?: number
  ) {
    try {
      // Default to current year if not provided
      const targetYear = year || new Date().getFullYear();
      
      // Build the where clause
      const where: any = {
        createdAt: {
          gte: new Date(`${targetYear}-01-01`),
          lte: new Date(`${targetYear}-12-31`)
        }
      };

      // Add optional filters
      if (campusId) {
        where.class = {
          campusId
        };
      }

      // Get lesson plans for the year
      const lessonPlans = await this.prisma.lessonPlan.findMany({
        where,
        select: {
          status: true,
          createdAt: true
        }
      });

      // Initialize monthly stats
      const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        monthName: new Date(targetYear, i, 1).toLocaleString('default', { month: 'long' }),
        total: 0,
        draft: 0,
        submitted: 0,
        coordinatorApproved: 0,
        approved: 0,
        rejected: 0,
        approvalRate: 0
      }));
      
      // Group by month
      lessonPlans.forEach(plan => {
        const month = plan.createdAt.getMonth();
        const stats = monthlyStats[month];
        
        stats.total++;
        
        switch (plan.status) {
          case LessonPlanStatus.DRAFT:
            stats.draft++;
            break;
          case LessonPlanStatus.SUBMITTED:
            stats.submitted++;
            break;
          case LessonPlanStatus.COORDINATOR_APPROVED:
            stats.coordinatorApproved++;
            break;
          case LessonPlanStatus.APPROVED:
            stats.approved++;
            break;
          case LessonPlanStatus.REJECTED:
            stats.rejected++;
            break;
        }
      });
      
      // Calculate approval rates
      monthlyStats.forEach(stats => {
        const processed = stats.approved + stats.rejected;
        stats.approvalRate = processed > 0 ? (stats.approved / processed) * 100 : 0;
      });
      
      return monthlyStats;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get metrics by month: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get lesson plan metrics by plan type
   * @param campusId Optional campus ID to filter by
   * @param startDate Optional start date to filter by
   * @param endDate Optional end date to filter by
   * @returns Lesson plan metrics by plan type
   */
  async getMetricsByPlanType(
    campusId?: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      // Build the where clause
      const where: any = {};

      // Add optional filters
      if (campusId) {
        where.class = {
          campusId
        };
      }

      if (startDate) {
        where.createdAt = {
          ...where.createdAt,
          gte: startDate
        };
      }

      if (endDate) {
        where.createdAt = {
          ...where.createdAt,
          lte: endDate
        };
      }

      // Get counts by plan type
      const planTypeCounts = await this.prisma.lessonPlan.groupBy({
        by: ['planType'],
        _count: {
          id: true
        },
        where
      });

      // Calculate total
      const total = planTypeCounts.reduce((sum, item) => sum + item._count.id, 0);

      // Initialize metrics
      const metrics = {
        total,
        weekly: 0,
        monthly: 0,
        weeklyPercentage: 0,
        monthlyPercentage: 0
      };

      // Fill in counts by plan type
      planTypeCounts.forEach(item => {
        switch (item.planType) {
          case LessonPlanType.WEEKLY:
            metrics.weekly = item._count.id;
            break;
          case LessonPlanType.MONTHLY:
            metrics.monthly = item._count.id;
            break;
        }
      });

      // Calculate percentages
      metrics.weeklyPercentage = total > 0 ? (metrics.weekly / total) * 100 : 0;
      metrics.monthlyPercentage = total > 0 ? (metrics.monthly / total) * 100 : 0;

      return metrics;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get metrics by plan type: ${(error as Error).message}`,
      });
    }
  }
}
