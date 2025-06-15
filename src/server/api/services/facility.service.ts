/**
 * Facility Service
 * Handles operations related to facility management
 */

import { FacilityType, SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ServiceBase } from "./service-base";
import { Prisma } from "@prisma/client";

// Facility creation schema
export const createFacilitySchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  type: z.nativeEnum(FacilityType),
  campusId: z.string(),
  capacity: z.number().int().positive(),
  building: z.string().optional(),
  resources: z.record(z.any()).optional(),
  description: z.string().optional(),
});

// Facility update schema
export const updateFacilitySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  type: z.nativeEnum(FacilityType).optional(),
  capacity: z.number().int().positive().optional(),
  building: z.string().optional(),
  resources: z.record(z.any()).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Facility query schema
export const facilityQuerySchema = z.object({
  campusId: z.string(),
  type: z.nativeEnum(FacilityType).optional(),
  capacity: z.number().int().positive().optional(),
  building: z.string().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

export class FacilityService extends ServiceBase {
  /**
   * Creates a new facility
   * @param data Facility data
   * @returns Created facility
   */
  async createFacility(data: z.infer<typeof createFacilitySchema>) {
    try {
      // Check if campus exists
      const campus = await this.prisma.campus.findUnique({
        where: { id: data.campusId },
      });

      if (!campus) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campus not found",
        });
      }

      // Check if facility code is unique within the campus
      const existingFacility = await this.prisma.facility.findFirst({
        where: {
          code: data.code,
          campusId: data.campusId,
        },
      });

      if (existingFacility) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Facility code already exists in this campus",
        });
      }

      // Create the facility
      const facility = await this.prisma.facility.create({
        data: {
          name: data.name,
          code: data.code,
          type: data.type,
          campus: {
            connect: { id: data.campusId },
          },
          capacity: data.capacity,
          resources: data.resources || {},
          status: SystemStatus.ACTIVE,
        },
      });

      return {
        success: true,
        facility,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create facility",
        cause: error,
      });
    }
  }

  /**
   * Get a facility by ID
   * @param id Facility ID
   * @returns Facility details
   */
  async getFacility(id: string) {
    try {
      const facility = await this.prisma.facility.findUnique({
        where: { id },
        include: {
          campus: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              classes: true,
              schedules: true,
              timetablePeriods: true,
            },
          },
        },
      });

      if (!facility) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Facility not found",
        });
      }

      return facility;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get facility",
        cause: error,
      });
    }
  }

  /**
   * Update a facility
   * @param id Facility ID
   * @param data Updated facility data
   * @returns Updated facility
   */
  async updateFacility(id: string, data: Partial<z.infer<typeof createFacilitySchema>> & { status?: string }) {
    try {
      // Check if facility exists
      const facility = await this.prisma.facility.findUnique({
        where: { id },
      });

      if (!facility) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Facility not found",
        });
      }

      // Check if code is being changed and if it's unique
      if (data.code && data.code !== facility.code) {
        const existingFacility = await this.prisma.facility.findFirst({
          where: {
            code: data.code,
            campusId: facility.campusId,
            id: { not: id },
          },
        });

        if (existingFacility) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Facility code already exists in this campus",
          });
        }
      }

      // Update the facility
      const updatedFacility = await this.prisma.facility.update({
        where: { id },
        data: {
          name: data.name,
          code: data.code,
          type: data.type,
          capacity: data.capacity,
          resources: data.resources,
          status: data.status as SystemStatus,
        },
      });

      return {
        success: true,
        facility: updatedFacility,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update facility",
        cause: error,
      });
    }
  }

  /**
   * Delete a facility
   * @param id Facility ID
   * @returns Success status
   */
  async deleteFacility(id: string) {
    try {
      // Check if facility exists
      const facility = await this.prisma.facility.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              classes: true,
              schedules: true,
              timetablePeriods: true,
            },
          },
        },
      });

      if (!facility) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Facility not found",
        });
      }

      // Check if facility has dependencies
      if (
        facility._count.classes > 0 ||
        facility._count.schedules > 0 ||
        facility._count.timetablePeriods > 0
      ) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot delete facility with existing dependencies",
        });
      }

      // Delete the facility
      await this.prisma.facility.delete({
        where: { id },
      });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete facility",
        cause: error,
      });
    }
  }

  /**
   * Get facilities by campus
   * @param campusId Campus ID
   * @param filters Optional filters
   * @returns List of facilities
   */
  async getFacilitiesByCampus(
    campusId: string,
    filters?: {
      type?: string;
      status?: SystemStatus;
      search?: string;
    }
  ) {
    try {
      // Check if campus exists
      const campus = await this.prisma.campus.findUnique({
        where: { id: campusId },
      });

      if (!campus) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campus not found",
        });
      }

      // Build where clause
      const where: Prisma.FacilityWhereInput = {
        campusId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.type && { type: filters.type as any }),
        ...(filters?.search && {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" as Prisma.QueryMode } },
            { code: { contains: filters.search, mode: "insensitive" as Prisma.QueryMode } },
          ],
        }),
      };

      // Get facilities
      const facilities = await this.prisma.facility.findMany({
        where,
        include: {
          _count: {
            select: {
              classes: true,
              schedules: true,
              timetablePeriods: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      return {
        success: true,
        facilities,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get facilities by campus",
        cause: error,
      });
    }
  }

  /**
   * Gets facilities by query
   * @param query Facility query
   * @returns Facilities
   */
  async getFacilitiesByQuery(query: z.infer<typeof facilityQuerySchema>) {
    try {
      const whereClause: any = {
        campusId: query.campusId,
      };

      if (query.type) {
        whereClause.type = query.type;
      }

      if (query.capacity) {
        whereClause.capacity = {
          gte: query.capacity,
        };
      }

      if (query.building) {
        whereClause.building = query.building;
      }

      if (query.status) {
        whereClause.status = query.status;
      } else {
        whereClause.status = SystemStatus.ACTIVE;
      }

      const facilities = await this.prisma.facility.findMany({
        where: whereClause,
        include: {
          campus: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      return {
        success: true,
        facilities,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get facilities by query",
        cause: error,
      });
    }
  }

  /**
   * Gets facilities by type
   * @param campusId Campus ID
   * @param type Facility type
   * @returns Facilities
   */
  async getFacilitiesByType(campusId: string, type: FacilityType) {
    try {
      const facilities = await this.prisma.facility.findMany({
        where: {
          campusId,
          type,
          status: SystemStatus.ACTIVE,
        },
        orderBy: {
          name: "asc",
        },
      });

      return {
        success: true,
        facilities,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get facilities by type",
        cause: error,
      });
    }
  }

  /**
   * Checks facility availability for a specific time
   * @param facilityId Facility ID
   * @param dayOfWeek Day of week
   * @param startTime Start time
   * @param endTime End time
   * @param classId Class ID
   * @returns Availability status
   */
  async checkFacilityAvailability(
    facilityId: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    classId: string
  ) {
    try {
      // Check if facility exists
      const facility = await this.prisma.facility.findUnique({
        where: { id: facilityId },
      });

      if (!facility) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Facility not found",
        });
      }

      // Get the class to find its timetable
      const classEntity = await this.prisma.class.findUnique({
        where: { id: classId },
        include: {
          timetables: true,
        },
      });

      if (!classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      const timetableIds = classEntity.timetables.map(t => t.id);

      // Check if facility is available at the specified time
      const conflictingPeriods = await this.prisma.timetablePeriod.findMany({
        where: {
          facilityId,
          dayOfWeek: dayOfWeek as any, // Cast to DayOfWeek enum
          timetableId: {
            in: timetableIds,
          },
          status: SystemStatus.ACTIVE,
          OR: [
            {
              // Period starts during the requested time
              startTime: {
                gte: new Date(startTime),
                lt: new Date(endTime),
              },
            },
            {
              // Period ends during the requested time
              endTime: {
                gt: new Date(startTime),
                lte: new Date(endTime),
              },
            },
            {
              // Period completely contains the requested time
              startTime: {
                lte: new Date(startTime),
              },
              endTime: {
                gte: new Date(endTime),
              },
            },
          ],
        },
        include: {
          assignment: {
            include: {
              qualification: {
                include: {
                  teacher: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                  subject: true,
                },
              },
            },
          },
          timetable: {
            include: {
              class: true,
            },
          },
        },
      });

      return {
        success: true,
        available: conflictingPeriods.length === 0,
        conflictingPeriods,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check facility availability",
        cause: error,
      });
    }
  }

  /**
   * Gets facility schedule for a class
   * @param facilityId Facility ID
   * @param classId Class ID
   * @returns Facility schedule
   */
  async getFacilitySchedule(facilityId: string, classId: string) {
    try {
      // Check if facility exists
      const facility = await this.prisma.facility.findUnique({
        where: { id: facilityId },
      });

      if (!facility) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Facility not found",
        });
      }

      // Get the class to find its timetable
      const classEntity = await this.prisma.class.findUnique({
        where: { id: classId },
        include: {
          timetables: true,
        },
      });

      if (!classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      const timetableIds = classEntity.timetables.map(t => t.id);

      // Get all periods for the facility in these timetables
      const periods = await this.prisma.timetablePeriod.findMany({
        where: {
          facilityId,
          timetableId: {
            in: timetableIds,
          },
          status: SystemStatus.ACTIVE,
        },
        include: {
          timetable: {
            include: {
              class: true,
            },
          },
          assignment: {
            include: {
              qualification: {
                include: {
                  teacher: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                  subject: true,
                },
              },
            },
          },
        },
        orderBy: [
          { dayOfWeek: "asc" },
          { startTime: "asc" },
        ],
      });

      // Organize periods by day
      const scheduleByDay = {
        MONDAY: periods.filter((p) => p.dayOfWeek === "MONDAY"),
        TUESDAY: periods.filter((p) => p.dayOfWeek === "TUESDAY"),
        WEDNESDAY: periods.filter((p) => p.dayOfWeek === "WEDNESDAY"),
        THURSDAY: periods.filter((p) => p.dayOfWeek === "THURSDAY"),
        FRIDAY: periods.filter((p) => p.dayOfWeek === "FRIDAY"),
        SATURDAY: periods.filter((p) => p.dayOfWeek === "SATURDAY"),
        SUNDAY: periods.filter((p) => p.dayOfWeek === "SUNDAY"),
      };

      return {
        success: true,
        facility,
        scheduleByDay,
        periods,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get facility schedule",
        cause: error,
      });
    }
  }
} 