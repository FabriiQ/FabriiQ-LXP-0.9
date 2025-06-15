import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus } from "@prisma/client";
import { CommitmentContractService } from "../services/commitment-contract.service";

export const commitmentContractRouter = createTRPCRouter({
  // Create a new commitment contract
  createCommitmentContract: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        deadline: z.date(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const commitmentContractService = new CommitmentContractService({ prisma: ctx.prisma });
      return commitmentContractService.createCommitmentContract(input);
    }),

  // Update a commitment contract
  updateCommitmentContract: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        deadline: z.date().optional(),
        isCompleted: z.boolean().optional(),
        completedAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const commitmentContractService = new CommitmentContractService({ prisma: ctx.prisma });
      return commitmentContractService.updateCommitmentContract(input);
    }),

  // Get commitment contracts for a student
  getStudentCommitmentContracts: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        isCompleted: z.boolean().optional(),
        includeExpired: z.boolean().optional().default(true),
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

      const commitmentContractService = new CommitmentContractService({ prisma: ctx.prisma });
      return commitmentContractService.getStudentCommitmentContracts(
        input.studentId,
        {
          classId: input.classId,
          subjectId: input.subjectId,
          isCompleted: input.isCompleted,
          includeExpired: input.includeExpired,
        }
      );
    }),

  // Complete a commitment contract
  completeCommitmentContract: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const commitmentContractService = new CommitmentContractService({ prisma: ctx.prisma });
      return commitmentContractService.completeCommitmentContract(input);
    }),

  // Delete a commitment contract
  deleteCommitmentContract: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const commitmentContractService = new CommitmentContractService({ prisma: ctx.prisma });
      return commitmentContractService.deleteCommitmentContract(input);
    }),

  // Create a commitment contract for activity completion
  createActivityCommitment: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        activities: z.array(z.string()),
        title: z.string(),
        description: z.string().optional(),
        deadline: z.date(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const commitmentContractService = new CommitmentContractService({ prisma: ctx.prisma });
      return commitmentContractService.createActivityCommitment(input);
    }),
});
