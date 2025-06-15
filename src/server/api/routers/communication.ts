import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { 
  CommunicationService, 
  createConversationSchema, 
  updateConversationSchema, 
  createMessageSchema, 
  updateMessageSchema,
  addParticipantSchema
} from "../services/communication.service";
import { TRPCError } from "@trpc/server";

export const communicationRouter = createTRPCRouter({
  // Conversation endpoints
  createConversation: protectedProcedure
    .input(createConversationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const communicationService = new CommunicationService({ prisma: ctx.prisma });
      return communicationService.createConversation(input);
    }),

  getConversation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const communicationService = new CommunicationService({ prisma: ctx.prisma });
      return communicationService.getConversation(input.id, ctx.session.userId);
    }),

  updateConversation: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateConversationSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const communicationService = new CommunicationService({ prisma: ctx.prisma });
      return communicationService.updateConversation(input.id, input.data, ctx.session.userId);
    }),

  getUserConversations: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const communicationService = new CommunicationService({ prisma: ctx.prisma });
      return communicationService.getUserConversations(ctx.session.userId);
    }),

  // Participant endpoints
  addParticipant: protectedProcedure
    .input(addParticipantSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const communicationService = new CommunicationService({ prisma: ctx.prisma });
      return communicationService.addParticipant(input, ctx.session.userId);
    }),

  removeParticipant: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const communicationService = new CommunicationService({ prisma: ctx.prisma });
      return communicationService.removeParticipant(
        input.conversationId,
        input.userId,
        ctx.session.userId
      );
    }),

  // Message endpoints
  createMessage: protectedProcedure
    .input(createMessageSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const communicationService = new CommunicationService({ prisma: ctx.prisma });
      return communicationService.createMessage(input, ctx.session.userId);
    }),

  updateMessage: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateMessageSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const communicationService = new CommunicationService({ prisma: ctx.prisma });
      return communicationService.updateMessage(input.id, input.data, ctx.session.userId);
    }),

  deleteMessage: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const communicationService = new CommunicationService({ prisma: ctx.prisma });
      return communicationService.deleteMessage(input.id, ctx.session.userId);
    }),

  getMessages: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      limit: z.number().min(1).max(100).default(20).optional(),
      before: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const communicationService = new CommunicationService({ prisma: ctx.prisma });
      return communicationService.getMessages(
        input.conversationId,
        ctx.session.userId,
        input.limit,
        input.before
      );
    }),

  markAsRead: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      messageId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const communicationService = new CommunicationService({ prisma: ctx.prisma });
      return communicationService.markAsRead(
        input.conversationId,
        ctx.session.userId,
        input.messageId
      );
    }),
}); 