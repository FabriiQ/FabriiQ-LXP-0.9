import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { SystemStatus as PrismaSystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { UserType, SystemStatus } from "../constants";
import { paginationSchema } from "../schemas/common.schema";
import { CampusService } from "../services/campus.service";

export const campusRouter = createTRPCRouter({
  // Get all campuses (simplified version for testing)
  getAll: protectedProcedure
    .query(async () => {
      // Return mock data for testing
      return [
        { id: 'campus1', name: 'Main Campus', status: 'ACTIVE' },
        { id: 'campus2', name: 'Downtown Campus', status: 'ACTIVE' },
        { id: 'campus3', name: 'North Campus', status: 'ACTIVE' },
      ];
    }),
  // Get all campuses
  getAllCampuses: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Check if user has system-level access
        if (![UserType.SYSTEM_ADMIN, UserType.SYSTEM_MANAGER].includes(ctx.session.user.userType as UserType)) {
          // If not system admin, only return campuses the user has access to
          const userCampuses = await ctx.prisma.userCampusAccess.findMany({
            where: {
              userId: ctx.session.user.id,
              status: 'ACTIVE' as PrismaSystemStatus,
            },
            include: {
              campus: true,
            },
          });

          return userCampuses.map(access => access.campus);
        }

        // For system admins, return all campuses
        return ctx.prisma.campus.findMany({
          where: {
            status: 'ACTIVE' as PrismaSystemStatus,
          },
          orderBy: {
            name: 'asc',
          },
        });
      } catch (error) {
        console.error('Error fetching campuses:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch campuses',
        });
      }
    }),
  // Get campus classes
  getClasses: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      ...paginationSchema.shape,
      programId: z.string().optional(),
      termId: z.string().optional(),
      status: z.nativeEnum(PrismaSystemStatus).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (![UserType.SYSTEM_ADMIN, UserType.CAMPUS_ADMIN, UserType.CAMPUS_TEACHER, UserType.CAMPUS_COORDINATOR].includes(ctx.session.user.userType as UserType)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const { campusId, page, pageSize, sortBy, sortOrder, ...filters } = input;
      const service = new CampusService({ prisma: ctx.prisma });
      return service.getCampusClasses(campusId, { page, pageSize, sortBy, sortOrder }, { ...filters, status: filters.status as SystemStatus });
    }),

  findById: protectedProcedure
    .input(z.object({
      campusId: z.string().min(1, "Campus ID is required"),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // If no campus ID provided, try to use the user's primary campus
        if (!input.campusId && ctx.session?.user?.primaryCampusId) {
          return ctx.prisma.campus.findUnique({
            where: { id: ctx.session.user.primaryCampusId },
          });
        }

        const campus = await ctx.prisma.campus.findUnique({
          where: { id: input.campusId },
        });

        if (!campus) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Campus with ID ${input.campusId} not found`,
          });
        }

        return campus;
      } catch (error) {
        console.error(`Error finding campus with ID ${input.campusId}:`, error);
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "An error occurred while retrieving campus data",
            });
      }
    }),

  // Get campus by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string().min(1, "Campus ID is required"),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const campus = await ctx.prisma.campus.findUnique({
          where: { id: input.id },
          include: {
            institution: true,
            _count: {
              select: {
                userAccess: true,
                facilities: true,
                programs: true,
              },
            },
          },
        });

        if (!campus) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Campus with ID ${input.id} not found`,
          });
        }

        return campus;
      } catch (error) {
        console.error(`Error finding campus with ID ${input.id}:`, error);
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "An error occurred while retrieving campus data",
            });
      }
    }),

  // Get user's primary campus
  getPrimaryCampus: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session?.user?.primaryCampusId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User does not have a primary campus assigned",
        });
      }

      const campus = await ctx.prisma.campus.findUnique({
        where: { id: ctx.session.user.primaryCampusId },
      });

      if (!campus) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Primary campus not found",
        });
      }

      return campus;
    }),

  // Assign a program to a campus
  assignProgram: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      programId: z.string(),
      startDate: z.date(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission to assign programs
      if (![UserType.SYSTEM_ADMIN, UserType.SYSTEM_MANAGER, UserType.CAMPUS_ADMIN, UserType.CAMPUS_COORDINATOR].includes(ctx.session.user.userType as UserType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to assign programs to campuses",
        });
      }

      const campusService = new CampusService({ prisma: ctx.prisma });
      return campusService.assignProgramToCampus(
        input.campusId,
        input.programId,
        input.startDate,
        input.endDate
      );
    }),

  // Unassign a program from a campus
  unassignProgram: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      programId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission to unassign programs
      if (![UserType.SYSTEM_ADMIN, UserType.SYSTEM_MANAGER, UserType.CAMPUS_ADMIN, UserType.CAMPUS_COORDINATOR].includes(ctx.session.user.userType as UserType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to unassign programs from campuses",
        });
      }

      const campusService = new CampusService({ prisma: ctx.prisma });
      return campusService.removeProgramFromCampus(
        input.campusId,
        input.programId
      );
    }),
});
