import { TRPCError } from "@trpc/server";
import { prisma } from '../../db';
import { SystemStatus, FeedbackType, FeedbackSeverity, FeedbackStatus } from "../constants";
import type { PaginationInput, BaseFilters } from "../types";
import type { ServiceConfig } from "../types/prisma";
import { Prisma } from "@prisma/client";

interface CreateFeedbackInput {
  type: FeedbackType;
  severity: FeedbackSeverity;
  title: string;
  description: string;
  createdById: string;
  classId?: string;
  academicCycle?: string;
  term?: string;
  tags?: string[];
  attachments?: Prisma.InputJsonValue;
  studentId?: string;
  teacherId?: string;
}

interface UpdateFeedbackInput {
  type?: FeedbackType;
  severity?: FeedbackSeverity;
  title?: string;
  description?: string;
  academicCycle?: string;
  term?: string;
  tags?: string[];
  attachments?: Prisma.InputJsonValue;
  status?: SystemStatus;
}

interface CreateResponseInput {
  content: string;
  responderId: string;
  attachments?: Prisma.InputJsonValue;
}

export class FeedbackService {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Create a new feedback
   */
  async createFeedback(input: CreateFeedbackInput) {
    // Create base feedback
    const feedbackBase = await this.prisma.feedbackBase.create({
      data: {
        type: input.type,
        severity: input.severity,
        title: input.title,
        description: input.description,
        createdBy: { connect: { id: input.createdById } },
        ...(input.classId && { class: { connect: { id: input.classId } } }),
        academicCycle: input.academicCycle,
        term: input.term,
        tags: input.tags || [],
        attachments: input.attachments as Prisma.InputJsonValue,
        status: SystemStatus.ACTIVE,
      },
    });

    // Create specific feedback type
    if (input.studentId) {
      await this.prisma.studentFeedback.create({
        data: {
          student: { connect: { id: input.studentId } },
          feedbackBase: { connect: { id: feedbackBase.id } },
        },
      });
    } else if (input.teacherId) {
      await this.prisma.teacherFeedback.create({
        data: {
          teacher: { connect: { id: input.teacherId } },
          feedbackBase: { connect: { id: feedbackBase.id } },
        },
      });
    }

    return feedbackBase;
  }

  /**
   * Get feedback by ID
   */
  async getFeedback(id: string) {
    const feedback = await this.prisma.feedbackBase.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
        class: {
          select: {
            name: true,
          },
        },
        studentFeedback: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            responses: {
              include: {
                responder: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        teacherFeedback: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            responses: {
              include: {
                responder: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!feedback) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Feedback not found",
      });
    }

    return feedback;
  }

  /**
   * List feedback with pagination and filters
   */
  async listFeedback(
    pagination: PaginationInput,
    filters?: BaseFilters & {
      type?: FeedbackType;
      severity?: FeedbackSeverity;
      classId?: string;
      studentId?: string;
      teacherId?: string;
      status?: SystemStatus;
    },
  ) {
    const { page = 1, pageSize = 10, sortBy = "createdAt", sortOrder = "desc" } = pagination;
    const { search, ...restFilters } = filters || {};

    // Build where clause
    const where: Prisma.FeedbackBaseWhereInput = {
      // Add teacher/student specific filters
      ...(restFilters?.teacherId && {
        teacherFeedback: {
          teacherId: restFilters.teacherId,
        },
      }),
      ...(restFilters?.studentId && {
        studentFeedback: {
          studentId: restFilters.studentId,
        },
      }),
      // Add search functionality
      ...(search && {
        OR: [
          {
            title: {
              contains: search,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
        ],
      }),
      // Add other filters
      ...(restFilters?.status && { status: restFilters.status as SystemStatus }),
      ...(restFilters?.type && { type: restFilters.type }),
      ...(restFilters?.severity && { severity: restFilters.severity }),
      ...(restFilters?.classId && { classId: restFilters.classId }),
    };

    const [total, items] = await Promise.all([
      this.prisma.feedbackBase.count({ where }),
      this.prisma.feedbackBase.findMany({
        where,
        include: {
          createdBy: {
            select: {
              name: true,
            },
          },
          class: {
            select: {
              name: true,
            },
          },
          studentFeedback: {
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          teacherFeedback: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
   * Update feedback
   */
  async updateFeedback(id: string, input: UpdateFeedbackInput) {
    const feedback = await this.prisma.feedbackBase.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Feedback not found",
      });
    }

    const updatedFeedback = await this.prisma.feedbackBase.update({
      where: { id },
      data: {
        type: input.type,
        severity: input.severity,
        title: input.title,
        description: input.description,
        academicCycle: input.academicCycle,
        term: input.term,
        tags: input.tags,
        attachments: input.attachments as Prisma.InputJsonValue,
        status: input.status as SystemStatus,
      },
    });

    return updatedFeedback;
  }

  /**
   * Add response to feedback
   */
  async addResponse(feedbackId: string, input: CreateResponseInput) {
    const feedback = await this.prisma.feedbackBase.findUnique({
      where: { id: feedbackId },
      include: {
        studentFeedback: true,
        teacherFeedback: true,
      },
    });

    if (!feedback) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Feedback not found",
      });
    }

    const response = await this.prisma.feedbackResponse.create({
      data: {
        content: input.content,
        responder: { connect: { id: input.responderId } },
        attachments: input.attachments as Prisma.InputJsonValue,
        status: SystemStatus.ACTIVE,
        ...(feedback.studentFeedback && {
          studentFeedback: { connect: { id: feedback.studentFeedback.id } },
        }),
        ...(feedback.teacherFeedback && {
          teacherFeedback: { connect: { id: feedback.teacherFeedback.id } },
        }),
      },
    });

    return response;
  }

  /**
   * Delete feedback
   */
  async deleteFeedback(id: string) {
    const feedback = await this.prisma.feedbackBase.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Feedback not found",
      });
    }

    await this.prisma.feedbackBase.update({
      where: { id },
      data: { status: SystemStatus.DELETED },
    });

    return true;
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(filters?: {
    classId?: string;
    studentId?: string;
    teacherId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where = {
      status: SystemStatus.ACTIVE,
      ...(filters?.classId && { classId: filters.classId }),
      ...(filters?.studentId && {
        studentFeedback: {
          studentId: filters.studentId,
        },
      }),
      ...(filters?.teacherId && {
        teacherFeedback: {
          teacherId: filters.teacherId,
        },
      }),
      ...(filters?.startDate && filters?.endDate && {
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      }),
    };

    const [byType, bySeverity] = await Promise.all([
      this.prisma.feedbackBase.groupBy({
        by: ["type"],
        where,
        _count: true,
      }),
      this.prisma.feedbackBase.groupBy({
        by: ["severity"],
        where,
        _count: true,
      }),
    ]);

    return {
      byType,
      bySeverity,
    };
  }

  async createStudentFeedback(data: CreateFeedbackInput) {
    // Validate student exists
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: data.studentId }
    });

