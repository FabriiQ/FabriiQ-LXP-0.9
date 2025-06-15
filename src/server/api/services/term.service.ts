import { TRPCError } from "@trpc/server";
import { 
  SystemStatus,
  type Prisma,
  PrismaClient 
} from '@prisma/client';
import {
  TermWithRelations,
  TermType,
  TermPeriod
} from '../types/academic-calendar';
import { ServiceBase, ServiceOptions } from './service-base';

export class TermService extends ServiceBase {
  private validPeriodsByType: Record<TermType, TermPeriod[]> = {
    [TermType.SEMESTER]: [TermPeriod.FALL, TermPeriod.SPRING],
    [TermType.TRIMESTER]: [TermPeriod.FIRST_TRIMESTER, TermPeriod.SECOND_TRIMESTER, TermPeriod.THIRD_TRIMESTER],
    [TermType.QUARTER]: [TermPeriod.FIRST_QUARTER, TermPeriod.SECOND_QUARTER, TermPeriod.THIRD_QUARTER, TermPeriod.FOURTH_QUARTER],
    [TermType.THEME_BASED]: [TermPeriod.THEME_UNIT],
    [TermType.CUSTOM]: [TermPeriod.SUMMER, TermPeriod.WINTER]
  };

  constructor(options: ServiceOptions) {
    super(options);
  }

  /**
   * Creates a new term
   */
  async create(data: Prisma.TermCreateInput) {
    return this.prisma.term.create({
      data: {
        ...data,
        termPeriod: data.termPeriod,
        status: SystemStatus.ACTIVE,
      }
    });
  }

  /**
   * Creates a new term - alias for create to match router
   */
  async createTerm(data: Prisma.TermCreateInput) {
    return this.create(data);
  }

  /**
   * Updates an existing term
   */
  async update(id: string, data: Prisma.TermUpdateInput) {
    return this.prisma.term.update({
      where: { id },
      data: {
        ...data,
        termPeriod: data.termPeriod ? { set: data.termPeriod as TermPeriod } : undefined,
        status: data.status ? { set: data.status as SystemStatus } : undefined,
      }
    });
  }

  /**
   * Updates an existing term - alias for update to match router
   */
  async updateTerm(id: string, data: Prisma.TermUpdateInput) {
    return this.update(id, data);
  }

  /**
   * Lists terms based on filters
   */
  async findMany(filters: Prisma.TermWhereInput) {
    return this.prisma.term.findMany({
      where: {
        ...filters,
        status: filters.status ? { equals: filters.status as SystemStatus } : undefined,
        termPeriod: filters.termPeriod ? { equals: filters.termPeriod as TermPeriod } : undefined,
      }
    });
  }

  /**
   * Lists terms with pagination - alias for findMany to match router
   */
  async listTerms(filters: Prisma.TermWhereInput, skip?: number, take?: number) {
    const terms = await this.prisma.term.findMany({
      where: {
        ...filters,
        status: filters.status ? { equals: filters.status as SystemStatus } : undefined,
        termPeriod: filters.termPeriod ? { equals: filters.termPeriod as TermPeriod } : undefined,
      },
      skip,
      take,
      orderBy: { startDate: 'desc' }
    });

    const total = await this.prisma.term.count({
      where: {
        ...filters,
        status: filters.status ? { equals: filters.status as SystemStatus } : undefined,
        termPeriod: filters.termPeriod ? { equals: filters.termPeriod as TermPeriod } : undefined,
      }
    });

    return { terms, total };
  }

  /**
   * Gets a term by ID
   */
  async getById(id: string): Promise<TermWithRelations | null> {
    return this.prisma.term.findUnique({
      where: { id },
      include: {
        course: true,
        academicCycle: true,
        classes: true,
        assessments: true
      }
    });
  }

  /**
   * Gets a term by ID - alias for getById to match router
   */
  async getTerm(id: string): Promise<TermWithRelations | null> {
    return this.getById(id);
  }

  /**
   * Deletes a term
   */
  async delete(id: string): Promise<void> {
    const term = await this.prisma.term.findUnique({
      where: { id }
    });

    if (!term) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Term not found"
      });
    }

    await this.prisma.term.update({
      where: { id },
      data: { status: SystemStatus.DELETED }
    });
  }

  /**
   * Deletes a term - alias for delete to match router
   */
  async deleteTerm(id: string): Promise<void> {
    return this.delete(id);
  }

  private validateTermTypeAndPeriod(type: TermType, period: TermPeriod) {
    const validPeriods = this.validPeriodsByType[type];
    
    if (!validPeriods?.includes(period)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Invalid period "${period}" for term type "${type}"`
      });
    }
  }

  private validateTermDates(startDate: Date, endDate: Date) {
    if (startDate >= endDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Term end date must be after start date"
      });
    }
  }
} 
