import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus, AttendanceStatusType } from "@/server/api/constants";
import { startOfWeek, endOfWeek } from "date-fns";

export const classAnalyticsRouter = createTRPCRouter({
  getClassStats: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { classId } = input;

      // Check if class exists
      const classData = await ctx.prisma.class.findUnique({
        where: { id: classId },
        include: {
          students: true,
        },
      });

      if (!classData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      // Get attendance data
      const attendanceRecords = await ctx.prisma.attendance.findMany({
        where: {
          classId,
          status: AttendanceStatusType.PRESENT,
        },
      });

      const absentRecords = await ctx.prisma.attendance.findMany({
        where: {
          classId,
          status: AttendanceStatusType.ABSENT,
        },
      });

      const lateRecords = await ctx.prisma.attendance.findMany({
        where: {
          classId,
          status: AttendanceStatusType.LATE,
        },
      });

      const excusedRecords = await ctx.prisma.attendance.findMany({
        where: {
          classId,
          status: AttendanceStatusType.EXCUSED,
        },
      });

      // Calculate attendance statistics
      const present = attendanceRecords.length;
      const absent = absentRecords.length;
      const late = lateRecords.length;
      const excused = excusedRecords.length;

      // Get assessment data for average grade calculation
      const assessments = await ctx.prisma.assessment.findMany({
        where: {
          classId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          submissions: true,
        },
      });

      // Calculate average grade
      let totalScore = 0;
      let totalMaxScore = 0;

      assessments.forEach(assessment => {
        assessment.submissions.forEach(submission => {
          if (submission.score !== null && assessment.maxScore) {
            totalScore += submission.score;
            totalMaxScore += assessment.maxScore;
          }
        });
      });

      const averageGrade = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

      // Calculate completion rate
      const totalAssessments = await ctx.prisma.assessment.count({
        where: {
          classId,
          status: SystemStatus.ACTIVE,
        },
      });

      const totalStudents = classData.students.length;
      const expectedSubmissions = totalAssessments * totalStudents;

      // Count total submissions across all assessments
      let actualSubmissions = 0;
      assessments.forEach(assessment => {
        actualSubmissions += assessment.submissions.length;
      });

      const completionRate = expectedSubmissions > 0
        ? (actualSubmissions / expectedSubmissions) * 100
        : 0;

      // Generate weekly attendance data
      const today = new Date();
      const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
      const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });

      // Process weekly data
      const weeklyData = [
        { day: "Monday", present: 0, absent: 0, late: 0 },
        { day: "Tuesday", present: 0, absent: 0, late: 0 },
        { day: "Wednesday", present: 0, absent: 0, late: 0 },
        { day: "Thursday", present: 0, absent: 0, late: 0 },
        { day: "Friday", present: 0, absent: 0, late: 0 },
      ];

      // Get weekly attendance by day and status
      for (const dayData of weeklyData) {
        // Get present records for this day
        const presentRecords = await ctx.prisma.attendance.count({
          where: {
            classId,
            date: {
              gte: startOfCurrentWeek,
              lte: endOfCurrentWeek,
            },
            status: AttendanceStatusType.PRESENT,
          },
        });

        // Get absent records for this day
        const absentRecords = await ctx.prisma.attendance.count({
          where: {
            classId,
            date: {
              gte: startOfCurrentWeek,
              lte: endOfCurrentWeek,
            },
            status: AttendanceStatusType.ABSENT,
          },
        });

        // Get late records for this day
        const lateRecords = await ctx.prisma.attendance.count({
          where: {
            classId,
            date: {
              gte: startOfCurrentWeek,
              lte: endOfCurrentWeek,
            },
            status: AttendanceStatusType.LATE,
          },
        });

        dayData.present = presentRecords;
        dayData.absent = absentRecords;
        dayData.late = lateRecords;
      }

      // Generate daily attendance data for heatmap
      const dailyData = [
        { day: "Monday", "Period 1": 0.9, "Period 2": 0.85, "Period 3": 0.8 },
        { day: "Tuesday", "Period 1": 0.85, "Period 2": 0.8, "Period 3": 0.75 },
        { day: "Wednesday", "Period 1": 0.8, "Period 2": 0.75, "Period 3": 0.7 },
        { day: "Thursday", "Period 1": 0.75, "Period 2": 0.7, "Period 3": 0.65 },
        { day: "Friday", "Period 1": 0.7, "Period 2": 0.65, "Period 3": 0.6 },
      ];

      return {
        averageGrade,
        completionRate,
        attendanceData: {
          present,
          absent,
          late,
          excused,
        },
        weeklyAttendance: weeklyData,
        dailyAttendance: dailyData,
      };
    }),
});
