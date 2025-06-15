import { TRPCError } from "@trpc/server";
import { prisma } from '../../db';
import { SystemStatus } from '../constants';
import type { DayOfWeek, PeriodType } from "../constants";
import type { PaginationInput, BaseFilters } from "../types";

type FacilityScheduleInput = {
  facilityId: string;
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

export class FacilityScheduleService {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Create a new facility schedule
   */
  async createSchedule(data: FacilityScheduleInput) {
    // Validate facility exists
    const facility = await this.prisma.facility.findUnique({
      where: { id: data.facilityId }
    });

    if (!facility) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Facility not found'
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
    const existingSchedule = await this.prisma.facilitySchedule.findFirst({
      where: {
        facilityId: data.facilityId,
        termId: data.termId,
        status: 'ACTIVE'
      }
    });

    if (existingSchedule) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Facility already has a schedule for this term'
      });
    }

    return this.prisma.facilitySchedule.create({
      data: {
        ...data,
        status: 'ACTIVE'
      },
      include: {
        facility: true,
        term: true
      }
    });
  }

  /**
   * Add period to schedule
   */
  async addPeriod(data: SchedulePeriodInput) {
    // Validate schedule exists
    const schedule = await this.prisma.facilitySchedule.findUnique({
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
    const existingPeriod = await this.prisma.facilitySchedulePeriod.findFirst({
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
    const conflictingPeriod = await this.prisma.facilitySchedulePeriod.findFirst({
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

    return this.prisma.facilitySchedulePeriod.create({
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

  /**
   * Get schedule by ID
   */
  async getSchedule(id: string) {
    const schedule = await this.prisma.facilitySchedule.findUnique({
      where: { id },
      include: {
        facility: true,
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

  /**
   * Get paginated list of schedules
   */
  async listSchedules(params: {
    facilityId?: string;
    termId?: string;
    status?: SystemStatus;
    skip?: number;
    take?: number;
  }) {
    const { facilityId, termId, status = 'ACTIVE', skip = 0, take = 10 } = params;

    return this.prisma.facilitySchedule.findMany({
      where: {
        facilityId,
        termId,
        status
      },
      include: {
        facility: true,
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

  /**
   * Update schedule
   */
  async updateSchedule(id: string, data: Partial<FacilityScheduleInput> & { status?: SystemStatus }) {
    const schedule = await this.prisma.facilitySchedule.findUnique({
      where: { id }
    });

    if (!schedule) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Schedule not found'
      });
    }

    return this.prisma.facilitySchedule.update({
      where: { id },
      data,
      include: {
        facility: true,
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

  /**
   * Delete schedule
   */
  async deleteSchedule(id: string) {
    const schedule = await this.prisma.facilitySchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Schedule not found",
      });
    }

    await this.prisma.facilitySchedule.update({
      where: { id },
      data: { status: SystemStatus.DELETED },
    });

    return true;
  }

  /**
   * Remove period from schedule
   */
  async removePeriod(scheduleId: string, periodId: string) {
    const period = await this.prisma.facilitySchedulePeriod.findFirst({
      where: {
        scheduleId,
        id: periodId,
        status: 'ACTIVE'
      }
    });

    if (!period) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Period not found",
      });
    }

    await this.prisma.facilitySchedulePeriod.delete({
      where: { id: periodId },
    });

    return true;
  }

  /**
   * Get facility availability
   */
  async getFacilityAvailability(
    facilityId: string,
    dayOfWeek: DayOfWeek,
    startTime: Date,
    endTime: Date,
  ) {
    const conflicts = await this.prisma.facilitySchedulePeriod.findMany({
      where: {
        schedule: {
          facilityId,
          status: SystemStatus.ACTIVE,
        },
        timetablePeriod: {
          dayOfWeek,
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
          ],
        },
      },
      include: {
        timetablePeriod: true,
      },
    });

    return {
      isAvailable: conflicts.length === 0,
      conflicts,
    };
  }
} 