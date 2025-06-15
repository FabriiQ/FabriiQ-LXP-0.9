import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { ClassPerformanceService } from "../services/class-performance.service";
import { TRPCError } from "@trpc/server";

export const classPerformanceRouter = createTRPCRouter({
  /**
   * Get class performance by class ID
   */
  getByClassId: protectedProcedure
    .input(z.object({ 
      classId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const service = new ClassPerformanceService({ prisma: ctx.prisma });
        const performance = await service.getClassPerformance(input.classId);
        
        if (!performance) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Class performance not found for class ID: ${input.classId}`
          });
        }
        
        return performance;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get class performance",
          cause: error
        });
      }
    }),
    
  /**
   * Get performance for multiple classes
   */
  getByClassIds: protectedProcedure
    .input(z.object({ 
      classIds: z.array(z.string())
    }))
    .query(async ({ ctx, input }) => {
      try {
        const service = new ClassPerformanceService({ prisma: ctx.prisma });
        const performances = await service.getClassPerformanceByIds(input.classIds);
        
        return performances;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get class performances",
          cause: error
        });
      }
    }),
    
  /**
   * Update class performance metrics
   */
  updateMetrics: protectedProcedure
    .input(z.object({
      classId: z.string(),
      data: z.object({
        // Academic metrics
        averageGrade: z.number().optional(),
        passingRate: z.number().optional(),
        highestGrade: z.number().optional(),
        lowestGrade: z.number().optional(),
        
        // Attendance metrics
        attendanceRate: z.number().optional(),
        presentCount: z.number().optional(),
        absentCount: z.number().optional(),
        lateCount: z.number().optional(),
        excusedCount: z.number().optional(),
        
        // Participation metrics
        participationRate: z.number().optional(),
        activeStudents: z.number().optional(),
        
        // Activity metrics
        completionRate: z.number().optional(),
        submissionRate: z.number().optional(),
        activitiesCreated: z.number().optional(),
        activitiesGraded: z.number().optional(),
        
        // Points metrics
        totalPoints: z.number().optional(),
        averagePoints: z.number().optional(),
        
        // Improvement metrics
        gradeImprovement: z.number().optional(),
        
        // Teacher metrics
        teacherFeedbackRate: z.number().optional(),
        gradingTimeliness: z.number().optional(),
        
        // Metadata
        metadata: z.any().optional()
      }).partial()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const service = new ClassPerformanceService({ prisma: ctx.prisma });
        const performance = await service.updateClassPerformance(input.classId, input.data);
        
        return performance;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update class performance metrics",
          cause: error
        });
      }
    }),
    
  /**
   * Calculate and update all metrics for a class
   */
  calculateAndUpdateMetrics: protectedProcedure
    .input(z.object({ 
      classId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const service = new ClassPerformanceService({ prisma: ctx.prisma });
        const performance = await service.calculateAndUpdateMetrics(input.classId);
        
        return performance;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to calculate and update class performance metrics",
          cause: error
        });
      }
    }),
    
  /**
   * Batch update class performance for multiple classes
   */
  batchUpdateClassPerformance: protectedProcedure
    .input(z.object({ 
      classIds: z.array(z.string())
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const service = new ClassPerformanceService({ prisma: ctx.prisma });
        const performances = await service.batchUpdateClassPerformance(input.classIds);
        
        return performances;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to batch update class performances",
          cause: error
        });
      }
    })
});
