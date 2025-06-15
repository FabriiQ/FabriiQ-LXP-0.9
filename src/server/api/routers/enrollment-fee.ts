import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  FeeService,
  createEnrollmentFeeSchema,
  updateEnrollmentFeeSchema,
  addDiscountSchema,
  addChargeSchema,
  addArrearSchema,
  addTransactionSchema
} from "../services/fee.service";

export const enrollmentFeeRouter = createTRPCRouter({
  // Get fee collection statistics
  getFeeCollectionStats: protectedProcedure
    .query(async ({ ctx }) => {
      const feeService = new FeeService();
      return feeService.getFeeCollectionStats();
    }),
  create: protectedProcedure
    .input(createEnrollmentFeeSchema)
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService();
      return feeService.createEnrollmentFee({
        ...input,
        createdById: ctx.session.user.id,
      });
    }),

  getByEnrollment: protectedProcedure
    .input(z.object({ enrollmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const feeService = new FeeService();
      return feeService.getEnrollmentFeeByEnrollment(input.enrollmentId);
    }),

  update: protectedProcedure
    .input(updateEnrollmentFeeSchema)
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService();
      return feeService.updateEnrollmentFee({
        ...input,
        updatedById: ctx.session.user.id,
      });
    }),

  addDiscount: protectedProcedure
    .input(addDiscountSchema)
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService();
      return feeService.addDiscount({
        ...input,
        createdById: ctx.session.user.id,
      });
    }),

  removeDiscount: protectedProcedure
    .input(z.object({ discountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService();
      return feeService.removeDiscount(input.discountId);
    }),

  addCharge: protectedProcedure
    .input(addChargeSchema)
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService();
      return feeService.addAdditionalCharge({
        ...input,
        createdById: ctx.session.user.id,
      });
    }),

  removeCharge: protectedProcedure
    .input(z.object({ chargeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService();
      return feeService.removeAdditionalCharge(input.chargeId);
    }),

  addArrear: protectedProcedure
    .input(addArrearSchema)
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService();
      return feeService.addArrear({
        ...input,
        createdById: ctx.session.user.id,
      });
    }),

  removeArrear: protectedProcedure
    .input(z.object({ arrearId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService();
      return feeService.removeArrear(input.arrearId);
    }),

  addTransaction: protectedProcedure
    .input(addTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService();
      return feeService.addTransaction({
        ...input,
        createdById: ctx.session.user.id,
      });
    }),

  getTransactions: protectedProcedure
    .input(z.object({ enrollmentFeeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const feeService = new FeeService();
      return feeService.getTransactions(input.enrollmentFeeId);
    }),

  generateReceipt: protectedProcedure
    .input(z.object({ transactionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feeService = new FeeService();
      return feeService.generateReceipt(input.transactionId);
    }),
});
