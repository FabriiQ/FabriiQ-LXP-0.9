import { TRPCError } from '@trpc/server';
import { prisma } from '../../db';
import { SystemStatus } from '../constants';
import type { DayOfWeek, PeriodType } from '../constants';

type TeacherScheduleInput = {
  teacherId: string;
  termId: string;
  startDate?: Date;
  endDate?: Date;
};

type SchedulePeriodInput = {
  scheduleId: string;
  timetablePeriodId: string;
};

type SchedulePeriod = {
  timetablePeriod: {
    startTime: Date;
    endTime: Date;
    type: PeriodType;
  };
};

type BusyPeriod = {
  startTime: Date;
  endTime: Date;
  type: PeriodType;
};

export class TeacherScheduleService {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  async createSchedule(data: TeacherScheduleInput) {
    // Validate teacher exists
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { id: data.teacherId }
    });

    if (!teacher) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Teacher not found'
      });
    }

    // Validate term exists
    const term = await this.prisma.term.findUnique({
      where: { id: data.termId }
    });

    if (!term) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Term not found'
      });
    }

    // Check for existing schedule in the same term
    const existingSchedule = await this.prisma.teacherSchedule.findFirst({
      where: {
        teacherId: data.teacherId,
        termId: data.termId,
        status: 'ACTIVE'
      }
    });

    if (existingSchedule) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Teacher already has a schedule for this term'
      });
    }

    return this.prisma.teacherSchedule.create({
      data: {
        ...data,
        status: 'ACTIVE'
      },
      include: {
        teacher: true,
        term: true
      }
    });
  }

  async addPeriod(data: SchedulePeriodInput) {
    // Validate schedule exists
    const schedule = await this.prisma.teacherSchedule.findUnique({
      where: { id: data.scheduleId }
    });

    if (!schedule) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Schedule not found'
      });
    }

    // Validate timetable period exists
    const period = await this.prisma.timetablePeriod.findUnique({
      where: { id: data.timetablePeriodId }
    });

    if (!period) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Timetable period not found'
      });
    }

    // Check for period conflicts
    const existingPeriod = await this.prisma.teacherSchedulePeriod.findFirst({
      where: {
        scheduleId: data.scheduleId,
        timetablePeriodId: data.timetablePeriodId,
        status: 'ACTIVE'
      }
    });

    if (existingPeriod) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Period already exists in schedule'
      });
    }

    // Check for time conflicts
    const conflictingPeriod = await this.prisma.teacherSchedulePeriod.findFirst({
      where: {
        scheduleId: data.scheduleId,
        status: 'ACTIVE',
        timetablePeriod: {
          dayOfWeek: period.dayOfWeek,
          OR: [
            {
              AND: [
                { startTime: { lte: period.startTime } },
                { endTime: { gt: period.startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: period.endTime } },
                { endTime: { gte: period.endTime } }
              ]
            }
          ]
        }
      },
      include: {
        timetablePeriod: true
      }
    });

    if (conflictingPeriod) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Time conflict with existing period'
      });
    }

    return this.prisma.teacherSchedulePeriod.create({
      data: {
        ...data,
        status: 'ACTIVE'
      },
      include: {
        schedule: true,
        timetablePeriod: true
      }
    });
  }

  async getSchedule(id: string) {
    const schedule = await this.prisma.teacherSchedule.findUnique({
      where: { id },
      include: {
        teacher: true,
        term: true,
        periods: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            timetablePeriod: {
              include: {
                assignment: {
                  include: {
                    qualification: {
                      include: {
                        subject: true,
                        teacher: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!schedule) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Schedule not found'
      });
    }

    return schedule;
  }

  async listSchedules(params: {
    teacherId?: string;
    termId?: string;
    status?: SystemStatus;
    skip?: number;
    take?: number;
  }) {
    const { teacherId, termId, status = 'ACTIVE', skip = 0, take = 10 } = params;

    return this.prisma.teacherSchedule.findMany({
      where: {
        teacherId,
        termId,
        status
      },
      include: {
        teacher: true,
        term: true,
        periods: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            timetablePeriod: {
              include: {
                assignment: {
                  include: {
                    qualification: {
                      include: {
                        subject: true,
                        teacher: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    });
  }

  async updateSchedule(id: string, data: Partial<TeacherScheduleInput> & { status?: SystemStatus }) {
    const schedule = await this.prisma.teacherSchedule.findUnique({
      where: { id }
    });

    if (!schedule) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Schedule not found'
      });
    }

    return this.prisma.teacherSchedule.update({
      where: { id },
      data,
      include: {
        teacher: true,
        term: true,
        periods: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            timetablePeriod: true
          }
        }
      }
    });
  }

  async removePeriod(scheduleId: string, periodId: string) {
    const period = await this.prisma.teacherSchedulePeriod.findFirst({
      where: {
        scheduleId,
        id: periodId,
        status: 'ACTIVE'
      }
    });

    if (!period) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Period not found in schedule'
      });
    }

    return this.prisma.teacherSchedulePeriod.update({
      where: { id: periodId },
      data: { status: 'DELETED' }
    });
  }

  async getTeacherAvailability(teacherId: string, termId: string, dayOfWeek: DayOfWeek) {
    // Get teacher's schedule for the term
    const schedule = await this.prisma.teacherSchedule.findFirst({
      where: {
        teacherId,
        termId,
        status: 'ACTIVE'
      },
      include: {
        periods: {
          where: {
            status: 'ACTIVE',
            timetablePeriod: {
              dayOfWeek
            }
          },
          include: {
            timetablePeriod: true
          }
        }
      }
    });

    if (!schedule) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No schedule found for teacher in this term'
      });
    }

    // Sort periods by start time
    const busyPeriods = schedule.periods
      .map(p => {
        // Convert Prisma enum to our internal enum
        const periodType = p.timetablePeriod.type as unknown as PeriodType;
        
        return {
          startTime: p.timetablePeriod.startTime,
          endTime: p.timetablePeriod.endTime,
          type: periodType
        };
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return {
      teacherId,
      termId,
      dayOfWeek,
      busyPeriods
    };
  }
} 