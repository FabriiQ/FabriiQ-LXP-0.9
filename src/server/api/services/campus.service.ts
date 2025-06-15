import { TRPCError } from "@trpc/server";
import { type PrismaClient, SystemStatus as PrismaSystemStatus, Prisma, FacilityType } from "@prisma/client";
import { SystemStatus, UserType } from "../constants";
import type { PaginationInput, BaseFilters } from "../types";

interface CampusServiceConfig {
  prisma: PrismaClient;
}

export interface CreateCampusInput {
  code: string;
  name: string;
  institutionId: string;
  status?: SystemStatus;
  address: Record<string, any>;
  contact: Record<string, any>;
}

export interface UpdateCampusInput {
  name?: string;
  status?: SystemStatus;
  address?: Record<string, any>;
  contact?: Record<string, any>;
}

export interface CampusFilters extends BaseFilters {
  institutionId?: string;
}

export interface CampusClassFilters {
  programId?: string;
  termId?: string;
  status?: SystemStatus;
  search?: string;
}

export interface CampusUserFilters {
  roleType?: UserType;
  status?: SystemStatus;
  search?: string;
}

export interface CampusFacilityFilters {
  type?: FacilityType;
  status?: SystemStatus;
  search?: string;
}

export interface CampusProgramFilters {
  status?: SystemStatus;
  search?: string;
}

export class CampusService {
  private prisma: PrismaClient;

  constructor(config: CampusServiceConfig) {
    this.prisma = config.prisma;
  }

