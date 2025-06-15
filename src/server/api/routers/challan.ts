import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  ChallanService,
  createChallanTemplateSchema,
  updateChallanTemplateSchema,
  generateChallanSchema,
  bulkGenerateChallansSchema
} from "../services/challan.service";

export const challanRouter = createTRPCRouter({
  // Challan Template Endpoints
  createTemplate: protectedProcedure
    .input(createChallanTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const challanService = new ChallanService();
      return challanService.createChallanTemplate({
        ...input,
        createdById: ctx.session.user.id,
      });
    }),

  getTemplateById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const challanService = new ChallanService();
      return challanService.getChallanTemplate(input.id);
    }),

  getTemplatesByInstitution: protectedProcedure
    .input(z.object({ institutionId: z.string() }))
    .query(async ({ input }) => {
      const challanService = new ChallanService();
      return challanService.getChallanTemplatesByInstitution(input.institutionId);
    }),

  updateTemplate: protectedProcedure
    .input(updateChallanTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const challanService = new ChallanService();
      return challanService.updateChallanTemplate({
        ...input,
        updatedById: ctx.session.user.id,
      });
    }),

  deleteTemplate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const challanService = new ChallanService();
      return challanService.deleteChallanTemplate(input.id);
    }),

  // Challan Endpoints
  generate: protectedProcedure
    .input(generateChallanSchema)
    .mutation(async ({ ctx, input }) => {
      const challanService = new ChallanService();
      return challanService.generateChallan({
        ...input,
        createdById: ctx.session.user.id,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const challanService = new ChallanService();
      return challanService.getChallan(input.id);
    }),

  getByEnrollmentFee: protectedProcedure
    .input(z.object({ enrollmentFeeId: z.string() }))
    .query(async ({ input }) => {
      const challanService = new ChallanService();
      return challanService.getChallansByEnrollmentFee(input.enrollmentFeeId);
    }),

  print: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const challanService = new ChallanService();
      return challanService.printChallan(input.id);
    }),

  email: protectedProcedure
    .input(z.object({ id: z.string(), email: z.string().email() }))
    .mutation(async ({ input }) => {
      const challanService = new ChallanService();
      return challanService.emailChallan(input.id, input.email);
    }),

  batchPrint: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      const challanService = new ChallanService();
      return challanService.batchPrintChallans(input.ids);
    }),

  bulkGenerate: protectedProcedure
    .input(bulkGenerateChallansSchema)
    .mutation(async ({ ctx, input }) => {
      const challanService = new ChallanService();
      return challanService.bulkGenerateChallans({
        ...input,
        createdById: ctx.session.user.id,
      });
    }),
});
