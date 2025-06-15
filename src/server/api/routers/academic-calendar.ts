import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { AcademicCalendarService } from "../services/academic-calendar.service";
import { CalendarAction, hasCalendarPermission } from "@/lib/permissions/calendar-permissions";
import { TRPCError } from "@trpc/server";
import { UserType } from "@prisma/client";

// Input validation schemas
const createEventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  type: z.enum(["REGISTRATION", "ADD_DROP", "WITHDRAWAL", "EXAMINATION", "GRADING", "ORIENTATION", "GRADUATION", "OTHER"]),
  academicCycleId: z.string().optional(),
  campusId: z.string().optional(),
  classIds: z.array(z.string()).optional(),
});

const updateEventSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  type: z.enum(["REGISTRATION", "ADD_DROP", "WITHDRAWAL", "EXAMINATION", "GRADING", "ORIENTATION", "GRADUATION", "OTHER"]).optional(),
  academicCycleId: z.string().optional(),
  campusId: z.string().optional(),
  classIds: z.array(z.string()).optional(),
});

const listEventsSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  type: z.enum(["REGISTRATION", "ADD_DROP", "WITHDRAWAL", "EXAMINATION", "GRADING", "ORIENTATION", "GRADUATION", "OTHER"]).optional(),
  academicCycleId: z.string().optional(),
  campusId: z.string().optional(),
});

export const academicCalendarRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createEventSchema)
    .mutation(async ({ input, ctx }) => {
      if (!hasCalendarPermission(ctx.session.user.type as keyof typeof UserType, CalendarAction.CREATE_ACADEMIC_EVENT)) {
        throw new TRPCError({ 
          code: "FORBIDDEN",
          message: "You don't have permission to create academic calendar events"
        });
      }
      
      const service = new AcademicCalendarService({ prisma: ctx.prisma });
      return service.createAcademicEvent(input);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), ...updateEventSchema.shape }))
    .mutation(async ({ input, ctx }) => {
      if (!hasCalendarPermission(ctx.session.user.type as keyof typeof UserType, CalendarAction.UPDATE_ACADEMIC_EVENT)) {
        throw new TRPCError({ 
          code: "FORBIDDEN",
          message: "You don't have permission to update academic calendar events"
        });
      }
      
      const { id, ...data } = input;
      const service = new AcademicCalendarService({ prisma: ctx.prisma });
      return service.updateAcademicEvent(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!hasCalendarPermission(ctx.session.user.type as keyof typeof UserType, CalendarAction.DELETE_ACADEMIC_EVENT)) {
        throw new TRPCError({ 
          code: "FORBIDDEN",
          message: "You don't have permission to delete academic calendar events"
        });
      }
      
      const service = new AcademicCalendarService({ prisma: ctx.prisma });
      return service.deleteAcademicEvent(input.id);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!hasCalendarPermission(ctx.session.user.type as keyof typeof UserType, CalendarAction.VIEW_ACADEMIC_EVENTS)) {
        throw new TRPCError({ 
          code: "FORBIDDEN",
          message: "You don't have permission to view academic calendar events"
        });
      }
      
      const service = new AcademicCalendarService({ prisma: ctx.prisma });
      return service.getAcademicEvent(input.id);
    }),

  list: protectedProcedure
    .input(listEventsSchema)
    .query(async ({ input, ctx }) => {
      if (!hasCalendarPermission(ctx.session.user.type as keyof typeof UserType, CalendarAction.VIEW_ACADEMIC_EVENTS)) {
        throw new TRPCError({ 
          code: "FORBIDDEN",
          message: "You don't have permission to view academic calendar events"
        });
      }
      
      const service = new AcademicCalendarService({ prisma: ctx.prisma });
      return service.listAcademicEvents(input);
    })
}); 
