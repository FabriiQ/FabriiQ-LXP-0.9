import { PrismaClient, DayOfWeek, RecurrenceType, SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ServiceBase } from "./service-base";
import { addDays, addWeeks, addMonths, isSameDay } from "date-fns";

interface CreateSchedulePatternInput {
  name: string;
  description?: string;
  daysOfWeek: DayOfWeek[];
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  recurrence: RecurrenceType;
  startDate: Date;
  endDate?: Date;
}

interface UpdateSchedulePatternInput {
  name?: string;
  description?: string;
  daysOfWeek?: DayOfWeek[];
  startTime?: string;
  endTime?: string;
  recurrence?: RecurrenceType;
  startDate?: Date;
  endDate?: Date;
}

interface CreateScheduleExceptionInput {
  schedulePatternId: string;
  exceptionDate: Date;
  reason?: string;
  alternativeDate?: Date;
  alternativeStart?: string;
  alternativeEnd?: string;
}

interface UpdateScheduleExceptionInput {
  exceptionDate?: Date;
  reason?: string;
  alternativeDate?: Date;
  alternativeStart?: string;
  alternativeEnd?: string;
}

interface ListSchedulePatternsInput {
  page?: number;
  pageSize?: number;
  startDate?: Date;
  endDate?: Date;
  recurrence?: RecurrenceType;
}

export class SchedulePatternService extends ServiceBase {
  constructor(context: { prisma: PrismaClient }) {
    super(context);
  }

