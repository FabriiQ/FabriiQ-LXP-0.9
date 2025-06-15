/**
 * Activity Teacher Router
 * Handles API routes for teacher-specific activity operations
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus } from "@prisma/client";

export const activityTeacherRouter = createTRPCRouter({
  listByTeacher: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      status: z.nativeEnum(SystemStatus).optional().default(SystemStatus.ACTIVE),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Get all activities created by this teacher using Prisma ORM
        const activities = await ctx.prisma.activity.findMany({
          where: {
            class: {
              teachers: {
                some: {
                  teacherId: input.teacherId
                }
              }
            },
            status: input.status
          },
          include: {
            subject: {
              select: {
                id: true,
                name: true
              }
            },
            topic: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Transform the results to maintain the same response structure
        const transformedActivities = activities.map(activity => {
          // Create a new object with the desired structure
          // Use type assertion to handle the included relations
          const activityWithRelations = activity as unknown as {
            subject?: { name: string | null } | null;
            topic?: { title: string | null } | null;
            [key: string]: any;
          };

          return {
            id: activity.id,
            title: activity.title,
            purpose: activity.purpose,
            status: activity.status,
            // Add other fields from activity as needed
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt,
            // Add subject and topic properties in the expected format
            subject: { name: activityWithRelations.subject?.name || null },
            topic: activityWithRelations.topic ? { title: activityWithRelations.topic.title } : null
          };
        });

        return transformedActivities;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get teacher activities: ${(error as Error).message}`,
        });
      }
    }),
});
