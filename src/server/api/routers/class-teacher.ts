/**
 * Class Teacher Router
 * Handles API routes for teacher-specific class operations
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus } from "@prisma/client";

export const classTeacherRouter = createTRPCRouter({
  getByTeacher: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      status: z.nativeEnum(SystemStatus).optional().default(SystemStatus.ACTIVE),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Find classes where the teacher is assigned
        const teacherAssignments = await ctx.prisma.teacherAssignment.findMany({
          where: {
            teacherId: input.teacherId,
            status: input.status
          },
          include: {
            class: {
              include: {
                term: true,
                courseCampus: {
                  include: {
                    course: true
                  }
                },
                programCampus: {
                  include: {
                    program: true
                  }
                },
                campus: true,
                facility: true
              }
            }
          }
        });

        // Extract the classes from the assignments
        const classes = teacherAssignments.map(assignment => assignment.class);
        
        return classes;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get teacher classes: ${(error as Error).message}`,
        });
      }
    }),
});