  private validateTimeFormat(time: string): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
  }

  private validateDates(startDate: Date, endDate?: Date): void {
    if (endDate && startDate > endDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Start date must be before end date",
      });
    }
  }

  private validateTimes(startTime: string, endTime: string): void {
    if (!this.validateTimeFormat(startTime) || !this.validateTimeFormat(endTime)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid time format. Use HH:MM format (e.g., 09:30)",
      });
    }

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (startMinutes >= endMinutes) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Start time must be before end time",
      });
    }
  }

  async createSchedulePattern(data: CreateSchedulePatternInput) {
    // Validate inputs
    this.validateDates(data.startDate, data.endDate);
    this.validateTimes(data.startTime, data.endTime);

    if (!data.daysOfWeek.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "At least one day of week must be selected",
      });
    }

    // Create schedule pattern
    const pattern = await this.prisma.schedulePattern.create({
      data: {
        name: data.name,
        description: data.description,
        daysOfWeek: data.daysOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        recurrence: data.recurrence,
        startDate: data.startDate,
        endDate: data.endDate,
      },
      include: {
        exceptions: true,
      },
    });

    return pattern;
  }

  async updateSchedulePattern(id: string, data: UpdateSchedulePatternInput) {
    const pattern = await this.prisma.schedulePattern.findUnique({
      where: { id },
    });

    if (!pattern) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Schedule pattern not found",
      });
    }

    // Validate inputs
    if (data.startDate || data.endDate) {
      this.validateDates(
        data.startDate || pattern.startDate,
        data.endDate || pattern.endDate || undefined
      );
    }

    if (data.startTime && data.endTime) {
      this.validateTimes(data.startTime, data.endTime);
    } else if (data.startTime) {
      this.validateTimes(data.startTime, pattern.endTime);
    } else if (data.endTime) {
      this.validateTimes(pattern.startTime, data.endTime);
    }

    if (data.daysOfWeek && !data.daysOfWeek.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "At least one day of week must be selected",
      });
    }

    // Update schedule pattern
    const updatedPattern = await this.prisma.schedulePattern.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.daysOfWeek && { daysOfWeek: data.daysOfWeek }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.recurrence && { recurrence: data.recurrence }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
      },
      include: {
        exceptions: true,
      },
    });

    return updatedPattern;
  }

  async deleteSchedulePattern(id: string): Promise<void> {
    const pattern = await this.prisma.schedulePattern.findUnique({
      where: { id },
    });

    if (!pattern) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Schedule pattern not found",
      });
    }

    await this.prisma.schedulePattern.update({
      where: { id },
      data: {
        status: SystemStatus.DELETED,
        deletedAt: new Date(),
      },
    });
  }

  async getSchedulePattern(id: string) {
    const pattern = await this.prisma.schedulePattern.findUnique({
      where: { id },
      include: {
        exceptions: true,
        timetables: true,
      },
    });

    if (!pattern) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Schedule pattern not found",
      });
    }

    return pattern;
  }

  async listSchedulePatterns(input: ListSchedulePatternsInput) {
    const { page = 1, pageSize = 10, startDate, endDate, recurrence } = input;

    const where = {
      status: SystemStatus.ACTIVE,
      ...(startDate && endDate
        ? {
            OR: [
              {
                startDate: { lte: endDate },
                endDate: { gte: startDate },
              },
              {
                startDate: { lte: endDate },
                endDate: null,
              },
            ],
          }
        : {}),
      ...(recurrence && { recurrence }),
    };

    const [patterns, total] = await Promise.all([
      this.prisma.schedulePattern.findMany({
        where,
        include: {
          exceptions: true,
          timetables: true,
        },
        orderBy: {
          startDate: "asc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.schedulePattern.count({ where }),
    ]);

    return {
      items: patterns,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async createScheduleException(data: CreateScheduleExceptionInput) {
    const pattern = await this.prisma.schedulePattern.findUnique({
      where: { id: data.schedulePatternId },
    });

    if (!pattern) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Schedule pattern not found",
      });
    }

    // Validate dates
    if (data.exceptionDate < pattern.startDate || (pattern.endDate && data.exceptionDate > pattern.endDate)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Exception date must be within pattern date range",
      });
    }

    if (data.alternativeDate) {
      if (data.alternativeDate < pattern.startDate || (pattern.endDate && data.alternativeDate > pattern.endDate)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Alternative date must be within pattern date range",
        });
      }
    }

    // Validate times if provided
    if (data.alternativeStart && data.alternativeEnd) {
      this.validateTimes(data.alternativeStart, data.alternativeEnd);
    } else if (data.alternativeStart) {
      this.validateTimes(data.alternativeStart, pattern.endTime);
    } else if (data.alternativeEnd) {
      this.validateTimes(pattern.startTime, data.alternativeEnd);
    }

    // Create exception
    const exception = await this.prisma.scheduleException.create({
      data: {
        schedulePatternId: data.schedulePatternId,
        exceptionDate: data.exceptionDate,
        reason: data.reason,
        alternativeDate: data.alternativeDate,
        alternativeStart: data.alternativeStart,
        alternativeEnd: data.alternativeEnd,
      },
    });

    return exception;
  }

  async updateScheduleException(id: string, data: UpdateScheduleExceptionInput) {
    const exception = await this.prisma.scheduleException.findUnique({
      where: { id },
      include: {
        schedulePattern: true,
      },
    });

    if (!exception) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Schedule exception not found",
      });
    }

    const pattern = exception.schedulePattern;

    // Validate dates
    if (data.exceptionDate) {
      if (data.exceptionDate < pattern.startDate || (pattern.endDate && data.exceptionDate > pattern.endDate)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Exception date must be within pattern date range",
        });
      }
    }

    if (data.alternativeDate) {
      if (data.alternativeDate < pattern.startDate || (pattern.endDate && data.alternativeDate > pattern.endDate)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Alternative date must be within pattern date range",
        });
      }
    }

    // Validate times if provided
    if (data.alternativeStart && data.alternativeEnd) {
      this.validateTimes(data.alternativeStart, data.alternativeEnd);
    } else if (data.alternativeStart) {
      this.validateTimes(data.alternativeStart, pattern.endTime);
    } else if (data.alternativeEnd) {
      this.validateTimes(pattern.startTime, data.alternativeEnd);
    }

    // Update exception
    const updatedException = await this.prisma.scheduleException.update({
      where: { id },
      data: {
        ...(data.exceptionDate && { exceptionDate: data.exceptionDate }),
        ...(data.reason !== undefined && { reason: data.reason }),
        ...(data.alternativeDate !== undefined && { alternativeDate: data.alternativeDate }),
        ...(data.alternativeStart !== undefined && { alternativeStart: data.alternativeStart }),
        ...(data.alternativeEnd !== undefined && { alternativeEnd: data.alternativeEnd }),
      },
    });

    return updatedException;
  }

  async deleteScheduleException(id: string): Promise<void> {
    const exception = await this.prisma.scheduleException.findUnique({
      where: { id },
    });

    if (!exception) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Schedule exception not found",
      });
    }

    await this.prisma.scheduleException.delete({
      where: { id },
    });
  }

  async generateOccurrences(patternId: string, startDate: Date, endDate: Date) {
    const pattern = await this.prisma.schedulePattern.findUnique({
      where: { id: patternId },
      include: {
        exceptions: true,
      },
    });

    if (!pattern) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Schedule pattern not found",
      });
    }

    // Ensure pattern start date is not after the requested start date
    const effectiveStartDate = pattern.startDate > startDate ? pattern.startDate : startDate;

    // Ensure pattern end date (if any) is not before the requested end date
    const effectiveEndDate = pattern.endDate && pattern.endDate < endDate ? pattern.endDate : endDate;

    // Generate occurrences based on pattern
    const occurrences = [];
    let currentDate = new Date(effectiveStartDate);

    while (currentDate <= effectiveEndDate) {
      // Check if the current day of week is included in the pattern
      if (pattern.daysOfWeek.includes(this.getDayOfWeek(currentDate))) {
        // Check if this date is not an exception
        const exception = pattern.exceptions.find((e) => isSameDay(e.exceptionDate, currentDate));

        if (!exception) {
          // Add regular occurrence
          occurrences.push({
            date: new Date(currentDate),
            startTime: pattern.startTime,
            endTime: pattern.endTime,
          });
        } else if (exception.alternativeDate) {
          // Add rescheduled occurrence
          occurrences.push({
            date: new Date(exception.alternativeDate),
            startTime: exception.alternativeStart || pattern.startTime,
            endTime: exception.alternativeEnd || pattern.endTime,
            isRescheduled: true,
            originalDate: new Date(currentDate),
            reason: exception.reason,
          });
        }
      }

      // Advance to next date based on recurrence type
      currentDate = this.advanceDate(currentDate, pattern.recurrence);
    }

    return occurrences;
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    return days[date.getDay()];
  }

  private advanceDate(date: Date, recurrence: RecurrenceType): Date {
    switch (recurrence) {
      case "DAILY":
        return addDays(date, 1);
      case "WEEKLY":
        return addDays(date, 1);
      case "BIWEEKLY":
        return date.getDay() === 6 ? addDays(date, 8) : addDays(date, 1);
      case "MONTHLY":
        return date.getDay() === 6 ? addMonths(date, 1) : addDays(date, 1);
      case "CUSTOM":
        return addDays(date, 1); // Default to daily for custom
      default:
        return addDays(date, 1);
    }
  }

  async getScheduleExceptions(patternId: string) {
    // Check if pattern exists
    const pattern = await this.prisma.schedulePattern.findUnique({
      where: { id: patternId },
    });

    if (!pattern) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Schedule pattern not found",
      });
    }

    // Get exceptions for this pattern
    const exceptions = await this.prisma.scheduleException.findMany({
      where: {
        schedulePatternId: patternId,
        status: SystemStatus.ACTIVE,
      },
      orderBy: {
        exceptionDate: 'asc',
      },
    });

    return exceptions;
  }
}