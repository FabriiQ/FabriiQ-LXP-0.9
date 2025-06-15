import { 
  type Prisma,
  PrismaClient,
  UserType,
  SystemStatus
} from '@prisma/client';
import { TRPCError } from "@trpc/server";
import { ServiceBase, ServiceOptions } from './service-base';
import { ACADEMIC_CYCLE_PERMISSIONS } from '../constants/permissions';
import { checkPermission } from '../middleware/authorization';
import { 
  CreateAcademicCycleInput,
  UpdateAcademicCycleInput,
  AcademicCycleFilters,
  AcademicCycleWithRelations,
  DATE_VALIDATION_RULES,
  AcademicCycleType
} from '../types/academic-calendar';

// Define academic cycle types for dropdown options
export const ACADEMIC_CYCLE_TYPES = Object.values(AcademicCycleType);

const academicCycleInclude = {
  terms: true,
  calendarEvents: true,
  creator: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  updater: {
    select: {
      id: true,
      name: true,
      email: true
    }
  }
} as const;

export class AcademicCycleService extends ServiceBase {
  constructor(options: ServiceOptions) {
    super(options);
  }

  /**
   * Validate academic cycle type
   */
  private validateType(type: string): boolean {
    return Object.values(AcademicCycleType).includes(type as AcademicCycleType);
  }

