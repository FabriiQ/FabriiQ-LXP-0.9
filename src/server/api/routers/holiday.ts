import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { HolidayService } from "../services/holiday.service";
import { CalendarAction, hasCalendarPermission } from "@/lib/permissions/calendar-permissions";
import { TRPCError } from "@trpc/server";
import { UserType } from "@prisma/client";

// Input validation schemas
const createHolidaySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  type: z.enum(["NATIONAL", "RELIGIOUS", "INSTITUTIONAL", "ADMINISTRATIVE", "WEATHER", "OTHER"]),
  affectsAll: z.boolean().default(true),
  campusIds: z.array(z.string()).optional(),
});

const updateHolidaySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  type: z.enum(["NATIONAL", "RELIGIOUS", "INSTITUTIONAL", "ADMINISTRATIVE", "WEATHER", "OTHER"]).optional(),
  affectsAll: z.boolean().optional(),
  campusIds: z.array(z.string()).optional(),
});

const listHolidaysSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  type: z.enum(["NATIONAL", "RELIGIOUS", "INSTITUTIONAL", "ADMINISTRATIVE", "WEATHER", "OTHER"]).optional(),
  campusId: z.string().optional(),
});

export const holidayRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createHolidaySchema)
    .mutation(async ({ input, ctx }) => {
      // Authorization check
      if (!hasCalendarPermission(ctx.session.userType as UserType, CalendarAction.CREATE_HOLIDAY)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new HolidayService({ prisma: ctx.prisma });
      return service.createHoliday(input);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateHolidaySchema,
    }))
    .mutation(async ({ input, ctx }) => {
      // Authorization check
      if (!hasCalendarPermission(ctx.session.userType as UserType, CalendarAction.UPDATE_HOLIDAY)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new HolidayService({ prisma: ctx.prisma });
      return service.updateHoliday(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Authorization check
      if (!hasCalendarPermission(ctx.session.userType as UserType, CalendarAction.DELETE_HOLIDAY)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new HolidayService({ prisma: ctx.prisma });
      return service.deleteHoliday(input.id);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      // Authorization check
      if (!hasCalendarPermission(ctx.session.userType as UserType, CalendarAction.VIEW_HOLIDAYS)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new HolidayService({ prisma: ctx.prisma });
      return service.getHoliday(input.id);
    }),

  list: protectedProcedure
    .input(listHolidaysSchema)
    .query(async ({ input, ctx }) => {
      // Authorization check
      if (!hasCalendarPermission(ctx.session.userType as UserType, CalendarAction.VIEW_HOLIDAYS)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new HolidayService({ prisma: ctx.prisma });
      return service.listHolidays(input);
    }),

  getHolidaysInRange: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      campusId: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Authorization check
      if (!hasCalendarPermission(ctx.session.userType as UserType, CalendarAction.VIEW_HOLIDAYS)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new HolidayService({ prisma: ctx.prisma });
      return service.getHolidaysInRange(input.startDate, input.endDate, input.campusId);
    }),

  isHoliday: protectedProcedure
    .input(z.object({
      date: z.date(),
      campusId: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Authorization check
      if (!hasCalendarPermission(ctx.session.userType as UserType, CalendarAction.VIEW_HOLIDAYS)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new HolidayService({ prisma: ctx.prisma });
      return service.isHoliday(input.date, input.campusId);
    }),
}); 