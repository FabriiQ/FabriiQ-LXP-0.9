import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma, SystemStatus } from "@prisma/client";
import { AcademicCycleService } from "../services/academic-cycle.service";

export const academicCycleRouter = createTRPCRouter({
  // Update the list endpoint to return all academic cycles
  list: protectedProcedure
    .input(
      z.object({
        institutionId: z.string().optional(),
        campusId: z.string().optional(),
        search: z.string().optional(),
        status: z.string().optional(),
        page: z.number().optional().default(1),
        pageSize: z.number().optional().default(10),
        sortBy: z.string().optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      }).optional()
    )
    .query(async ({ ctx, input = {} }) => {
      const { 
        institutionId, 
        campusId, 
        search, 
        status, 
        page = 1, 
        pageSize = 10,
        sortBy = "createdAt",
        sortOrder = "desc"
      } = input;

      // Use the provided institutionId or throw an error if not provided
      if (!institutionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Institution ID is required",
        });
      }

      // Build the where clause
      let where: Prisma.AcademicCycleWhereInput = {
        institutionId,
      };

      // Add search filter if provided
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ];
      }

      // Add status filter if provided
      if (status) {
        where.status = status as SystemStatus;
      }

      // Get total count for pagination
      const total = await ctx.prisma.academicCycle.count({ where });

      // Get the academic cycles
      const academicCycles = await ctx.prisma.academicCycle.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          terms: true,
          institution: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
      });

      return {
        items: academicCycles,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),
}); 
