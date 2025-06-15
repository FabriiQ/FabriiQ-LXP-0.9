import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

/**
 * Class Transfer Router
 *
 * Provides endpoints for managing class transfers
 *
 * Note: This is a mock implementation until the actual schema is updated
 */
export const classTransferRouter = createTRPCRouter({
  /**
   * Create a new class transfer request
   */
  createTransfer: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        fromClassId: z.string(),
        toClassId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const { studentId, fromClassId, toClassId, reason } = input;

      try {
        // Check if student exists and is enrolled in the from class
        const student = await prisma.studentProfile.findUnique({
          where: { id: studentId },
          include: {
            enrollments: {
              where: {
                classId: fromClassId,
                status: "ACTIVE",
              },
            },
          },
        });

        if (!student) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student not found",
          });
        }

        if (student.enrollments.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Student is not enrolled in the source class",
          });
        }

        // Check if destination class exists
        const toClass = await prisma.class.findUnique({
          where: { id: toClassId },
        });

        if (!toClass) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Destination class not found",
          });
        }

        // Mock response for now - actual implementation will use the classTransfer model
        return {
          id: "mock-transfer-id",
          studentId,
          fromClassId,
          toClassId,
          reason,
          status: "pending",
          requestDate: new Date(),
          requestedById: session.user.id,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error creating class transfer:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create class transfer",
        });
      }
    }),

  /**
   * Create a batch class transfer request
   */
  createBatchTransfer: protectedProcedure
    .input(
      z.object({
        fromClassId: z.string(),
        toClassId: z.string(),
        studentIds: z.array(z.string()),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const { fromClassId, toClassId, studentIds, reason } = input;

      try {
        // Check if classes exist
        const fromClass = await prisma.class.findUnique({
          where: { id: fromClassId },
        });

        const toClass = await prisma.class.findUnique({
          where: { id: toClassId },
        });

        if (!fromClass || !toClass) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or both classes not found",
          });
        }

        // Mock response for now - actual implementation will use the batchClassTransfer model
        return {
          id: "mock-batch-transfer-id",
          fromClassId,
          toClassId,
          reason,
          status: "pending",
          requestDate: new Date(),
          requestedById: session.user.id,
          studentCount: studentIds.length,
          transfers: studentIds.map(studentId => ({
            id: `mock-transfer-${studentId}`,
            studentId,
            fromClassId,
            toClassId,
            reason,
            status: "pending",
            requestDate: new Date(),
            requestedById: session.user.id,
          })),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error creating batch class transfer:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create batch class transfer",
        });
      }
    }),

  /**
   * Get pending transfers
   */
  getPendingTransfers: protectedProcedure
    .input(
      z.object({
        classId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { classId, limit, offset } = input;

      try {
        // Mock data for pending transfers
        const mockTransfers = [
          {
            id: "mock-transfer-1",
            studentId: "student-1",
            studentName: "John Doe",
            studentAvatar: null,
            fromClassId: "class-1",
            fromClassName: "Class A",
            toClassId: "class-2",
            toClassName: "Class B",
            reason: "Better fit for student's learning style",
            status: "pending",
            requestDate: new Date(),
            requestedBy: "Coordinator Name",
          },
          {
            id: "mock-transfer-2",
            studentId: "student-2",
            studentName: "Jane Smith",
            studentAvatar: null,
            fromClassId: "class-3",
            fromClassName: "Class C",
            toClassId: "class-4",
            toClassName: "Class D",
            reason: "Schedule conflict resolution",
            status: "pending",
            requestDate: new Date(),
            requestedBy: "Coordinator Name",
          },
        ];

        // Filter by classId if provided
        const filteredTransfers = classId
          ? mockTransfers.filter(t => t.fromClassId === classId || t.toClassId === classId)
          : mockTransfers;

        return {
          transfers: filteredTransfers.slice(offset, offset + limit),
          pagination: {
            total: filteredTransfers.length,
            limit,
            offset,
            hasMore: offset + limit < filteredTransfers.length,
          },
        };
      } catch (error) {
        console.error("Error fetching pending transfers:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch pending transfers",
        });
      }
    }),

  /**
   * Approve a transfer
   */
  approveTransfer: protectedProcedure
    .input(
      z.object({
        transferId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const { transferId } = input;

      try {
        // Mock response for now
        return {
          id: transferId,
          status: "approved",
          approvalDate: new Date(),
          approvedById: session.user.id,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error approving transfer:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to approve transfer",
        });
      }
    }),

  /**
   * Complete a transfer
   */
  completeTransfer: protectedProcedure
    .input(
      z.object({
        transferId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { transferId } = input;

      try {
        // Mock response for now
        return {
          id: transferId,
          status: "completed",
          completionDate: new Date(),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Error completing transfer:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to complete transfer",
        });
      }
    }),
});
