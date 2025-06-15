import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus, UserType } from "@prisma/client";
import { StudentPerformanceService, studentPerformanceQuerySchema } from "../services/student-performance.service";

export const studentPerformanceRouter = createTRPCRouter({
  // Get performance data for a student
  getStudentPerformance: protectedProcedure
    .input(studentPerformanceQuerySchema)
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

      // Check if user is authorized to access this student's performance
      if (user?.userType === UserType.CAMPUS_COORDINATOR) {
        // For coordinators, check if they are assigned to this program
        if (!user.coordinatorProfile) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Coordinator profile not found",
          });
        }

        // If programId is provided, check if coordinator is assigned to it
        if (input.programId) {
          const managedPrograms = user.coordinatorProfile.managedPrograms as any[];
          const isAssigned = managedPrograms.some(p => 
            p.programId === input.programId && 
            (!input.campusId || p.campusId === input.campusId)
          );

          if (!isAssigned) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Not authorized to access this program's student performance",
            });
          }
        } else if (input.studentId || input.enrollmentId) {
          // If only studentId or enrollmentId is provided, we need to check if the student
          // is enrolled in a program that the coordinator is assigned to
          
          let programId: string | null = null;
          let campusId: string | null = null;
          
          if (input.enrollmentId) {
            const enrollment = await ctx.prisma.studentEnrollment.findUnique({
              where: { id: input.enrollmentId },
              include: {
                programCampus: true
              }
            });
            
            if (enrollment) {
              programId = enrollment.programCampus.programId;
              campusId = enrollment.programCampus.campusId;
            }
          } else if (input.studentId) {
            const enrollment = await ctx.prisma.studentEnrollment.findFirst({
              where: { 
                studentId: input.studentId,
                status: SystemStatus.ACTIVE
              },
              include: {
                programCampus: true
              },
              orderBy: {
                createdAt: 'desc'
              }
            });
            
            if (enrollment) {
              programId = enrollment.programCampus.programId;
              campusId = enrollment.programCampus.campusId;
            }
          }
          
          if (programId) {
            const managedPrograms = user.coordinatorProfile.managedPrograms as any[];
            const isAssigned = managedPrograms.some(p => 
              p.programId === programId && 
              (!campusId || p.campusId === campusId)
            );

            if (!isAssigned) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Not authorized to access this student's performance",
              });
            }
          } else {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Student enrollment not found",
            });
          }
        }
      } else if (
        user?.userType !== UserType.SYSTEM_ADMIN && 
        user?.userType !== UserType.SYSTEM_MANAGER &&
        user?.userType !== UserType.CAMPUS_ADMIN
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to access student performance",
        });
      }

      const performanceService = new StudentPerformanceService({ prisma: ctx.prisma });
      return performanceService.getStudentPerformance(input);
    }),

  // Get cohort performance data
  getCohortPerformance: protectedProcedure
    .input(studentPerformanceQuerySchema)
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

      // Check if user is authorized to access cohort performance
      if (user?.userType === UserType.CAMPUS_COORDINATOR) {
        // For coordinators, check if they are assigned to this program
        if (!user.coordinatorProfile) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Coordinator profile not found",
          });
        }

        // If programId is provided, check if coordinator is assigned to it
        if (input.programId) {
          const managedPrograms = user.coordinatorProfile.managedPrograms as any[];
          const isAssigned = managedPrograms.some(p => 
            p.programId === input.programId && 
            (!input.campusId || p.campusId === input.campusId)
          );

          if (!isAssigned) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Not authorized to access this program's cohort performance",
            });
          }
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Program ID is required for cohort performance",
          });
        }
      } else if (
        user?.userType !== UserType.SYSTEM_ADMIN && 
        user?.userType !== UserType.SYSTEM_MANAGER &&
        user?.userType !== UserType.CAMPUS_ADMIN
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to access cohort performance",
        });
      }

      const performanceService = new StudentPerformanceService({ prisma: ctx.prisma });
      return performanceService.getCohortPerformance(input);
    }),
});
