import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { DiscountService, createDiscountTypeSchema, updateDiscountTypeSchema } from "../services/discount.service";

export const discountTypeRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createDiscountTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const discountService = new DiscountService();
      return discountService.createDiscountType({
        ...input,
        createdById: ctx.session.user.id,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const discountService = new DiscountService();
      return discountService.getDiscountType(input.id);
    }),

  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      const discountService = new DiscountService();
      return discountService.getAllDiscountTypes();
    }),

  getByApplicability: protectedProcedure
    .input(z.object({ applicableFor: z.string() }))
    .query(async ({ ctx, input }) => {
      const discountService = new DiscountService();
      return discountService.getDiscountTypesByApplicability(input.applicableFor);
    }),

  update: protectedProcedure
    .input(updateDiscountTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const discountService = new DiscountService();
      return discountService.updateDiscountType({
        ...input,
        updatedById: ctx.session.user.id,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const discountService = new DiscountService();
      return discountService.deleteDiscountType(input.id);
    }),

  checkSiblingDiscountEligibility: protectedProcedure
    .input(z.object({ studentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const discountService = new DiscountService();
      return discountService.checkSiblingDiscountEligibility(input.studentId);
    }),

  checkMeritDiscountEligibility: protectedProcedure
    .input(z.object({ studentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const discountService = new DiscountService();
      return discountService.checkMeritDiscountEligibility(input.studentId);
    }),

  checkStaffDiscountEligibility: protectedProcedure
    .input(z.object({ studentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const discountService = new DiscountService();
      return discountService.checkStaffDiscountEligibility(input.studentId);
    }),
});
