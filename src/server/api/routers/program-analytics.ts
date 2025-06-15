import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus, UserType } from "@prisma/client";
import { ProgramAnalyticsService, programAnalyticsQuerySchema } from "../services/program-analytics.service";

export const programAnalyticsRouter = createTRPCRouter({
  // Get enrollment analytics for a program
  getEnrollmentAnalytics: protectedProcedure
    .input(programAnalyticsQuerySchema)
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Get user details
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { 
          userType: true,
          coordinatorProfile: true
        }
      });

      // Check if user is authorized to access this program's analytics
      if (user?.userType === UserType.CAMPUS_COORDINATOR) {
        // For coordinators, check if they are assigned to this program
        if (!user.coordinatorProfile) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Coordinator profile not found",
          });
        }

        const managedPrograms = user.coordinatorProfile.managedPrograms as any[];
        const isAssigned = managedPrograms.some(p => 
          p.programId === input.programId && 
          (!input.campusId || p.campusId === input.campusId)
        );

        if (!isAssigned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to access this program's analytics",
          });
        }
      } else if (
        user?.userType !== UserType.SYSTEM_ADMIN && 
        user?.userType !== UserType.SYSTEM_MANAGER &&
        user?.userType !== UserType.CAMPUS_ADMIN
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to access program analytics",
        });
      }

      const analyticsService = new ProgramAnalyticsService({ prisma: ctx.prisma });
      return analyticsService.getEnrollmentAnalytics(input);
    }),

  // Get performance analytics for a program
  getPerformanceAnalytics: protectedProcedure
    .input(programAnalyticsQuerySchema)
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Get user details
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { 
          userType: true,
          coordinatorProfile: true
        }
      });

      // Check if user is authorized to access this program's analytics
      if (user?.userType === UserType.CAMPUS_COORDINATOR) {
        // For coordinators, check if they are assigned to this program
        if (!user.coordinatorProfile) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Coordinator profile not found",
          });
        }

        const managedPrograms = user.coordinatorProfile.managedPrograms as any[];
        const isAssigned = managedPrograms.some(p => 
          p.programId === input.programId && 
          (!input.campusId || p.campusId === input.campusId)
        );

        if (!isAssigned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to access this program's analytics",
          });
        }
      } else if (
        user?.userType !== UserType.SYSTEM_ADMIN && 
        user?.userType !== UserType.SYSTEM_MANAGER &&
        user?.userType !== UserType.CAMPUS_ADMIN
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to access program analytics",
        });
      }

      const analyticsService = new ProgramAnalyticsService({ prisma: ctx.prisma });
      return analyticsService.getPerformanceAnalytics(input);
    }),
});
