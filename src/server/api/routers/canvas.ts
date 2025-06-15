import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { CanvasService, canvasStateSchema, canvasUpdateSchema, canvasIdSchema } from "../services/canvas.service";

export const canvasRouter = createTRPCRouter({
  getState: protectedProcedure
    .input(canvasIdSchema)
    .query(async ({ ctx, input }) => {
      const service = new CanvasService({ prisma: ctx.prisma });
      return service.getCanvasState(input.canvasId, ctx.session.user.id);
    }),

  saveState: protectedProcedure
    .input(canvasStateSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new CanvasService({ prisma: ctx.prisma });
      return service.saveCanvasState(input, ctx.session.user.id);
    }),

  delete: protectedProcedure
    .input(canvasIdSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new CanvasService({ prisma: ctx.prisma });
      return service.deleteCanvas(input.canvasId, ctx.session.user.id);
    }),

  list: protectedProcedure
    .query(async ({ ctx }) => {
      const service = new CanvasService({ prisma: ctx.prisma });
      return service.listCanvases(ctx.session.user.id);
    }),
});
