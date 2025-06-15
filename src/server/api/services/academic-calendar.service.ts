import { PrismaClient, AcademicEventType, SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ServiceBase } from "./service-base";

interface CreateAcademicEventInput {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: AcademicEventType;
  academicCycleId?: string;
  campusId?: string;
  classIds?: string[];
}

interface UpdateAcademicEventInput {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  type?: AcademicEventType;
  academicCycleId?: string;
  campusId?: string;
  classIds?: string[];
}

interface ListAcademicEventsInput {
  page?: number;
  pageSize?: number;
  startDate?: Date;
  endDate?: Date;
  type?: AcademicEventType;
  academicCycleId?: string;
  campusId?: string;
}

export class AcademicCalendarService extends ServiceBase {
  constructor(context: { prisma: PrismaClient }) {
    super(context);
  }

  async createAcademicEvent(data: CreateAcademicEventInput) {
    // Validate date range
    if (data.startDate > data.endDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Start date must be before end date",
      });
    }

    // Check for overlapping events of the same type
    const overlappingEvents = await this.prisma.academicCalendarEvent.findMany({
      where: {
        type: data.type,
        startDate: { lte: data.endDate },
        endDate: { gte: data.startDate },
        status: SystemStatus.ACTIVE,
        ...(data.academicCycleId && { academicCycleId: data.academicCycleId }),
        ...(data.campusId && { campusId: data.campusId }),
      },
    });

    if (overlappingEvents.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `There are overlapping ${data.type.toLowerCase()} events in the selected date range`,
      });
    }

    // Create academic event
    const event = await this.prisma.academicCalendarEvent.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type,
        academicCycleId: data.academicCycleId || 'default-cycle-id',
        createdBy: 'system',
        ...(data.campusId 
          ? {
              campuses: {
                connect: [{ id: data.campusId }],
              },
            }
          : {}),
        ...(data.classIds && data.classIds.length > 0
          ? {
              classes: {
                connect: data.classIds.map((id) => ({ id })),
              },
            }
          : {}),
      },
      include: {
        academicCycle: true,
        campuses: true,
        classes: true,
      },
    });

    return event;
  }

  async updateAcademicEvent(id: string, data: UpdateAcademicEventInput) {
    const event = await this.prisma.academicCalendarEvent.findUnique({
      where: { id },
      include: {
        classes: true,
      },
    });

    if (!event) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Academic calendar event not found",
      });
    }

    // Validate date range if both dates are provided
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Start date must be before end date",
      });
    }

    // Check for overlapping events if dates or type are being updated
    if (data.startDate || data.endDate || data.type) {
      const startDate = data.startDate || event.startDate;
      const endDate = data.endDate || event.endDate;
      const type = data.type || event.type;

      const overlappingEvents = await this.prisma.academicCalendarEvent.findMany({
        where: {
          id: { not: id },
          type,
          startDate: { lte: endDate },
          endDate: { gte: startDate },
          status: SystemStatus.ACTIVE,
          ...(data.academicCycleId && { academicCycleId: data.academicCycleId }),
          ...(data.campusId && { campusId: data.campusId }),
        },
      });

      if (overlappingEvents.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `There are overlapping ${type.toLowerCase()} events in the selected date range`,
        });
      }
    }

    // Update academic event
    const updatedEvent = await this.prisma.academicCalendarEvent.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate && { endDate: data.endDate }),
        ...(data.type && { type: data.type }),
        ...(data.academicCycleId !== undefined && {
          academicCycleId: data.academicCycleId,
        }),
        ...(data.campusId !== undefined && { campusId: data.campusId }),
        ...(data.classIds && {
          classes: {
            set: data.classIds.map((id) => ({ id })),
          },
        }),
      },
      include: {
        academicCycle: true,
        campuses: true,
        classes: true,
      },
    });

    return updatedEvent;
  }

  async deleteAcademicEvent(id: string): Promise<void> {
    const event = await this.prisma.academicCalendarEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Academic calendar event not found",
      });
    }

    await this.prisma.academicCalendarEvent.update({
      where: { id },
      data: {
        status: SystemStatus.DELETED,
        deletedAt: new Date(),
      },
    });
  }

  async getAcademicEvent(id: string) {
    const event = await this.prisma.academicCalendarEvent.findUnique({
      where: { id },
      include: {
        academicCycle: true,
        campuses: true,
        classes: true,
      },
    });

    if (!event) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Academic calendar event not found",
      });
    }

    return event;
  }

  async listAcademicEvents(input: ListAcademicEventsInput) {
    const { page = 1, pageSize = 10, startDate, endDate, type, academicCycleId, campusId } = input;

    const where = {
      status: SystemStatus.ACTIVE,
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
      ...(academicCycleId && { academicCycleId }),
      ...(campusId && { campusId }),
    };

    const [events, total] = await Promise.all([
      this.prisma.academicCalendarEvent.findMany({
        where,
        include: {
          academicCycle: true,
          campuses: true,
          classes: true,
        },
        orderBy: {
          startDate: "asc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.academicCalendarEvent.count({ where }),
    ]);

    return {
      items: events,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getEventsInRange(startDate: Date, endDate: Date, options?: {
    academicCycleId?: string;
    campusId?: string;
    type?: AcademicEventType;
  }) {
    return this.prisma.academicCalendarEvent.findMany({
      where: {
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        status: SystemStatus.ACTIVE,
        ...(options?.academicCycleId && { academicCycleId: options.academicCycleId }),
        ...(options?.campusId && { campusId: options.campusId }),
        ...(options?.type && { type: options.type }),
      },
      include: {
        academicCycle: true,
        campuses: true,
        classes: true,
      },
      orderBy: {
        startDate: "asc",
      },
    });
  }

  async checkEventConflicts(startDate: Date, endDate: Date, options?: {
    academicCycleId?: string;
    campusId?: string;
    excludeEventId?: string;
  }) {
    const conflicts = await this.prisma.academicCalendarEvent.findMany({
      where: {
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        status: SystemStatus.ACTIVE,
        ...(options?.academicCycleId && { academicCycleId: options.academicCycleId }),
        ...(options?.campusId && { campusId: options.campusId }),
        ...(options?.excludeEventId && { id: { not: options.excludeEventId } }),
      },
      include: {
        academicCycle: true,
        campuses: true,
      },
    });

    return conflicts;
  }
} 