import { prisma } from "@/server/db";
import { logger } from "./logger";

/**
 * Ensures a user has a primary campus assigned if they have active campus access
 * @param userId - The user ID to check and update
 * @returns The primary campus ID if found or assigned, null otherwise
 */
export async function ensureUserPrimaryCampus(userId: string): Promise<string | null> {
  try {
    // Get the user with their primary campus and active campuses
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userType: true,
        primaryCampusId: true,
        activeCampuses: {
          where: { status: 'ACTIVE' },
          select: {
            campusId: true
          }
        }
      }
    });

    if (!user) {
      logger.warn("User not found when ensuring primary campus", { userId });
      return null;
    }

    // If user already has a primary campus, return it
    if (user.primaryCampusId) {
      return user.primaryCampusId;
    }

    // If user has active campuses but no primary campus, assign the first one
    if (user.activeCampuses.length > 0) {
      const campusId = user.activeCampuses[0].campusId;
      
      // Update the user's primary campus
      await prisma.user.update({
        where: { id: userId },
        data: { primaryCampusId: campusId }
      });
      
      logger.info("Assigned primary campus to user", { 
        userId, 
        campusId,
        userType: user.userType
      });
      
      return campusId;
    }

    logger.warn("User has no active campuses to assign as primary", { userId });
    return null;
  } catch (error) {
    logger.error("Error ensuring user primary campus", { error, userId });
    return null;
  }
} 