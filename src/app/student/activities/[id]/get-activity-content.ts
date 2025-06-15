import { prisma } from "@/server/db";
import { logger } from "@/server/api/utils/logger";
import { unstable_cache } from 'next/cache';

// Cache duration in seconds
const CACHE_TTL = 30 * 60; // 30 minutes

/**
 * Get the full content of an activity by ID
 * This is separated from the main activities list to avoid caching large content
 * in the main activities page
 */
export const getActivityContent = unstable_cache(
  async (activityId: string) => {
    try {
      // Get the activity with full content
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        select: {
          id: true,
          content: true,
        },
      });

      if (!activity) {
        logger.warn(`Activity not found: ${activityId}`);
        return null;
      }

      return activity.content;
    } catch (error) {
      logger.error(`Error getting activity content: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
        error, 
        activityId 
      });
      throw error;
    }
  },
  ['activity-content'],
  { revalidate: CACHE_TTL, tags: ['activity-content'] }
);
