import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { UnifiedLeaderboardService } from "@/features/leaderboard/services/unified-leaderboard.service";
import { LeaderboardEntityType, TimeGranularity } from "@/features/leaderboard/types/standard-leaderboard";

export const unifiedLeaderboardRouter = createTRPCRouter({
  // Get leaderboard for any entity type
  getLeaderboard: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          LeaderboardEntityType.CLASS,
          LeaderboardEntityType.SUBJECT,
          LeaderboardEntityType.COURSE,
          LeaderboardEntityType.CAMPUS,
          LeaderboardEntityType.CUSTOM_GROUP
        ]),
        referenceId: z.string(),
        timeGranularity: z.nativeEnum(TimeGranularity).optional().default(TimeGranularity.ALL_TIME),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().optional().default(0),
        includeCurrentStudent: z.boolean().optional().default(false),
        currentStudentId: z.string().optional(),
        searchQuery: z.string().optional(),
        sortBy: z.enum(['rank', 'academicScore', 'rewardPoints', 'completionRate']).optional().default('rank'),
        sortDirection: z.enum(['asc', 'desc']).optional().default('asc'),
      })
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const leaderboardService = new UnifiedLeaderboardService({ prisma: ctx.prisma });
      
      return leaderboardService.getLeaderboard({
        type: input.type,
        referenceId: input.referenceId,
        timeGranularity: input.timeGranularity,
        filterOptions: {
          limit: input.limit,
          offset: input.offset,
          includeCurrentStudent: input.includeCurrentStudent,
          currentStudentId: input.currentStudentId,
          searchQuery: input.searchQuery,
          sortBy: input.sortBy,
          sortDirection: input.sortDirection,
        }
      });
    }),
    
  // Get student position in leaderboard
  getStudentPosition: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          LeaderboardEntityType.CLASS,
          LeaderboardEntityType.SUBJECT,
          LeaderboardEntityType.COURSE,
          LeaderboardEntityType.CAMPUS,
          LeaderboardEntityType.CUSTOM_GROUP
        ]),
        referenceId: z.string(),
        studentId: z.string(),
        timeGranularity: z.nativeEnum(TimeGranularity).optional().default(TimeGranularity.ALL_TIME),
      })
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const leaderboardService = new UnifiedLeaderboardService({ prisma: ctx.prisma });
      
      const result = await leaderboardService.getLeaderboard({
        type: input.type,
        referenceId: input.referenceId,
        timeGranularity: input.timeGranularity,
        filterOptions: {
          includeCurrentStudent: true,
          currentStudentId: input.studentId,
          limit: 1, // We only need the student position
        }
      });
      
      return result.currentStudentPosition;
    }),
    
  // Get leaderboard history
  getLeaderboardHistory: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          LeaderboardEntityType.CLASS,
          LeaderboardEntityType.SUBJECT,
          LeaderboardEntityType.COURSE,
          LeaderboardEntityType.CAMPUS,
          LeaderboardEntityType.CUSTOM_GROUP
        ]),
        referenceId: z.string(),
        timeGranularity: z.nativeEnum(TimeGranularity).optional().default(TimeGranularity.ALL_TIME),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).optional().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const leaderboardService = new UnifiedLeaderboardService({ prisma: ctx.prisma });
      
      // This would call a method like getLeaderboardHistory on the service
      // For now, we'll return a placeholder
      return {
        snapshots: []
      };
    }),
});
