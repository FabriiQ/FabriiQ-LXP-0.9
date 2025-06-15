import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logger } from "@/server/api/utils/logger";
import { Session } from "next-auth";

// Augmented session type that includes the userId property for backward compatibility
interface AugmentedSession extends Session {
  userId?: string;
}

export async function getSessionCache() {
  try {
    const session = await getServerSession(authOptions) as AugmentedSession | null;
    
    if (!session) {
      logger.debug("No session found in getSessionCache");
      return null;
    }

    // Ensure the session has the expected structure
    if (!session.user || !session.user.id) {
      logger.warn("Session is missing user or user.id", { session });
      return null;
    }
    
    // Map the user ID to the session for compatibility
    if (!session.userId && session.user.id) {
      session.userId = session.user.id;
    }

    return session;
  } catch (error) {
    let errorInfo = {};
    
    // Extract useful information from the error without causing additional errors
    if (error instanceof Error) {
      errorInfo = {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      };
    } else {
      errorInfo = { error: String(error) };
    }
    
    logger.error("Error getting session from cache", errorInfo);
    return null;
  }
}
