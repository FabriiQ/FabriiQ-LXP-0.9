import { prisma } from "@/server/db";

/**
 * Service for managing enrollment history
 */
export class EnrollmentHistoryService {
  /**
   * Create a new enrollment history entry
   */
  async createHistoryEntry(data: {
    enrollmentId: string;
    action: string;
    details: Record<string, any>;
    createdById: string;
  }) {
    try {
      // Use Prisma ORM to create the enrollment history entry
      await prisma.enrollmentHistory.create({
        data: {
          id: `eh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          enrollmentId: data.enrollmentId,
          action: data.action,
          details: data.details,
          createdAt: new Date(),
          createdById: data.createdById
        }
      });

      return { success: true };
    } catch (error) {
      console.error("Error creating enrollment history entry:", error);
      throw new Error(`Failed to create enrollment history entry: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
