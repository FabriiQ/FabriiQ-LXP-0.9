/**
 * Institution Service
 * Handles institution management operations
 */

import { TRPCError } from "@trpc/server";
import { type PrismaClient, SystemStatus, Prisma } from "@prisma/client";
import type { PaginationInput, BaseFilters } from "../types/common";

interface InstitutionServiceConfig {
  prisma: PrismaClient;
}

interface CreateInstitutionInput {
  code: string;
  name: string;
  status?: SystemStatus;
}

interface UpdateInstitutionInput {
  name?: string;
  status?: SystemStatus;
}

export class InstitutionService {
  private prisma: PrismaClient;

  constructor(config: InstitutionServiceConfig) {
    this.prisma = config.prisma;
  }

  /**
   * Create a new institution
   */
  async createInstitution(input: CreateInstitutionInput) {
    // Check for existing institution with same code
    const existing = await this.prisma.institution.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Institution with this code already exists",
      });
    }

    // Create institution
    const institution = await this.prisma.institution.create({
      data: {
        code: input.code,
        name: input.name,
        status: input.status || SystemStatus.ACTIVE,
      },
    });

    return institution;
  }

  /**
   * Get institution by ID
   */
  async getInstitution(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        campuses: true,
        programs: true,
        users: true,
        _count: {
          select: {
            campuses: true,
            programs: true,
            users: true
          }
        }
      },
    });

    if (!institution) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Institution not found",
      });
    }

    return institution;
  }

  /**
   * Get paginated list of institutions
   */
  async listInstitutions(
    pagination: PaginationInput,
    filters?: BaseFilters,
  ) {
    const { page = 1, pageSize = 10 } = pagination;
    const { search, status } = filters || {};

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.InstitutionWhereInput = {
      status,
      ...(search && {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { code: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
    };

    const [total, items] = await Promise.all([
      this.prisma.institution.count({ where }),
      this.prisma.institution.findMany({
        where,
        include: {
          _count: {
            select: {
              campuses: true,
            },
          },
        },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: total > page * pageSize,
    };
  }

  /**
   * Update institution
   */
  async updateInstitution(id: string, input: UpdateInstitutionInput) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!institution) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Institution not found",
      });
    }

    const updated = await this.prisma.institution.update({
      where: { id },
      data: {
        name: input.name,
        status: input.status,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Delete institution
   */
  async deleteInstitution(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            campuses: true,
            users: true,
            programs: true,
          },
        },
      },
    });

    if (!institution) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Institution not found",
      });
    }

    // Check if institution has any dependencies
    if (
      institution._count.campuses > 0 ||
      institution._count.users > 0 ||
      institution._count.programs > 0
    ) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Cannot delete institution with existing dependencies",
      });
    }

    await this.prisma.institution.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Get institution statistics
   */
  async getInstitutionStats(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            campuses: true,
            users: true,
            programs: true,
            assessmentTemplates: true,
          },
        },
        users: {
          select: {
            userType: true,
          },
        },
      },
    });

    if (!institution) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Institution not found",
      });
    }

    // Calculate user type distribution
    const userTypeDistribution = institution.users.reduce(
      (acc: Record<string, number>, user: { userType: string }) => {
        acc[user.userType] = (acc[user.userType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      counts: institution._count,
      userTypeDistribution,
    };
  }
} 