import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { SchedulePatternService } from "../services/schedule-pattern.service";
import { CalendarAction, hasCalendarPermission } from "@/lib/permissions/calendar-permissions";
import { TRPCError } from "@trpc/server";
import { UserType } from "@prisma/client";

// Input validation schemas
const createPatternSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  daysOfWeek: z.array(z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"])),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  recurrence: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"]),
  startDate: z.date(),
  endDate: z.date().optional(),
});

const updatePatternSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  daysOfWeek: z.array(z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"])).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  recurrence: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const createExceptionSchema = z.object({
  schedulePatternId: z.string(),
  exceptionDate: z.date(),
  reason: z.string().optional(),
  alternativeDate: z.date().optional(),
  alternativeStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  alternativeEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

const updateExceptionSchema = z.object({
  exceptionDate: z.date().optional(),
  reason: z.string().optional(),
  alternativeDate: z.date().optional(),
  alternativeStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  alternativeEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

const listPatternsSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  recurrence: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"]).optional(),
});

export const schedulePatternRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createPatternSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.user?.userType || !hasCalendarPermission(ctx.session.user.userType as UserType, CalendarAction.CREATE_SCHEDULE_PATTERN)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new SchedulePatternService({ prisma: ctx.prisma });
      return service.createSchedulePattern(input);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updatePatternSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.user?.userType || !hasCalendarPermission(ctx.session.user.userType as UserType, CalendarAction.UPDATE_SCHEDULE_PATTERN)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new SchedulePatternService({ prisma: ctx.prisma });
      return service.updateSchedulePattern(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.user?.userType || !hasCalendarPermission(ctx.session.user.userType as UserType, CalendarAction.DELETE_SCHEDULE_PATTERN)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new SchedulePatternService({ prisma: ctx.prisma });
      return service.deleteSchedulePattern(input.id);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.session?.user?.userType || !hasCalendarPermission(ctx.session.user.userType as UserType, CalendarAction.VIEW_SCHEDULE_PATTERNS)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new SchedulePatternService({ prisma: ctx.prisma });
      return service.getSchedulePattern(input.id);
    }),

  list: protectedProcedure
    .input(listPatternsSchema)
    .query(async ({ input, ctx }) => {
      if (!ctx.session?.user?.userType || !hasCalendarPermission(ctx.session.user.userType as UserType, CalendarAction.VIEW_SCHEDULE_PATTERNS)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new SchedulePatternService({ prisma: ctx.prisma });
      return service.listSchedulePatterns(input);
    }),

  generateOccurrences: protectedProcedure
    .input(z.object({
      patternId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.session?.user?.userType || !hasCalendarPermission(ctx.session.user.userType as UserType, CalendarAction.VIEW_SCHEDULE_PATTERNS)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new SchedulePatternService({ prisma: ctx.prisma });
      return service.generateOccurrences(input.patternId, input.startDate, input.endDate);
    }),

  createException: protectedProcedure
    .input(createExceptionSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.user?.userType || !hasCalendarPermission(ctx.session.user.userType as UserType, CalendarAction.UPDATE_SCHEDULE_PATTERN)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new SchedulePatternService({ prisma: ctx.prisma });
      return service.createScheduleException(input);
    }),

  updateException: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateExceptionSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.user?.userType || !hasCalendarPermission(ctx.session.user.userType as UserType, CalendarAction.UPDATE_SCHEDULE_PATTERN)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new SchedulePatternService({ prisma: ctx.prisma });
      return service.updateScheduleException(input.id, input.data);
    }),

  deleteException: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.user?.userType || !hasCalendarPermission(ctx.session.user.userType as UserType, CalendarAction.UPDATE_SCHEDULE_PATTERN)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new SchedulePatternService({ prisma: ctx.prisma });
      return service.deleteScheduleException(input.id);
    }),

  getExceptions: protectedProcedure
    .input(z.object({
      patternId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const service = new SchedulePatternService({ prisma: ctx.prisma });
      return service.getScheduleExceptions(input.patternId);
    }),
});
