import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ServiceBase } from "./service-base";

interface CreateHolidayInput {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: 'NATIONAL' | 'RELIGIOUS' | 'INSTITUTIONAL' | 'ADMINISTRATIVE' | 'WEATHER' | 'OTHER';
  affectsAll: boolean;
  campusIds?: string[];
  createdBy?: string;
}

interface UpdateHolidayInput {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  type?: 'NATIONAL' | 'RELIGIOUS' | 'INSTITUTIONAL' | 'ADMINISTRATIVE' | 'WEATHER' | 'OTHER';
  affectsAll?: boolean;
  campusIds?: string[];
}

interface ListHolidaysInput {
  page?: number;
  pageSize?: number;
  startDate?: Date;
  endDate?: Date;
  type?: 'NATIONAL' | 'RELIGIOUS' | 'INSTITUTIONAL' | 'ADMINISTRATIVE' | 'WEATHER' | 'OTHER';
  campusId?: string;
}

type HolidayWithCampuses = {
  id: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  type: 'NATIONAL' | 'RELIGIOUS' | 'INSTITUTIONAL' | 'ADMINISTRATIVE' | 'WEATHER' | 'OTHER';
  affectsAll: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED' | 'ARCHIVED' | 'ARCHIVED_CURRENT_YEAR' | 'ARCHIVED_PREVIOUS_YEAR' | 'ARCHIVED_HISTORICAL';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string;
  campuses: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
    institutionId: string;
    address: any;
    contact: any;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

export class HolidayService extends ServiceBase {
  constructor(context: { prisma: PrismaClient }) {
    super(context);
  }

  async createHoliday(data: CreateHolidayInput): Promise<HolidayWithCampuses> {
    // Validate date range
    if (data.startDate > data.endDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Start date must be before end date",
      });
    }

    // Check for overlapping holidays
    const overlappingHolidays = await this.prisma.holiday.findMany({
      where: {
        startDate: { lte: data.endDate },
        endDate: { gte: data.startDate },
        status: "ACTIVE",
        ...(data.campusIds && data.campusIds.length > 0
          ? {
              campuses: {
                some: {
                  id: { in: data.campusIds },
                },
              },
            }
          : {}),
      },
    });

    if (overlappingHolidays.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "There are overlapping holidays in the selected date range",
      });
    }

    // Create holiday
    const holiday = await this.prisma.holiday.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type,
        affectsAll: data.affectsAll,
        creator: {
          connect: { id: data.createdBy || 'system' }
        },
        ...(data.campusIds && data.campusIds.length > 0
          ? {
              campuses: {
                connect: data.campusIds.map((id) => ({ id })),
              },
            }
          : {}),
      },
      include: {
        campuses: true,
      },
    });

    return holiday as HolidayWithCampuses;
  }

  async updateHoliday(id: string, data: UpdateHolidayInput): Promise<HolidayWithCampuses> {
    const holiday = await this.prisma.holiday.findUnique({
      where: { id },
      include: {
        campuses: true,
      },
    });

    if (!holiday) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Holiday not found",
      });
    }

    // Validate date range if both dates are provided
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Start date must be before end date",
      });
    }

    // Check for overlapping holidays if dates are being updated
    if (data.startDate || data.endDate) {
      const startDate = data.startDate || holiday.startDate;
      const endDate = data.endDate || holiday.endDate;

      const overlappingHolidays = await this.prisma.holiday.findMany({
        where: {
          id: { not: id },
          startDate: { lte: endDate },
          endDate: { gte: startDate },
          status: "ACTIVE",
          ...(data.campusIds && data.campusIds.length > 0
            ? {
                campuses: {
                  some: {
                    id: { in: data.campusIds },
                  },
                },
              }
            : {}),
        },
      });

      if (overlappingHolidays.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "There are overlapping holidays in the selected date range",
        });
      }
    }

    // Update holiday
    const updatedHoliday = await this.prisma.holiday.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate && { endDate: data.endDate }),
        ...(data.type && { type: data.type }),
        ...(data.affectsAll !== undefined && { affectsAll: data.affectsAll }),
        ...(data.campusIds && {
          campuses: {
            set: data.campusIds.map((id) => ({ id })),
          },
        }),
      },
      include: {
        campuses: true,
      },
    });

    return updatedHoliday as HolidayWithCampuses;
  }

  async deleteHoliday(id: string): Promise<void> {
    const holiday = await this.prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Holiday not found",
      });
    }

    await this.prisma.holiday.update({
      where: { id },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
      },
    });
  }

  async getHoliday(id: string): Promise<HolidayWithCampuses> {
    const holiday = await this.prisma.holiday.findUnique({
      where: { id },
      include: {
        campuses: true,
      },
    });

    if (!holiday) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Holiday not found",
      });
    }

    return holiday as HolidayWithCampuses;
  }

  async listHolidays(input: ListHolidaysInput) {
    const { page = 1, pageSize = 10, startDate, endDate, type, campusId } = input;

    const where = {
      status: "ACTIVE" as const,
      ...(startDate && endDate
        ? {
            OR: [
              {
                startDate: { lte: endDate },
                endDate: { gte: startDate },
              },
            ],
          }
        : {}),
      ...(type && { type }),
      ...(campusId
        ? {
            OR: [
              { affectsAll: true },
              {
                campuses: {
                  some: {
                    id: campusId,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [holidays, total] = await Promise.all([
      this.prisma.holiday.findMany({
        where,
        include: {
          campuses: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          startDate: 'asc',
        },
      }),
      this.prisma.holiday.count({ where }),
    ]);

    return {
      data: holidays.map(holiday => ({
        ...holiday,
        campuses: holiday.campuses || []
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async isHoliday(date: Date, campusId?: string): Promise<boolean> {
    const holiday = await this.prisma.holiday.findFirst({
      where: {
        startDate: { lte: date },
        endDate: { gte: date },
        status: "ACTIVE",
        OR: [
          { affectsAll: true },
          ...(campusId
            ? [
                {
                  campuses: {
                    some: {
                      id: campusId,
                    },
                  },
                },
              ]
            : []),
        ],
      },
    });

    return !!holiday;
  }

  async getHolidaysInRange(
    startDate: Date,
    endDate: Date,
    campusId?: string
  ): Promise<HolidayWithCampuses[]> {
    return this.prisma.holiday.findMany({
      where: {
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        status: "ACTIVE",
        OR: [
          { affectsAll: true },
          ...(campusId
            ? [
                {
                  campuses: {
                    some: {
                      id: campusId,
                    },
                  },
                },
              ]
            : []),
        ],
      },
      include: {
        campuses: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    }) as Promise<HolidayWithCampuses[]>;
  }
} 