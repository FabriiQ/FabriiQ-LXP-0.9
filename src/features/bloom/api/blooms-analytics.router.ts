/**
 * Bloom's Taxonomy Analytics Router
 * 
 * This router provides API endpoints for Bloom's Taxonomy analytics.
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { BloomsAnalyticsService } from '../services/analytics/blooms-analytics.service';
import { AssessmentAnalyticsService } from '../services/analytics/assessment-analytics.service';
import { BloomsReportingService } from '../services/analytics/blooms-reporting.service';
import { BloomsTaxonomyLevel } from '../types/bloom-taxonomy';

// Create enum schema for Bloom's Taxonomy levels
const BloomsTaxonomyLevelEnum = z.enum([
  BloomsTaxonomyLevel.REMEMBER,
  BloomsTaxonomyLevel.UNDERSTAND,
  BloomsTaxonomyLevel.APPLY,
  BloomsTaxonomyLevel.ANALYZE,
  BloomsTaxonomyLevel.EVALUATE,
  BloomsTaxonomyLevel.CREATE
]);

/**
 * Bloom's Taxonomy Analytics Router
 */
export const bloomsAnalyticsRouter = createTRPCRouter({
  /**
   * Get class performance by Bloom's Taxonomy levels
   */
  getClassPerformance: protectedProcedure
    .input(z.object({
      classId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { classId, startDate, endDate } = input;
      
      // Parse dates if provided
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;
      
      const service = new BloomsAnalyticsService(ctx.prisma);
      return service.getClassPerformance(classId, parsedStartDate, parsedEndDate);
    }),

  /**
   * Get assessment performance by Bloom's Taxonomy levels
   */
  getAssessmentPerformance: protectedProcedure
    .input(z.object({
      assessmentId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { assessmentId } = input;
      
      const service = new AssessmentAnalyticsService(ctx.prisma);
      return service.getAssessmentPerformance(assessmentId);
    }),

  /**
   * Compare multiple assessments
   */
  compareAssessments: protectedProcedure
    .input(z.object({
      assessmentIds: z.array(z.string())
    }))
    .query(async ({ ctx, input }) => {
      const { assessmentIds } = input;
      
      const service = new AssessmentAnalyticsService(ctx.prisma);
      return service.compareAssessments(assessmentIds);
    }),

  /**
   * Generate a comprehensive analytics report for a class
   */
  generateClassReport: protectedProcedure
    .input(z.object({
      classId: z.string(),
      teacherId: z.string(),
      startDate: z.string(),
      endDate: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const { classId, teacherId, startDate, endDate } = input;
      
      const service = new BloomsReportingService(ctx.prisma);
      const report = await service.generateClassReport(
        classId,
        teacherId,
        new Date(startDate),
        new Date(endDate)
      );
      
      return service.saveReport(report);
    }),

  /**
   * Get a report by ID
   */
  getReport: protectedProcedure
    .input(z.object({
      reportId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { reportId } = input;
      
      const service = new BloomsReportingService(ctx.prisma);
      return service.getReport(reportId);
    }),

  /**
   * Get student performance by Bloom's Taxonomy levels
   */
  getStudentPerformance: protectedProcedure
    .input(z.object({
      studentId: z.string(),
      classId: z.string().optional(),
      subjectId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { studentId, classId, subjectId, startDate, endDate } = input;
      
      // Parse dates if provided
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;

      let actualSubjectId: string | undefined = subjectId;

      if (classId && !actualSubjectId) {
        const classInfo = await ctx.prisma.class.findUnique({
          where: { id: classId },
          select: {
            courseCampus: {
              select: {
                course: {
                  select: {
                    subjects: {
                      select: { id: true },
                      take: 1 // Assuming one primary subject per course for this context
                    }
                  }
                }
              }
            }
          }
        });
        if (classInfo?.courseCampus?.course?.subjects?.[0]?.id) {
          actualSubjectId = classInfo.courseCampus.course.subjects[0].id;
        } else {
          // Optional: Handle case where subjectId cannot be derived from classId.
          // Could throw an error or proceed without subject filtering if appropriate.
          // For now, we'll let it proceed, and if actualSubjectId remains undefined,
          // no subject-based filtering will occur unless explicitly passed.
          console.warn(`Could not derive subjectId for classId: ${classId}`);
        }
      }
      
      // Get topic masteries for this student
      const topicMasteries = await ctx.prisma.topicMastery.findMany({
        where: {
          studentId,
          ...(actualSubjectId && { subjectId: actualSubjectId }),
          ...(parsedStartDate && parsedEndDate && {
            updatedAt: {
              gte: parsedStartDate,
              lte: parsedEndDate
            }
          })
        },
        include: {
          topic: {
            select: {
              id: true,
              title: true,
              subjectId: true,
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });
      
      // Get student details
      const student = await ctx.prisma.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      if (!student) {
        throw new Error('Student not found');
      }
      
      // Calculate average mastery for each Bloom's level
      const totalTopics = topicMasteries.length;
      const performance = {
        studentId,
        studentName: student.user.name || 'Unknown',
        [BloomsTaxonomyLevel.REMEMBER]: 0,
        [BloomsTaxonomyLevel.UNDERSTAND]: 0,
        [BloomsTaxonomyLevel.APPLY]: 0,
        [BloomsTaxonomyLevel.ANALYZE]: 0,
        [BloomsTaxonomyLevel.EVALUATE]: 0,
        [BloomsTaxonomyLevel.CREATE]: 0,
        overallMastery: 0
      };
      
      if (totalTopics > 0) {
        // Sum up mastery levels
        topicMasteries.forEach(mastery => {
          performance[BloomsTaxonomyLevel.REMEMBER] += mastery.rememberLevel;
          performance[BloomsTaxonomyLevel.UNDERSTAND] += mastery.understandLevel;
          performance[BloomsTaxonomyLevel.APPLY] += mastery.applyLevel;
          performance[BloomsTaxonomyLevel.ANALYZE] += mastery.analyzeLevel;
          performance[BloomsTaxonomyLevel.EVALUATE] += mastery.evaluateLevel;
          performance[BloomsTaxonomyLevel.CREATE] += mastery.createLevel;
          performance.overallMastery += mastery.overallMastery;
        });
        
        // Calculate averages
        performance[BloomsTaxonomyLevel.REMEMBER] = Math.round(performance[BloomsTaxonomyLevel.REMEMBER] / totalTopics);
        performance[BloomsTaxonomyLevel.UNDERSTAND] = Math.round(performance[BloomsTaxonomyLevel.UNDERSTAND] / totalTopics);
        performance[BloomsTaxonomyLevel.APPLY] = Math.round(performance[BloomsTaxonomyLevel.APPLY] / totalTopics);
        performance[BloomsTaxonomyLevel.ANALYZE] = Math.round(performance[BloomsTaxonomyLevel.ANALYZE] / totalTopics);
        performance[BloomsTaxonomyLevel.EVALUATE] = Math.round(performance[BloomsTaxonomyLevel.EVALUATE] / totalTopics);
        performance[BloomsTaxonomyLevel.CREATE] = Math.round(performance[BloomsTaxonomyLevel.CREATE] / totalTopics);
        performance.overallMastery = Math.round(performance.overallMastery / totalTopics);
      }
      
      return performance;
    })
});