  /**
   * Create a new academic cycle
   */
  async createAcademicCycle(data: CreateAcademicCycleInput, userType: UserType) {
    if (!checkPermission(userType, ACADEMIC_CYCLE_PERMISSIONS.MANAGE_ACADEMIC_CYCLES)) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    // Validate dates
    if (data.startDate >= data.endDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Start date must be before end date"
      });
    }

    // Validate type
    if (!this.validateType(data.type)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Invalid academic cycle type. Must be one of: ${ACADEMIC_CYCLE_TYPES.join(", ")}`
      });
    }

    // Calculate duration in months
    const durationInMonths = Math.ceil(
      (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    // Check for duplicate code
    const existingCycle = await this.prisma.academicCycle.findFirst({
      where: {
        institutionId: data.institutionId,
        code: data.code,
        status: { not: "DELETED" }
      }
    });

    if (existingCycle) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "An academic cycle with this code already exists"
      });
    }

    // Create academic cycle
    const createData = {
      institutionId: data.institutionId,
      code: data.code,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      type: data.type,
      duration: durationInMonths,
      createdBy: data.createdBy,
      status: "ACTIVE" as const,
      ...(data.description !== undefined && { description: data.description })
    };

    return this.prisma.academicCycle.create({
      data: createData,
      include: academicCycleInclude
    });
  }

  /**
   * Get an academic cycle by ID
   */
  async getAcademicCycle(id: string) {
    const academicCycle = await this.prisma.academicCycle.findUnique({
      where: { id },
      include: academicCycleInclude
    });

    if (!academicCycle) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Academic cycle not found"
      });
    }

    return academicCycle;
  }

  /**
   * List academic cycles with pagination and filters
   */
  async listAcademicCycles(params: {
    institutionId: string;
    campusId?: string;
    userId: string;
    userType: UserType;
  }) {
    const { institutionId, campusId, userId, userType } = params;

    console.log('listAcademicCycles called with params:', {
      institutionId,
      campusId,
      userId,
      userType
    });

    // For debugging, let's first check if there are any academic cycles at all
    const allCycles = await this.prisma.academicCycle.findMany({
      take: 5, // Just get a few for debugging
    });
    
    console.log('Debug - All academic cycles (first 5):', allCycles);

    // Check permissions based on role
    if (checkPermission(userType, ACADEMIC_CYCLE_PERMISSIONS.VIEW_ALL_ACADEMIC_CYCLES)) {
      console.log('User has VIEW_ALL_ACADEMIC_CYCLES permission');
      
      // Build a where clause that works even if institutionId is empty
      const where: any = {};
      if (institutionId && institutionId !== '') {
        where.institutionId = institutionId;
      }
      
      // Institution admin can view all cycles
      const cycles = await this.prisma.academicCycle.findMany({
        where,
        include: { terms: true },
      });
      
      console.log(`Found ${cycles.length} academic cycles with where:`, where);
      return cycles;
    }

    if (checkPermission(userType, ACADEMIC_CYCLE_PERMISSIONS.VIEW_CAMPUS_ACADEMIC_CYCLES)) {
      // Campus admin/coordinator can view campus-specific cycles
      return this.prisma.academicCycle.findMany({
        where: {
          institutionId,
          terms: {
            some: {
              classes: {
                some: {
                  courseCampus: {
                    campusId,
                  },
                },
              },
            },
          },
        },
        include: { terms: true },
      });
    }

    // Teachers and students can view cycles related to their classes
    if (checkPermission(userType, ACADEMIC_CYCLE_PERMISSIONS.VIEW_CLASS_ACADEMIC_CYCLES)) {
      const userClasses = await this.getUserClasses(userId, userType);
      return this.prisma.academicCycle.findMany({
        where: {
          terms: {
            some: {
              classes: {
                some: {
                  id: { in: userClasses.map(c => c.id) },
                },
              },
            },
          },
        },
        include: { terms: true },
      });
    }

    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  private async getUserClasses(userId: string, userType: UserType) {
    if (userType === 'TEACHER' || userType === 'CAMPUS_TEACHER' as any) {
      return this.prisma.class.findMany({
        where: {
          teachers: {
            some: {
              teacherId: userId,
              status: 'ACTIVE',
            },
          },
        },
      });
    }

    if (userType === 'STUDENT' || userType === 'CAMPUS_STUDENT' as any) {
      return this.prisma.class.findMany({
        where: {
          students: {
            some: {
              studentId: userId,
              status: 'ACTIVE',
            },
          },
        },
      });
    }

    return [];
  }

  /**
   * Update an academic cycle
   */
  async updateAcademicCycle(id: string, data: UpdateAcademicCycleInput, userType: UserType) {
    if (!checkPermission(userType, ACADEMIC_CYCLE_PERMISSIONS.MANAGE_ACADEMIC_CYCLES)) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    const existingCycle = await this.getAcademicCycle(id);

    // Validate type if provided
    if (data.type && !this.validateType(data.type)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Invalid academic cycle type. Must be one of: ${ACADEMIC_CYCLE_TYPES.join(", ")}`
      });
    }

    if (data.startDate || data.endDate) {
      const startDate = data.startDate || existingCycle.startDate;
      const endDate = data.endDate || existingCycle.endDate;

      if (startDate >= endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date"
        });
      }

      // Check for overlapping cycles
      const overlappingCycle = await this.prisma.academicCycle.findFirst({
        where: {
          id: { not: id },
          institutionId: existingCycle.institutionId,
          status: "ACTIVE",
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate }
            }
          ]
        }
      });

      if (overlappingCycle) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Date range overlaps with an existing academic cycle"
        });
      }
    }

    const updateData = {
      ...(data.code && { code: data.code }),
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.startDate && { startDate: data.startDate }),
      ...(data.endDate && { endDate: data.endDate }),
      ...(data.type && { type: data.type }),
      ...(data.status && { status: data.status }),
      updatedBy: data.updatedBy
    };

    if (data.startDate && data.endDate) {
      const duration = Math.ceil(
        (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      Object.assign(updateData, { duration });
    }

    return this.prisma.academicCycle.update({
      where: { id },
      data: updateData,
      include: academicCycleInclude
    });
  }

  /**
   * Delete an academic cycle
   */
  async deleteAcademicCycle(id: string) {
    const academicCycle = await this.getAcademicCycle(id);

    // Check if there are any active terms
    const activeTerms = await this.prisma.term.count({
      where: {
        academicCycleId: id,
        status: "ACTIVE"
      }
    });

    if (activeTerms > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete academic cycle with active terms"
      });
    }

    // Soft delete the academic cycle
    return this.prisma.academicCycle.update({
      where: { id },
      data: {
        status: "DELETED"
      }
    });
  }

  /**
   * Get the current active academic cycle
   */
  async getCurrentAcademicCycle(institutionId: string) {
    const now = new Date();
    
    return this.prisma.academicCycle.findFirst({
      where: {
        institutionId,
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: academicCycleInclude
    });
  }

  /**
   * Get academic cycles by date range
   */
  async getAcademicCyclesByDateRange(params: {
    institutionId: string;
    startDate: Date;
    endDate: Date;
    type?: AcademicCycleType;
  }) {
    // Validate type if provided
    if (params.type && !this.validateType(params.type)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Invalid academic cycle type. Must be one of: ${ACADEMIC_CYCLE_TYPES.join(", ")}`
      });
    }

    return this.prisma.academicCycle.findMany({
      where: {
        institutionId: params.institutionId,
        status: "ACTIVE",
        startDate: { lte: params.endDate },
        endDate: { gte: params.startDate },
        ...(params.type && { type: params.type })
      },
      include: academicCycleInclude,
      orderBy: { startDate: 'asc' }
    });
  }

  /**
   * Get upcoming academic cycles
   */
  async getUpcomingCycles(params: {
    institutionId: string;
    limit?: number;
    type?: AcademicCycleType;
  }) {
    // Validate type if provided
    if (params.type && !this.validateType(params.type)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Invalid academic cycle type. Must be one of: ${ACADEMIC_CYCLE_TYPES.join(", ")}`
      });
    }

    const now = new Date();
    return this.prisma.academicCycle.findMany({
      where: {
        institutionId: params.institutionId,
        status: "ACTIVE",
        startDate: { gt: now },
        ...(params.type && { type: params.type })
      },
      include: academicCycleInclude,
      orderBy: { startDate: 'asc' },
      take: params.limit || 5
    });
  }
} 
