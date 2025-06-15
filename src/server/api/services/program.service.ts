/**
 * Program Service
 * Handles operations related to academic programs
 */

import { SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ServiceBase } from "./service-base";

// Program creation schema
export const createProgramSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  type: z.string().min(1),
  level: z.number().int().min(1).optional(),
  duration: z.number().int().min(1),
  institutionId: z.string(),
  settings: z.record(z.any()).optional(),
  curriculum: z.record(z.any()).optional(),
});

// Program update schema
export const updateProgramSchema = z.object({
  id: z.string(),
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  type: z.string().min(1).optional(),
  level: z.number().int().min(1).optional(),
  duration: z.number().int().min(1).optional(),
  settings: z.record(z.any()).optional(),
  curriculum: z.record(z.any()).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Program query schema
export const programQuerySchema = z.object({
  institutionId: z.string().optional(),
  type: z.string().optional(),
  level: z.number().int().min(1).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Program campus creation schema
export const createProgramCampusSchema = z.object({
  programId: z.string(),
  campusId: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
});

// Program campus update schema
export const updateProgramCampusSchema = z.object({
  id: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

export class ProgramService extends ServiceBase {
  /**
   * Creates a new program
   * @param data Program data
   * @returns Created program
   */
  async createProgram(data: z.infer<typeof createProgramSchema>) {
    try {
      // Check if institution exists
      const institution = await this.prisma.institution.findUnique({
        where: { id: data.institutionId },
      });

      if (!institution) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Institution not found",
        });
      }

      // Check if program code is unique
      const existingProgram = await this.prisma.program.findUnique({
        where: { code: data.code },
      });

      if (existingProgram) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Program code already exists",
        });
      }

      // Create the program
      const program = await this.prisma.program.create({
        data: {
          code: data.code,
          name: data.name,
          type: data.type,
          level: data.level || 1,
          duration: data.duration,
          institution: {
            connect: { id: data.institutionId },
          },
          settings: data.settings || {},
          curriculum: data.curriculum || {},
          status: SystemStatus.ACTIVE,
        },
      });

      return {
        success: true,
        program,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create program",
        cause: error,
      });
    }
  }

  /**
   * Gets a program by ID
   * @param id Program ID
   * @returns Program
   */
  async getProgram(id: string) {
    try {
      const program = await this.prisma.program.findUnique({
        where: { id },
        include: {
          institution: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          campusOfferings: {
            where: {
              status: SystemStatus.ACTIVE,
            },
            include: {
              campus: true,
            },
          },
          _count: {
            select: {
              courses: true,
            },
          },
        },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      return {
        success: true,
        program,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get program",
        cause: error,
      });
    }
  }

  /**
   * Updates a program
   * @param data Program update data
   * @returns Updated program
   */
  async updateProgram(data: z.infer<typeof updateProgramSchema>) {
    try {
      // Check if program exists
      const existingProgram = await this.prisma.program.findUnique({
        where: { id: data.id },
      });

      if (!existingProgram) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Check if code is being changed and if it's unique
      if (data.code && data.code !== existingProgram.code) {
        const codeExists = await this.prisma.program.findUnique({
          where: { code: data.code },
        });

        if (codeExists) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Program code already exists",
          });
        }
      }

      // Update the program
      const program = await this.prisma.program.update({
        where: { id: data.id },
        data: {
          code: data.code,
          name: data.name,
          type: data.type,
          level: data.level,
          duration: data.duration,
          settings: data.settings,
          curriculum: data.curriculum,
          status: data.status,
        },
        include: {
          institution: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      return {
        success: true,
        program,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update program",
        cause: error,
      });
    }
  }

  /**
   * Deletes a program (soft delete)
   * @param id Program ID
   * @returns Success status
   */
  async deleteProgram(id: string) {
    try {
      // Check if program exists
      const existingProgram = await this.prisma.program.findUnique({
        where: { id },
        include: {
          campusOfferings: {
            where: {
              status: SystemStatus.ACTIVE,
            },
          },
          courses: {
            where: {
              status: SystemStatus.ACTIVE,
            },
          },
        },
      });

      if (!existingProgram) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Check if program has active campus offerings
      if (existingProgram.campusOfferings.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete program with active campus offerings",
        });
      }

      // Check if program has active courses
      if (existingProgram.courses.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete program with active courses",
        });
      }

      // Soft delete the program
      await this.prisma.program.update({
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
        message: "Failed to delete program",
        cause: error,
      });
    }
  }

  /**
   * Gets programs by query
   * @param query Program query
   * @returns Programs
   */
  async getProgramsByQuery(query: z.infer<typeof programQuerySchema>) {
    try {
      const whereClause: any = {};

      if (query.institutionId) {
        whereClause.institutionId = query.institutionId;
      }

      if (query.type) {
        whereClause.type = query.type;
      }

      if (query.level) {
        whereClause.level = query.level;
      }

      if (query.status) {
        whereClause.status = query.status;
      } else {
        whereClause.status = SystemStatus.ACTIVE;
      }

      const programs = await this.prisma.program.findMany({
        where: whereClause,
        include: {
          institution: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              courses: true,
              campusOfferings: true,
            },
          },
        },
        orderBy: [
          { level: "asc" },
          { code: "asc" },
        ],
      });

      return {
        success: true,
        programs,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get programs by query",
        cause: error,
      });
    }
  }

  /**
   * Gets programs by institution
   * @param institutionId Institution ID
   * @returns Programs
   */
  async getProgramsByInstitution(institutionId: string) {
    try {
      const programs = await this.prisma.program.findMany({
        where: {
          institutionId,
          status: SystemStatus.ACTIVE,
        },
        orderBy: [
          { level: "asc" },
          { code: "asc" },
        ],
      });

      return {
        success: true,
        programs,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get programs by institution",
        cause: error,
      });
    }
  }

  /**
   * Creates a new program campus offering
   * @param data Program campus data
   * @returns Created program campus
   */
  async createProgramCampus(data: z.infer<typeof createProgramCampusSchema>) {
    try {
      // Check if program exists
      const program = await this.prisma.program.findUnique({
        where: { id: data.programId },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

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

      // Check if program campus already exists
      const existingProgramCampus = await this.prisma.programCampus.findUnique({
        where: {
          programId_campusId: {
            programId: data.programId,
            campusId: data.campusId,
          },
        },
      });

      if (existingProgramCampus && existingProgramCampus.status === SystemStatus.ACTIVE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Program is already offered at this campus",
        });
      }

      // Create or update the program campus
      let programCampus;
      
      if (existingProgramCampus) {
        // Reactivate the existing record
        programCampus = await this.prisma.programCampus.update({
          where: { id: existingProgramCampus.id },
          data: {
            startDate: data.startDate,
            endDate: data.endDate,
            status: SystemStatus.ACTIVE,
          },
          include: {
            program: true,
            campus: true,
          },
        });
      } else {
        // Create a new record
        programCampus = await this.prisma.programCampus.create({
          data: {
            program: {
              connect: { id: data.programId },
            },
            campus: {
              connect: { id: data.campusId },
            },
            startDate: data.startDate,
            endDate: data.endDate,
            status: SystemStatus.ACTIVE,
          },
          include: {
            program: true,
            campus: true,
          },
        });
      }

      return {
        success: true,
        programCampus,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create program campus",
        cause: error,
      });
    }
  }

  /**
   * Updates a program campus offering
   * @param data Program campus update data
   * @returns Updated program campus
   */
  async updateProgramCampus(data: z.infer<typeof updateProgramCampusSchema>) {
    try {
      // Check if program campus exists
      const existingProgramCampus = await this.prisma.programCampus.findUnique({
        where: { id: data.id },
      });

      if (!existingProgramCampus) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program campus not found",
        });
      }

      // Update the program campus
      const programCampus = await this.prisma.programCampus.update({
        where: { id: data.id },
        data: {
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
        },
        include: {
          program: true,
          campus: true,
        },
      });

      return {
        success: true,
        programCampus,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update program campus",
        cause: error,
      });
    }
  }

  /**
   * Gets program campuses by program
   * @param programId Program ID
   * @returns Program campuses
   */
  async getProgramCampusesByProgram(programId: string) {
    try {
      const programCampuses = await this.prisma.programCampus.findMany({
        where: {
          programId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          campus: true,
          _count: {
            select: {
              classes: true,
              courseOfferings: true,
            },
          },
        },
        orderBy: {
          campus: {
            name: "asc",
          },
        },
      });

      return {
        success: true,
        programCampuses,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get program campuses by program",
        cause: error,
      });
    }
  }

  /**
   * Gets program campuses by campus
   * @param campusId Campus ID
   * @returns Program campuses
   */
  async getProgramCampusesByCampus(campusId: string) {
    try {
      const programCampuses = await this.prisma.programCampus.findMany({
        where: {
          campusId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          program: true,
          _count: {
            select: {
              classes: true,
              courseOfferings: true,
            },
          },
        },
        orderBy: {
          program: {
            name: "asc",
          },
        },
      });

      return {
        success: true,
        programCampuses,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get program campuses by campus",
        cause: error,
      });
    }
  }
} 