  /**
   * Create a new campus
   */
  async createCampus(input: CreateCampusInput) {
    // Check if institution exists
    const institution = await this.prisma.institution.findUnique({
      where: { id: input.institutionId },
    });

    if (!institution) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Institution not found",
      });
    }

    // Check for existing campus with same code
    const existing = await this.prisma.campus.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Campus with this code already exists",
      });
    }

    // Create campus
    const campus = await this.prisma.campus.create({
      data: {
        code: input.code,
        name: input.name,
        institutionId: input.institutionId,
        status: input.status || "ACTIVE",
        address: input.address,
        contact: input.contact,
      },
    });

    return campus;
  }

  /**
   * Get campus by ID with related counts
   */
  async getCampus(id: string) {
    const campus = await this.prisma.campus.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userAccess: true,
            programs: true,
            facilities: true,
            features: true,
          },
        },
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!campus) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campus not found",
      });
    }

    return campus;
  }

  /**
   * Get paginated list of campuses
   */
  async listCampuses(
    pagination: PaginationInput,
    filters?: BaseFilters & { institutionId?: string },
  ) {
    const { page = 1, pageSize = 10, sortBy, sortOrder } = pagination;
    const { search, status, institutionId } = filters || {};

    const where = {
      status: status as PrismaSystemStatus,
      institutionId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
          { code: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
        ],
      }),
    };

    const [total, items] = await Promise.all([
      this.prisma.campus.count({ where }),
      this.prisma.campus.findMany({
        where,
        include: {
          _count: {
            select: {
              userAccess: true,
              programs: true,
              facilities: true,
            },
          },
          institution: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: sortBy ? { [sortBy]: sortOrder || "asc" } : { createdAt: "desc" },
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
   * Update campus
   */
  async updateCampus(id: string, input: UpdateCampusInput) {
    const campus = await this.prisma.campus.findUnique({
      where: { id },
    });

    if (!campus) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campus not found",
      });
    }

    const updated = await this.prisma.campus.update({
      where: { id },
      data: {
        name: input.name,
        status: input.status,
        address: input.address,
        contact: input.contact,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Delete campus
   */
  async deleteCampus(id: string) {
    const campus = await this.prisma.campus.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userAccess: true,
            programs: true,
            facilities: true,
            features: true,
          },
        },
      },
    });

    if (!campus) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campus not found",
      });
    }

    // Check if campus has any dependencies
    if (
      campus._count.userAccess > 0 ||
      campus._count.programs > 0 ||
      campus._count.facilities > 0 ||
      campus._count.features > 0
    ) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Cannot delete campus with existing dependencies",
      });
    }

    await this.prisma.campus.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Get campus statistics
   */
  async getCampusStats(id: string) {
    const campus = await this.prisma.campus.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userAccess: true,
            programs: true,
            facilities: true,
            features: true,
          },
        },
      },
    });

    if (!campus) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campus not found",
      });
    }

    // Get additional stats
    const [activeTeachers, activeStudents, activeClasses] = await Promise.all([
      this.prisma.userCampusAccess.count({
        where: {
          campusId: id,
          roleType: UserType.CAMPUS_TEACHER,
          status: PrismaSystemStatus.ACTIVE,
        },
      }),
      this.prisma.userCampusAccess.count({
        where: {
          campusId: id,
          roleType: UserType.CAMPUS_STUDENT,
          status: PrismaSystemStatus.ACTIVE,
        },
      }),
      this.prisma.class.count({
        where: {
          courseCampus: {
            campusId: id,
          },
          status: PrismaSystemStatus.ACTIVE,
        },
      }),
    ]);

    return {
      id: campus.id,
      name: campus.name,
      code: campus.code,
      stats: {
        programs: campus._count.programs,
        facilities: campus._count.facilities,
        users: campus._count.userAccess,
        features: campus._count.features,
        teachers: activeTeachers,
        students: activeStudents,
        classes: activeClasses,
      },
    };
  }

  /**
   * Get campus classes with pagination and filtering
   */
  async getCampusClasses(
    campusId: string,
    pagination: PaginationInput,
    filters?: CampusClassFilters
  ) {
    const { page = 1, pageSize = 10, sortBy, sortOrder } = pagination;
    const { programId, termId, status, search } = filters || {};

    // Verify campus exists
    const campus = await this.prisma.campus.findUnique({
      where: { id: campusId },
    });

    if (!campus) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campus not found",
      });
    }

    // Build where clause for classes
    const where: Prisma.ClassWhereInput = {
      status: status as PrismaSystemStatus || PrismaSystemStatus.ACTIVE,
      courseCampus: {
        campusId,
      },
      ...(programId && {
        programCampusId: {
          equals: programId,
        },
      }),
      ...(termId && {
        termId: {
          equals: termId,
        },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
          { code: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
        ],
      }),
    };

    // Get total count and paginated items
    const [total, items] = await Promise.all([
      this.prisma.class.count({ where }),
      this.prisma.class.findMany({
        where,
        include: {
          courseCampus: {
            include: {
              course: true,
              campus: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          term: true,
          classTeacher: {
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
          facility: true,
          programCampus: {
            include: {
              program: true,
            },
          },
          _count: {
            select: {
              students: true,
              teachers: true,
              activities: true,
              assessments: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: sortBy ? { [sortBy]: sortOrder || "asc" } : { createdAt: "desc" },
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
   * Get campus teachers with pagination and filtering
   */
  async getCampusTeachers(
    campusId: string,
    pagination: PaginationInput,
    filters?: CampusUserFilters
  ) {
    const { page = 1, pageSize = 10, sortBy, sortOrder } = pagination;
    const { status, search } = filters || {};

    // Verify campus exists
    const campus = await this.prisma.campus.findUnique({
      where: { id: campusId },
    });

    if (!campus) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campus not found",
      });
    }

    // Build where clause for teachers
    const where: Prisma.UserCampusAccessWhereInput = {
      campusId,
      roleType: UserType.CAMPUS_TEACHER,
      status: status as PrismaSystemStatus || PrismaSystemStatus.ACTIVE,
      ...(search && {
        user: {
          OR: [
            { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
            { email: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
          ],
        },
      }),
    };

    // Get total count and paginated items
    const [total, items] = await Promise.all([
      this.prisma.userCampusAccess.count({ where }),
      this.prisma.userCampusAccess.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              userType: true,
              createdAt: true,
              updatedAt: true,
              teacherProfile: {
                select: {
                  id: true,
                  qualifications: true,
                  specialization: true,
                  _count: {
                    select: {
                      classesAsTeacher: true,
                      assignments: true,
                      subjectQualifications: true,
                    },
                  },
                },
              },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: sortBy 
          ? sortBy.startsWith('user.') 
            ? { user: { [sortBy.replace('user.', '')]: sortOrder || "asc" } } 
            : { [sortBy]: sortOrder || "asc" } 
          : { createdAt: "desc" },
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
   * Get campus facilities with pagination and filtering
   */
  async getCampusFacilities(
    campusId: string,
    pagination: PaginationInput,
    filters?: CampusFacilityFilters
  ) {
    const { page = 1, pageSize = 10, sortBy, sortOrder } = pagination;
    const { type, status, search } = filters || {};

    // Verify campus exists
    const campus = await this.prisma.campus.findUnique({
      where: { id: campusId },
    });

    if (!campus) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campus not found",
      });
    }

    // Build where clause for facilities
    const where: Prisma.FacilityWhereInput = {
      OR: filters?.search
        ? [
            {
              name: {
                contains: filters.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              code: {
                contains: filters.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ]
        : undefined,
      type: filters?.type ? { equals: filters.type } : undefined,
      campusId,
      status: SystemStatus.ACTIVE,
    };

    // Get total count and paginated items
    const [total, items] = await Promise.all([
      this.prisma.facility.count({ where }),
      this.prisma.facility.findMany({
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
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: sortBy ? { [sortBy]: sortOrder || "asc" } : { createdAt: "desc" },
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
   * Get campus programs with pagination and filtering
   */
  async getCampusPrograms(
    campusId: string,
    pagination: PaginationInput,
    filters?: CampusProgramFilters
  ) {
    const { page = 1, pageSize = 10, sortBy, sortOrder } = pagination;
    const { status, search } = filters || {};

    // Verify campus exists
    const campus = await this.prisma.campus.findUnique({
      where: { id: campusId },
    });

    if (!campus) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campus not found",
      });
    }

    // Build where clause for program campuses
    const where: Prisma.ProgramCampusWhereInput = {
      campusId,
      status: status as PrismaSystemStatus || PrismaSystemStatus.ACTIVE,
      ...(search && {
        program: {
          OR: [
            { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
            { code: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
          ],
        },
      }),
    };

    // Get total count and paginated items
    const [total, items] = await Promise.all([
      this.prisma.programCampus.count({ where }),
      this.prisma.programCampus.findMany({
        where,
        include: {
          program: true,
          _count: {
            select: {
              classes: true,
              courseOfferings: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: sortBy 
          ? sortBy.startsWith('program.') 
            ? { program: { [sortBy.replace('program.', '')]: sortOrder || "asc" } } 
            : { [sortBy]: sortOrder || "asc" } 
          : { createdAt: "desc" },
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
   * Associate a program with a campus
   */
  async assignProgramToCampus(
    campusId: string, 
    programId: string, 
    startDate: Date, 
    endDate?: Date
  ) {
    // Verify campus exists
    const campus = await this.prisma.campus.findUnique({
      where: { id: campusId },
    });

    if (!campus) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campus not found",
      });
    }

    // Verify program exists
    const program = await this.prisma.program.findUnique({
      where: { id: programId },
    });

    if (!program) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Program not found",
      });
    }

    // Check if association already exists
    const existingAssociation = await this.prisma.programCampus.findUnique({
      where: {
        programId_campusId: {
          programId,
          campusId,
        },
      },
    });

    if (existingAssociation) {
      // Update existing association
      const updated = await this.prisma.programCampus.update({
        where: { id: existingAssociation.id },
        data: {
          startDate,
          endDate,
          status: PrismaSystemStatus.ACTIVE,
        },
        include: {
          program: true,
          campus: true,
        },
      });

      return updated;
    }

    // Create new association
    const created = await this.prisma.programCampus.create({
      data: {
        program: {
          connect: { id: programId },
        },
        campus: {
          connect: { id: campusId },
        },
        startDate,
        endDate,
        status: PrismaSystemStatus.ACTIVE,
      },
      include: {
        program: true,
        campus: true,
      },
    });

    return created;
  }

  /**
   * Remove a program from a campus
   */
  async removeProgramFromCampus(campusId: string, programId: string) {
    // Check if association exists
    const association = await this.prisma.programCampus.findUnique({
      where: {
        programId_campusId: {
          programId,
          campusId,
        },
      },
      include: {
        _count: {
          select: {
            classes: true,
            courseOfferings: true,
          },
        },
      },
    });

    if (!association) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Program is not associated with this campus",
      });
    }

    // Check if there are dependencies
    if (association._count.classes > 0 || association._count.courseOfferings > 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Cannot remove program with existing classes or course offerings",
      });
    }

    // Delete the association
    await this.prisma.programCampus.delete({
      where: { id: association.id },
    });

    return { success: true };
  }

  /**
   * Get campus students with pagination and filtering
   */
  async getCampusStudents(
    campusId: string,
    pagination: PaginationInput,
    filters?: CampusUserFilters
  ) {
    const { page = 1, pageSize = 10, sortBy, sortOrder } = pagination;
    const { status, search } = filters || {};

    // Verify campus exists
    const campus = await this.prisma.campus.findUnique({
      where: { id: campusId },
    });

    if (!campus) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campus not found",
      });
    }

    // Build where clause for students
    const where: Prisma.UserCampusAccessWhereInput = {
      campusId,
      roleType: UserType.CAMPUS_STUDENT,
      status: status as PrismaSystemStatus || PrismaSystemStatus.ACTIVE,
      ...(search && {
        user: {
          OR: [
            { name: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
            { email: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
          ],
        },
      }),
    };

    // Get total count and paginated items
    const [total, items] = await Promise.all([
      this.prisma.userCampusAccess.count({ where }),
      this.prisma.userCampusAccess.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              userType: true,
              createdAt: true,
              updatedAt: true,
              studentProfile: {
                select: {
                  id: true,
                  enrollments: true,
                  _count: {
                    select: {
                      grades: true,
                      enrollments: true,
                    },
                  },
                },
              },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: sortBy 
          ? sortBy.startsWith('user.') 
            ? { user: { [sortBy.replace('user.', '')]: sortOrder || "asc" } } 
            : { [sortBy]: sortOrder || "asc" } 
          : { createdAt: "desc" },
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

  async createProgramCampus(data: {
    programId: string;
    campusId: string;
  }) {
    try {
      // First create the program campus
      const programCampus = await this.prisma.programCampus.create({
        data: {
          program: { connect: { id: data.programId } },
          campus: { connect: { id: data.campusId } },
          status: SystemStatus.ACTIVE,
        },
        include: {
          program: true,
        },
      });

      // Get all active courses for this program
      const programCourses = await this.prisma.course.findMany({
        where: {
          programId: data.programId,
          status: SystemStatus.ACTIVE,
        },
      });

      // Create course campus entries for each course
      const courseCampusPromises = programCourses.map(course =>
        this.prisma.courseCampus.create({
          data: {
            course: { connect: { id: course.id } },
            campus: { connect: { id: data.campusId } },
            programCampus: { connect: { id: programCampus.id } },
            status: SystemStatus.ACTIVE,
          },
        })
      );

      await Promise.all(courseCampusPromises);

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

  async syncCourseCampuses(campusId: string) {
    try {
      // Get all active program campuses
      const programCampuses = await this.prisma.programCampus.findMany({
        where: {
          campusId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          program: {
            include: {
              courses: {
                where: {
                  status: SystemStatus.ACTIVE,
                },
              },
            },
          },
        },
      });

      for (const programCampus of programCampuses) {
        for (const course of programCampus.program.courses) {
          // Check if course campus already exists
          const existingCourseCampus = await this.prisma.courseCampus.findFirst({
            where: {
              courseId: course.id,
              campusId,
              programCampusId: programCampus.id,
            },
          });

          if (!existingCourseCampus) {
            await this.prisma.courseCampus.create({
              data: {
                course: { connect: { id: course.id } },
                campus: { connect: { id: campusId } },
                programCampus: { connect: { id: programCampus.id } },
                status: SystemStatus.ACTIVE,
              },
            });
          }
        }
      }

      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to sync course campuses",
        cause: error,
      });
    }
  }
}