    if (!student) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Student not found'
      });
    }

    if (!data.studentId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Student ID is required'
      });
    }

    // Validate creator exists
    const creator = await this.prisma.user.findUnique({
      where: { id: data.createdById }
    });

    if (!creator) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Creator not found'
      });
    }

    // If classId is provided, validate class exists
    if (data.classId) {
      const classEntity = await this.prisma.class.findUnique({
        where: { id: data.classId }
      });

      if (!classEntity) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Class not found'
        });
      }
    }

    const { studentId, ...feedbackData } = data;

    // Create base feedback first
    const feedbackBase = await this.prisma.feedbackBase.create({
      data: {
        type: feedbackData.type,
        severity: feedbackData.severity,
        title: feedbackData.title,
        description: feedbackData.description,
        academicCycle: feedbackData.academicCycle,
        term: feedbackData.term,
        tags: feedbackData.tags || [],
        attachments: feedbackData.attachments as Prisma.InputJsonValue,
        classId: feedbackData.classId,
        createdById: feedbackData.createdById,
        status: SystemStatus.ACTIVE
      }
    });

    // Create student feedback
    return this.prisma.studentFeedback.create({
      data: {
        studentId,
        feedbackBaseId: feedbackBase.id
      },
      include: {
        feedbackBase: true,
        student: true
      }
    });
  }

  async createTeacherFeedback(data: CreateFeedbackInput) {
    // Validate teacher exists
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { id: data.teacherId }
    });

    if (!teacher) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Teacher not found'
      });
    }

    if (!data.teacherId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Teacher ID is required'
      });
    }

    // Validate creator exists
    const creator = await this.prisma.user.findUnique({
      where: { id: data.createdById }
    });

    if (!creator) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Creator not found'
      });
    }

    // If classId is provided, validate class exists
    if (data.classId) {
      const classEntity = await this.prisma.class.findUnique({
        where: { id: data.classId }
      });

      if (!classEntity) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Class not found'
        });
      }
    }

    const { teacherId, ...feedbackData } = data;

    // Create base feedback first
    const feedbackBase = await this.prisma.feedbackBase.create({
      data: {
        type: feedbackData.type,
        severity: feedbackData.severity,
        title: feedbackData.title,
        description: feedbackData.description,
        academicCycle: feedbackData.academicCycle,
        term: feedbackData.term,
        tags: feedbackData.tags || [],
        attachments: feedbackData.attachments as Prisma.InputJsonValue,
        classId: feedbackData.classId,
        createdById: feedbackData.createdById,
        status: SystemStatus.ACTIVE
      }
    });

    // Create teacher feedback
    return this.prisma.teacherFeedback.create({
      data: {
        teacherId,
        feedbackBaseId: feedbackBase.id
      },
      include: {
        feedbackBase: true,
        teacher: true
      }
    });
  }

  async getResponses(feedbackId: string) {
    const feedback = await this.prisma.feedbackBase.findUnique({
      where: { id: feedbackId }
    });

    if (!feedback) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Feedback not found'
      });
    }

    // Get student feedback responses
    const studentFeedback = await this.prisma.studentFeedback.findUnique({
      where: { feedbackBaseId: feedbackId },
      include: {
        responses: {
          include: {
            responder: true
          }
        }
      }
    });

    // Get teacher feedback responses
    const teacherFeedback = await this.prisma.teacherFeedback.findUnique({
      where: { feedbackBaseId: feedbackId },
      include: {
        responses: {
          include: {
            responder: true
          }
        }
      }
    });

    return studentFeedback?.responses || teacherFeedback?.responses || [];
  }
} 