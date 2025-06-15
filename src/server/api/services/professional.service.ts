import { TRPCError } from "@trpc/server";
import { prisma } from '../../db';
import { SystemStatus } from '../constants';
import type { PaginationInput, BaseFilters } from "../types";
import { Prisma } from "@prisma/client";

type Training = {
  id: string;
  teacherId: string;
  type: string;
  title: string;
  provider: string;
  startDate: Date;
  endDate: Date | null;
  status: SystemStatus;
  certification: any | null;
  capacity?: number;
  enrollments?: any[];
};

interface ProfessionalDevelopment {
  id: string;
  teacherId: string;
  type: string;
  title: string;
  provider: string;
  startDate: Date;
  endDate: Date | null;
  certification: any | null;
  status: SystemStatus;
  createdAt: Date;
  updatedAt: Date;
  capacity?: number;
  enrollments?: any[];
}

interface ProfessionalDevelopmentEnrollment {
  id: string;
  trainingId: string;
  teacherId: string;
  status: 'ENROLLED' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
  teacher: {
    id: string;
    name: string;
  };
}

export type ProfessionalDevelopmentInput = Omit<Training, 'id' | 'status'>;

interface CreateTrainingInput {
  teacherId: string;
  type: string;
  title: string;
  provider: string;
  startDate: Date;
  endDate?: Date;
  certification?: Record<string, unknown>;
  status?: SystemStatus;
  capacity?: number;
}

interface UpdateTrainingInput {
  type?: string;
  title?: string;
  provider?: string;
  startDate?: Date;
  endDate?: Date;
  certification?: Record<string, unknown>;
  status?: SystemStatus;
  capacity?: number;
}

interface ProfessionalDevelopmentWithEnrollments extends ProfessionalDevelopment {
  enrollments: (ProfessionalDevelopmentEnrollment & {
    teacher: {
      id: string;
      name: string;
    };
  })[];
}

export class ProfessionalService {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Create a new professional development record
   */
  async createTraining(data: ProfessionalDevelopmentInput) {
    // Create training
    return this.prisma.professionalDevelopment.create({
      data: {
        teacherId: data.teacherId,
        type: data.type,
        title: data.title,
        provider: data.provider,
        startDate: data.startDate,
        endDate: data.endDate || null,
        certification: data.certification ? Prisma.JsonNull : Prisma.JsonNull,
        status: 'ACTIVE',
        // Note: capacity is not in the Prisma schema, so we'll need to add it if needed
      }
    });
  }

  /**
   * Get professional development record by ID
   */
  async getTraining(id: string) {
    const training = await this.prisma.professionalDevelopment.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!training) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Training not found'
      });
    }

    return training;
  }

  /**
   * Get paginated list of professional development records
   */
  async listTrainings(params: {
    teacherId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    status?: SystemStatus;
    skip?: number;
    take?: number;
  }) {
    const { teacherId, type, startDate, endDate, status, skip = 0, take = 10 } = params;

    const where = {
      ...(teacherId && { teacherId }),
      ...(type && { type }),
      ...(startDate && { startDate: { gte: startDate } }),
      ...(endDate && { endDate: { lte: endDate } }),
      ...(status && { status }),
    };

    const [total, items] = await Promise.all([
      this.prisma.professionalDevelopment.count({ where }),
      this.prisma.professionalDevelopment.findMany({
        where,
        skip,
        take,
        orderBy: { startDate: 'desc' },
        include: {
          teacher: {
            select: {
              id: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
    ]);

    return { total, items };
  }

  /**
   * Update professional development record
   */
  async updateTraining(id: string, data: Partial<ProfessionalDevelopmentInput> & { status?: SystemStatus }) {
    const training = await this.prisma.professionalDevelopment.findUnique({
      where: { id }
    });

    if (!training) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Training not found'
      });
    }

    return this.prisma.professionalDevelopment.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.title && { title: data.title }),
        ...(data.provider && { provider: data.provider }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate && { endDate: data.endDate }),
        ...(data.certification && { certification: Prisma.JsonNull }),
        ...(data.status && { status: data.status }),
        // Note: capacity is not in the Prisma schema
      }
    });
  }

  /**
   * Delete professional development record
   */
  async deleteTraining(id: string) {
    const training = await this.prisma.professionalDevelopment.findUnique({
      where: { id }
    });

    if (!training) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Training not found'
      });
    }

    return this.prisma.professionalDevelopment.update({
      where: { id },
      data: { status: 'DELETED' }
    });
  }

  /**
   * Get teacher's professional development statistics
   */
  async getTeacherStats(teacherId: string) {
    const trainings = await this.prisma.professionalDevelopment.findMany({
      where: {
        teacherId,
        status: 'ACTIVE'
      }
    });

    // Convert Prisma types to our internal types for processing
    const typedTrainings = trainings.map(t => ({
      ...t,
      status: t.status as unknown as SystemStatus
    }));

    const totalHours = typedTrainings.reduce((acc: number, curr) => {
      if (!curr.endDate) return acc;
      const start = new Date(curr.startDate);
      const end = new Date(curr.endDate);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return acc + hours;
    }, 0);

    return {
      totalTrainings: typedTrainings.length,
      totalHours: Math.round(totalHours * 100) / 100,
      completedTrainings: typedTrainings.filter(t => t.endDate && new Date(t.endDate) < new Date()).length
    };
  }

  async enrollTeacher(trainingId: string, teacherId: string) {
    const training = await this.prisma.professionalDevelopment.findUnique({
      where: { id: trainingId }
    });

    if (!training) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Training not found'
      });
    }

    // Since there's no professionalDevelopmentEnrollment model in Prisma schema,
    // we would need to implement this differently or add the model to the schema
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: 'Enrollment functionality is not implemented yet'
    });
  }

  async updateEnrollmentStatus(enrollmentId: string, status: 'ENROLLED' | 'COMPLETED' | 'CANCELLED') {
    // Since there's no professionalDevelopmentEnrollment model in Prisma schema,
    // we would need to implement this differently or add the model to the schema
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: 'Enrollment status update functionality is not implemented yet'
    });
  }
} 