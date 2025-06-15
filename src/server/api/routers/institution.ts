import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { InstitutionService } from "../services/institution.service";
import { SystemStatus, UserType } from "../constants";
import { TRPCError } from "@trpc/server";

// Input validation schemas
const createInstitutionSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50),
  description: z.string().optional(),
  address: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  logo: z.string().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

const updateInstitutionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  logo: z.string().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

const institutionIdSchema = z.object({
  id: z.string(),
});

export const institutionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createInstitutionSchema)
    .mutation(async ({ input, ctx }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
        ].includes(ctx.session.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      
      const service = new InstitutionService({ prisma: ctx.prisma });
      return service.createInstitution(input);
    }),

  getById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const institution = await ctx.prisma.institution.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              campuses: true,
              programs: true,
              users: true,
            },
          },
        },
      });

      if (!institution) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Institution not found",
        });
      }

      return institution;
    }),

  list: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(10),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      status: z.nativeEnum(SystemStatus).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          UserType.CAMPUS_STUDENT,
        ].includes(ctx.session.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const { page, pageSize, sortBy, sortOrder, ...filters } = input;
      const service = new InstitutionService({ prisma: ctx.prisma });
      return service.listInstitutions(
        { page, pageSize, sortBy, sortOrder },
        filters,
      );
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateInstitutionSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
        ].includes(ctx.session.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new InstitutionService({ prisma: ctx.prisma });
      return service.updateInstitution(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(institutionIdSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.userType !== UserType.SYSTEM_ADMIN) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new InstitutionService({ prisma: ctx.prisma });
      return service.deleteInstitution(input.id);
    }),

  getStats: protectedProcedure
    .input(institutionIdSchema)
    .query(async ({ input, ctx }) => {
      // Verify user has appropriate access
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
        ].includes(ctx.session.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new InstitutionService({ prisma: ctx.prisma });
      return service.getInstitutionStats(input.id);
    }),

  getCurrent: protectedProcedure
    .query(async ({ ctx }) => {
      const institution = await ctx.prisma.institution.findFirst({
        where: { status: SystemStatus.ACTIVE },
      });

      if (!institution) {
        throw new Error("No active institution found");
      }

      return institution;
    }),
}); 