/**
 * Schedule Service
 * Handles operations related to class and facility scheduling
 */

import { DayOfWeek, PeriodType, SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ServiceBase } from "./service-base";

// Timetable creation schema
export const createTimetableSchema = z.object({
  name: z.string().min(1).max(100),
  classId: z.string(),
  courseCampusId: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  createdById: z.string(),
});

// Timetable update schema
export const updateTimetableSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Timetable period creation schema
export const createTimetablePeriodSchema = z.object({
  timetableId: z.string(),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  startTime: z.string(), // Format: "HH:MM"
  endTime: z.string(), // Format: "HH:MM"
  type: z.nativeEnum(PeriodType),
  facilityId: z.string().optional(),
  assignmentId: z.string(),
  recurring: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

// Timetable period update schema
export const updateTimetablePeriodSchema = z.object({
  id: z.string(),
  dayOfWeek: z.nativeEnum(DayOfWeek).optional(),
  startTime: z.string().optional(), // Format: "HH:MM"
  endTime: z.string().optional(), // Format: "HH:MM"
  type: z.nativeEnum(PeriodType).optional(),
  facilityId: z.string().optional(),
  recurring: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

export class ScheduleService extends ServiceBase {
  /**
   * Creates a new timetable
   * @param data Timetable data
   * @returns Created timetable
   */
  async createTimetable(data: z.infer<typeof createTimetableSchema>) {
    try {
      // Check if class exists
      const classEntity = await this.prisma.class.findUnique({
        where: { id: data.classId },
      });

      if (!classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      // Check if course campus exists
      const courseCampus = await this.prisma.courseCampus.findUnique({
        where: { id: data.courseCampusId },
      });

      if (!courseCampus) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course campus not found",
        });
      }

      // Create the timetable
      const timetable = await this.prisma.timetable.create({
        data: {
          name: data.name,
          class: {
            connect: { id: data.classId },
          },
          courseCampus: {
            connect: { id: data.courseCampusId },
          },
          startDate: data.startDate,
          endDate: data.endDate,
          status: SystemStatus.ACTIVE,
        },
        include: {
          class: true,
          courseCampus: {
            include: {
              course: true,
              campus: true,
            },
          },
        },
      });

      return {
        success: true,
        timetable,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create timetable",
        cause: error,
      });
    }
  }

  /**
   * Gets a timetable by ID
   * @param id Timetable ID
   * @returns Timetable
   */
  async getTimetable(id: string) {
    try {
      const timetable = await this.prisma.timetable.findUnique({
        where: { id },
        include: {
          class: true,
          courseCampus: {
            include: {
              course: true,
              campus: true,
            },
          },
          periods: {
            where: {
              status: SystemStatus.ACTIVE,
            },
            include: {
              facility: true,
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
                              email: true,
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
          },
        },
      });

      if (!timetable) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timetable not found",
        });
      }

      return {
        success: true,
        timetable,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get timetable",
        cause: error,
      });
    }
  }

  /**
   * Updates a timetable
   * @param data Timetable update data
   * @returns Updated timetable
   */
  async updateTimetable(data: z.infer<typeof updateTimetableSchema>) {
    try {
      // Check if timetable exists
      const existingTimetable = await this.prisma.timetable.findUnique({
        where: { id: data.id },
      });

      if (!existingTimetable) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timetable not found",
        });
      }

      // Update the timetable
      const timetable = await this.prisma.timetable.update({
        where: { id: data.id },
        data: {
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
        },
        include: {
          class: true,
          courseCampus: {
            include: {
              course: true,
              campus: true,
            },
          },
        },
      });

      return {
        success: true,
        timetable,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update timetable",
        cause: error,
      });
    }
  }

  /**
   * Deletes a timetable (soft delete)
   * @param id Timetable ID
   * @returns Success status
   */
  async deleteTimetable(id: string) {
    try {
      // Check if timetable exists
      const existingTimetable = await this.prisma.timetable.findUnique({
        where: { id },
      });

      if (!existingTimetable) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timetable not found",
        });
      }

      // Soft delete the timetable
      await this.prisma.timetable.update({
        where: { id },
        data: {
          status: SystemStatus.DELETED,
        },
      });

      // Soft delete all periods
      await this.prisma.timetablePeriod.updateMany({
        where: { timetableId: id },
        data: {
          status: SystemStatus.DELETED,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete timetable",
        cause: error,
      });
    }
  }

  /**
   * Creates a new timetable period
   * @param data Timetable period data
   * @returns Created timetable period
   */
  async createTimetablePeriod(data: z.infer<typeof createTimetablePeriodSchema>) {
    try {
      // Check if timetable exists
      const timetable = await this.prisma.timetable.findUnique({
        where: { id: data.timetableId },
      });

      if (!timetable) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timetable not found",
        });
      }

      // Check if assignment exists
      const assignment = await this.prisma.teacherSubjectAssignment.findUnique({
        where: { id: data.assignmentId },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Teacher subject assignment not found",
        });
      }

      // Check if facility exists if provided
      if (data.facilityId) {
        const facility = await this.prisma.facility.findUnique({
          where: { id: data.facilityId },
        });

        if (!facility) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Facility not found",
          });
        }

        // Check if facility is available at the specified time
        const conflictingPeriods = await this.prisma.timetablePeriod.findMany({
          where: {
            facilityId: data.facilityId,
            dayOfWeek: data.dayOfWeek,
            status: SystemStatus.ACTIVE,
            OR: [
              {
                // Period starts during an existing period
                startTime: {
                  gte: new Date(data.startTime),
                  lt: new Date(data.endTime),
                },
              },
              {
                // Period ends during an existing period
                endTime: {
                  gt: new Date(data.startTime),
                  lte: new Date(data.endTime),
                },
              },
              {
                // Period completely contains an existing period
                startTime: {
                  lte: new Date(data.startTime),
                },
                endTime: {
                  gte: new Date(data.endTime),
                },
              },
            ],
          },
        });

        if (conflictingPeriods.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Facility is not available at the specified time",
          });
        }
      }

      // Create the timetable period
      const period = await this.prisma.timetablePeriod.create({
        data: {
          timetable: {
            connect: { id: data.timetableId },
          },
          dayOfWeek: data.dayOfWeek,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          type: data.type,
          facility: data.facilityId
            ? {
                connect: { id: data.facilityId },
              }
            : undefined,
          assignment: {
            connect: { id: data.assignmentId },
          },
          status: SystemStatus.ACTIVE,
        },
        include: {
          facility: true,
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
        period,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create timetable period",
        cause: error,
      });
    }
  }

  /**
   * Gets a timetable period by ID
   * @param id Timetable period ID
   * @returns Timetable period
   */
  async getTimetablePeriod(id: string) {
    try {
      const period = await this.prisma.timetablePeriod.findUnique({
        where: { id },
        include: {
          facility: true,
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

      if (!period) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timetable period not found",
        });
      }

      return {
        success: true,
        period,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get timetable period",
        cause: error,
      });
    }
  }

  /**
   * Updates a timetable period
   * @param data Timetable period update data
   * @returns Updated timetable period
   */
  async updateTimetablePeriod(data: z.infer<typeof updateTimetablePeriodSchema>) {
    try {
      // Check if period exists
      const existingPeriod = await this.prisma.timetablePeriod.findUnique({
        where: { id: data.id },
      });

      if (!existingPeriod) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timetable period not found",
        });
      }

      // Check if facility exists if provided
      if (data.facilityId) {
        const facility = await this.prisma.facility.findUnique({
          where: { id: data.facilityId },
        });

        if (!facility) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Facility not found",
          });
        }

        // Check if facility is available at the specified time
        if (data.dayOfWeek || data.startTime || data.endTime) {
          const dayOfWeek = data.dayOfWeek || existingPeriod.dayOfWeek;
          const startTime = data.startTime ? new Date(data.startTime) : existingPeriod.startTime;
          const endTime = data.endTime ? new Date(data.endTime) : existingPeriod.endTime;

          const conflictingPeriods = await this.prisma.timetablePeriod.findMany({
            where: {
              facilityId: data.facilityId,
              dayOfWeek: dayOfWeek,
              id: { not: data.id }, // Exclude the current period
              status: SystemStatus.ACTIVE,
              OR: [
                {
                  // Period starts during an existing period
                  startTime: {
                    gte: startTime,
                    lt: endTime,
                  },
                },
                {
                  // Period ends during an existing period
                  endTime: {
                    gt: startTime,
                    lte: endTime,
                  },
                },
                {
                  // Period completely contains an existing period
                  startTime: {
                    lte: startTime,
                  },
                  endTime: {
                    gte: endTime,
                  },
                },
              ],
            },
          });

          if (conflictingPeriods.length > 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Facility is not available at the specified time",
            });
          }
        }
      }

      // Update the period
      const period = await this.prisma.timetablePeriod.update({
        where: { id: data.id },
        data: {
          dayOfWeek: data.dayOfWeek,
          startTime: data.startTime ? new Date(data.startTime) : undefined,
          endTime: data.endTime ? new Date(data.endTime) : undefined,
          type: data.type,
          facilityId: data.facilityId,
          status: data.status,
        },
        include: {
          facility: true,
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
        period,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update timetable period",
        cause: error,
      });
    }
  }

  /**
   * Deletes a timetable period (soft delete)
   * @param id Timetable period ID
   * @returns Success status
   */
  async deleteTimetablePeriod(id: string) {
    try {
      // Check if period exists
      const existingPeriod = await this.prisma.timetablePeriod.findUnique({
        where: { id },
      });

      if (!existingPeriod) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timetable period not found",
        });
      }

      // Soft delete the period
      await this.prisma.timetablePeriod.update({
        where: { id },
        data: {
          status: SystemStatus.DELETED,
          deletedAt: new Date(),
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete timetable period",
        cause: error,
      });
    }
  }

  /**
   * Gets timetable periods by timetable ID
   * @param timetableId Timetable ID
   * @returns Timetable periods
   */
  async getTimetablePeriodsByTimetable(timetableId: string) {
    try {
      const periods = await this.prisma.timetablePeriod.findMany({
        where: {
          timetableId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          facility: true,
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
        orderBy: [
          { dayOfWeek: "asc" },
          { startTime: "asc" },
        ],
      });

      return {
        success: true,
        periods,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get timetable periods by timetable",
        cause: error,
      });
    }
  }

  /**
   * Gets timetable periods by assignment ID
   * @param assignmentId Assignment ID
   * @returns Timetable periods
   */
  async getTimetablePeriodsByAssignment(assignmentId: string) {
    try {
      const periods = await this.prisma.timetablePeriod.findMany({
        where: {
          assignmentId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          facility: true,
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
        orderBy: [
          { dayOfWeek: "asc" },
          { startTime: "asc" },
        ],
      });

      return {
        success: true,
        periods,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get timetable periods by assignment",
        cause: error,
      });
    }
  }

  /**
   * Gets timetable periods by facility ID
   * @param facilityId Facility ID
   * @returns Timetable periods
   */
  async getTimetablePeriodsByFacility(facilityId: string) {
    try {
      const periods = await this.prisma.timetablePeriod.findMany({
        where: {
          facilityId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          facility: true,
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
        orderBy: [
          { dayOfWeek: "asc" },
          { startTime: "asc" },
        ],
      });

      return {
        success: true,
        periods,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get timetable periods by facility",
        cause: error,
      });
    }
  }

  /**
   * Gets timetable periods by class ID
   * @param classId Class ID
   * @returns Timetable periods
   */
  async getTimetablePeriodsByClass(classId: string) {
    try {
      // Get all timetables for the class
      const timetables = await this.prisma.timetable.findMany({
        where: {
          classId,
          status: SystemStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      });

      const timetableIds = timetables.map(t => t.id);

      // Get all periods for these timetables
      const periods = await this.prisma.timetablePeriod.findMany({
        where: {
          timetableId: {
            in: timetableIds,
          },
          status: SystemStatus.ACTIVE,
        },
        include: {
          facility: true,
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
        orderBy: [
          { dayOfWeek: "asc" },
          { startTime: "asc" },
        ],
      });

      return {
        success: true,
        periods,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get timetable periods by class",
        cause: error,
      });
    }
  }

  /**
   * Gets timetable periods by teacher ID
   * @param teacherId Teacher ID
   * @returns Timetable periods
   */
  async getTimetablePeriodsByTeacher(teacherId: string) {
    try {
      // Get all qualifications for the teacher
      const qualifications = await this.prisma.teacherSubjectQualification.findMany({
        where: {
          teacherId,
        },
        select: {
          id: true,
        },
      });

      const qualificationIds = qualifications.map(q => q.id);

      // Get all assignments for these qualifications
      const assignments = await this.prisma.teacherSubjectAssignment.findMany({
        where: {
          qualificationId: {
            in: qualificationIds,
          },
          status: SystemStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      });

      const assignmentIds = assignments.map(a => a.id);

      // Get all periods for these assignments
      const periods = await this.prisma.timetablePeriod.findMany({
        where: {
          assignmentId: {
            in: assignmentIds,
          },
          status: SystemStatus.ACTIVE,
        },
        include: {
          facility: true,
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
        orderBy: [
          { dayOfWeek: "asc" },
          { startTime: "asc" },
        ],
      });

      return {
        success: true,
        periods,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get timetable periods by teacher",
        cause: error,
      });
    }
  }
} 