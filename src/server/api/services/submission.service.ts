import { TRPCError } from "@trpc/server";
import type { PrismaClient, Prisma, SubmissionStatus } from "@prisma/client";
import { SystemStatus } from "../constants";
import type { PaginationInput, SubmissionFilters } from "../types";

interface SubmissionServiceConfig {
  prisma: PrismaClient;
}

interface CreateSubmissionInput {
  studentId: string;
  assessmentId: string;
  content: Record<string, unknown>;
  attachments?: Record<string, unknown>[];
  status?: SubmissionStatus;
}

interface UpdateSubmissionInput {
  content?: Record<string, unknown>;
  attachments?: Record<string, unknown>[];
  status?: SubmissionStatus;
  score?: number;
  feedback?: string;
  gradedById?: string;
}

export class SubmissionService {
  private prisma: PrismaClient;

  constructor(config: SubmissionServiceConfig) {
    this.prisma = config.prisma;
  }

  /**
   * Create a new submission
   */
  async createSubmission(input: CreateSubmissionInput) {
    // Check if student exists
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: input.studentId },
    });

    if (!student) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Student not found",
      });
    }

    // Check if assessment exists and is open for submission
    const now = new Date();
    
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: input.assessmentId },
    });

    if (!assessment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Assessment not found",
      });
    }

    if (assessment.status !== SystemStatus.ACTIVE) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Assessment is not active",
      });
    }

    // Check for due date in rubric field (which is JSON)
    const rubric = assessment.rubric as Record<string, unknown> | null;
    const assessmentDueDate = rubric && typeof rubric === 'object' && 'dueDate' in rubric
      ? new Date(rubric.dueDate as string)
      : null;

    if (assessmentDueDate && now > assessmentDueDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Assessment submission period has ended",
      });
    }

    // Check for existing submission
    const existingSubmission = await this.prisma.assessmentSubmission.findFirst({
      where: {
        studentId: input.studentId,
        assessmentId: input.assessmentId,
      },
    });

    if (existingSubmission) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Student has already submitted",
      });
    }

    // Create submission
    const submission = await this.prisma.assessmentSubmission.create({
      data: {
        student: {
          connect: { id: input.studentId }
        },
        assessment: {
          connect: { id: input.assessmentId }
        },
        content: input.content as Prisma.InputJsonValue,
        attachments: input.attachments as Prisma.InputJsonValue,
        status: input.status as SubmissionStatus,
        submittedAt: new Date(),
      },
    });

    return submission;
  }

  /**
   * Get submission by ID with related data
   */
  async getSubmission(id: string) {
    const submission = await this.prisma.assessmentSubmission.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        assessment: {
          select: {
            id: true,
            title: true,
            maxScore: true,
            weightage: true,
            subject: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        gradedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!submission) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Submission not found",
      });
    }

    return submission;
  }

  /**
   * Get paginated list of submissions
   */
  async listSubmissions(
    pagination: PaginationInput,
    filters?: SubmissionFilters,
  ) {
    const { page = 1, pageSize = 10, sortBy = "submittedAt", sortOrder = "desc" } = pagination;
    const { status, search, studentId, assessmentId } = filters || {};

    // Build where clause
    const where: Prisma.AssessmentSubmissionWhereInput = {
      status: status as SubmissionStatus,
      studentId,
      assessmentId,
    };

    // Add search functionality if needed
    if (search) {
      // Simplified search - just search by assessment title
      where.assessment = {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.assessmentSubmission.count({ where }),
      this.prisma.assessmentSubmission.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          assessment: {
            select: {
              id: true,
              title: true,
            },
          },
          gradedBy: {
            select: {
              id: true,
              name: true,
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
   * Update submission
   */
  async updateSubmission(id: string, input: UpdateSubmissionInput) {
    const submission = await this.prisma.assessmentSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Submission not found",
      });
    }

    // If updating score, validate it's within bounds
    if (input.score !== undefined) {
      const assessment = await this.prisma.assessment.findUnique({
        where: { id: submission.assessmentId },
      });

      if (!assessment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assessment not found",
        });
      }

      const maxScore = assessment.maxScore ?? 100; // Default to 100 if null
      if (input.score < 0 || input.score > maxScore) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Score must be between 0 and ${maxScore}`,
        });
      }
    }

    const updated = await this.prisma.assessmentSubmission.update({
      where: { id },
      data: {
        content: input.content as Prisma.InputJsonValue,
        attachments: input.attachments as Prisma.InputJsonValue,
        status: input.status as SubmissionStatus,
        score: input.score,
        feedback: input.feedback as Prisma.InputJsonValue,
        gradedBy: input.gradedById ? {
          connect: { id: input.gradedById }
        } : undefined,
        gradedAt: input.gradedById ? new Date() : undefined,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Delete submission
   */
  async deleteSubmission(id: string) {
    const submission = await this.prisma.assessmentSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Submission not found",
      });
    }

    // Only allow deletion if submission is not graded
    if (submission.gradedById) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Cannot delete graded submission",
      });
    }

    await this.prisma.assessmentSubmission.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Get submission statistics for a student
   */
  async getStudentStats(studentId: string) {
    const submissions = await this.prisma.assessmentSubmission.findMany({
      where: { studentId },
      include: {
        assessment: {
          select: {
            maxScore: true,
            weightage: true,
          },
        },
      },
    });

    // Calculate submission status distribution
    const statusDistribution = submissions.reduce(
      (acc: Record<string, number>, submission) => {
        const status = submission.status as string;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {},
    );

    // Calculate assessment scores - handle null values properly
    const assessmentSubmissions = submissions.filter(
      (s) => s.assessment && s.score !== null && s.assessment.maxScore !== null
    );

    let scoreStats = null;
    
    if (assessmentSubmissions.length > 0) {
      // Calculate average score as percentage
      const totalPercentage = assessmentSubmissions.reduce(
        (sum, s) => {
          const score = s.score || 0;
          const maxScore = s.assessment?.maxScore || 100;
          return sum + ((score / maxScore) * 100);
        },
        0
      );
      
      const averageScore = totalPercentage / assessmentSubmissions.length;
      
      // Calculate weighted average if possible
      let weightedAverage = null;
      const submissionsWithWeights = assessmentSubmissions.filter(
        s => s.assessment?.weightage !== null
      );
      
      if (submissionsWithWeights.length > 0) {
        const weightedSum = submissionsWithWeights.reduce(
          (sum, s) => {
            const score = s.score || 0;
            const maxScore = s.assessment?.maxScore || 100;
            const weightage = s.assessment?.weightage || 1;
            return sum + ((score / maxScore) * weightage);
          },
          0
        );
        
        const totalWeight = submissionsWithWeights.reduce(
          (sum, s) => sum + (s.assessment?.weightage || 1),
          0
        );
        
        weightedAverage = weightedSum / totalWeight;
      }
      
      scoreStats = {
        totalSubmissions: assessmentSubmissions.length,
        averageScore,
        weightedAverage
      };
    }

    // Calculate submission timeline
    const submissionTimeline = submissions
      .filter(s => s.submittedAt !== null)
      .reduce((acc: Record<string, number>, submission) => {
        if (submission.submittedAt) {
          const date = submission.submittedAt.toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
      }, {});

    return {
      totalSubmissions: submissions.length,
      statusDistribution,
      scoreStats,
      submissionTimeline,
    };
  }
} 