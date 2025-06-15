import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { AttendanceService } from "../services/attendance.service";
import { SystemStatus, AttendanceStatusType, UserType } from "../constants";
import type { BaseFilters } from "../types";

// Input validation schemas
const createAttendanceSchema = z.object({
  scheduleId: z.string(),
  studentId: z.string(),
  date: z.date(),
  status: z.nativeEnum(AttendanceStatusType),
  remarks: z.string().optional(),
});

const bulkCreateAttendanceSchema = z.object({
  scheduleId: z.string(),
  date: z.date(),
  records: z.array(z.object({
    studentId: z.string(),
    status: z.nativeEnum(AttendanceStatusType),
    remarks: z.string().optional(),
  })),
});

const updateAttendanceSchema = z.object({
  status: z.nativeEnum(AttendanceStatusType).optional(),
  remarks: z.string().optional(),
});

const attendanceIdSchema = z.object({
  id: z.string(),
});

export const attendanceRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(AttendanceStatusType),
        studentId: z.string(),
        classId: z.string(),
        date: z.date(),
        remarks: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const attendanceService = new AttendanceService({ prisma: ctx.prisma });
      return attendanceService.createAttendance(input);
    }),

  bulkCreate: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        date: z.date(),
        attendanceRecords: z.array(
          z.object({
            studentId: z.string(),
            status: z.nativeEnum(AttendanceStatusType),
            remarks: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const attendanceService = new AttendanceService({ prisma: ctx.prisma });
      
      const results = [];
      for (const record of input.attendanceRecords) {
        const result = await attendanceService.createAttendance({
          classId: input.classId,
          date: input.date,
          studentId: record.studentId,
          status: record.status,
          remarks: record.remarks,
        });
        results.push(result);
      }
      
      return {
        success: true,
        count: results.length,
        results,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const attendanceService = new AttendanceService({ prisma: ctx.prisma });
      return attendanceService.getAttendance(input.id);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(AttendanceStatusType).optional(),
        remarks: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const attendanceService = new AttendanceService({ prisma: ctx.prisma });
      return attendanceService.updateAttendance(input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const attendanceService = new AttendanceService({ prisma: ctx.prisma });
      return attendanceService.deleteAttendance(input.id);
    }),

  getByQuery: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        studentId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.nativeEnum(AttendanceStatusType).optional(),
        date: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const attendanceService = new AttendanceService({ prisma: ctx.prisma });
      return attendanceService.getAttendanceByQuery(input);
    }),

  getClassStats: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const attendanceService = new AttendanceService({ prisma: ctx.prisma });
      return attendanceService.getClassAttendanceStats(
        input.classId, 
        input.startDate, 
        input.endDate
      );
    }),

  getStudentStats: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        classId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const attendanceService = new AttendanceService({ prisma: ctx.prisma });
      return attendanceService.getStudentAttendanceStats(
        input.studentId, 
        input.startDate, 
        input.endDate
      );
    }),

  getRecords: protectedProcedure
    .input(
      z.object({
        classId: z.string().optional(),
        studentId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.nativeEnum(AttendanceStatusType).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const attendanceService = new AttendanceService({ prisma: ctx.prisma });
      return attendanceService.getAttendanceByQuery(input);
    }),
}); 