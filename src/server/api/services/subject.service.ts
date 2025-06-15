import { TRPCError } from "@trpc/server";
import { PrismaClient } from "@prisma/client";
import { SystemStatus } from "../constants";
import type { BaseFilters } from "../types";
import { QuestionBankService } from "@/features/question-bank/services/question-bank.service";

interface SubjectServiceConfig {
  prisma: PrismaClient;
}

interface CreateSubjectInput {
  code: string;
  name: string;
  credits: number;
  courseId: string;
  syllabus?: Record<string, unknown>;
  bloomsDistribution?: Record<string, number>;
  status?: SystemStatus;
}

interface UpdateSubjectInput {
  name?: string;
  credits?: number;
  syllabus?: Record<string, unknown>;
  bloomsDistribution?: Record<string, number>;
  status?: SystemStatus;
}

export class SubjectService {
  private prisma: PrismaClient;

  constructor(config: SubjectServiceConfig) {
    this.prisma = config.prisma;
  }

  /**
   * Create a new subject
   * @param input Subject data
   * @returns Created subject
   */
  async createSubject(input: CreateSubjectInput) {
    try {
      // Check if course exists
      const course = await this.prisma.course.findUnique({
        where: { id: input.courseId },
      });

      if (!course) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Course not found',
        });
      }

      // Check if subject code already exists
      const existingSubject = await this.prisma.subject.findFirst({
        where: { code: input.code },
      });

      if (existingSubject) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Subject code already exists',
        });
      }

      // Create subject
      const subject = await this.prisma.subject.create({
        data: {
          code: input.code,
          name: input.name,
          credits: input.credits,
          courseId: input.courseId,
          syllabus: input.syllabus && Object.keys(input.syllabus).length > 0
            ? input.syllabus as any
            : undefined,
          bloomsDistribution: input.bloomsDistribution && Object.keys(input.bloomsDistribution).length > 0
            ? input.bloomsDistribution as any
            : undefined,
          status: input.status || SystemStatus.ACTIVE,
        },
        include: {
          course: true,
        },
      });

      try {
        // Get institution ID from the course's campus offerings
        const courseCampus = await this.prisma.courseCampus.findFirst({
          where: { courseId: input.courseId },
          include: { campus: true },
        });

        if (courseCampus?.campus?.institutionId) {
          // Create a question bank for this subject
          const questionBankService = new QuestionBankService(this.prisma);

          // Create a descriptive name for the question bank
          const questionBankName = `${subject.course.name} - ${subject.name} Question Bank`;

          // Create the question bank
          await questionBankService.createQuestionBank({
            name: questionBankName,
            description: `Question bank for ${subject.name} in ${subject.course.name}`,
            institutionId: courseCampus.campus.institutionId,
          }, 'system'); // Using 'system' as the creator ID for auto-created question banks
        }
      } catch (error) {
        // Log the error but don't fail the subject creation
        console.error('Error creating question bank for subject:', error);
      }

      return subject;
    } catch (error) {
      // If it's already a TRPCError, rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Error creating subject:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create subject',
        cause: error,
      });
    }
  }

  /**
   * Get a subject by ID
   * @param id Subject ID
   * @returns Subject data
   */
  async getSubject(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!subject) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subject not found",
      });
    }

    return subject;
  }

  /**
   * List subjects with pagination and filtering
   * @param pagination Pagination options
   * @param filters Filter options
   * @returns Paginated list of subjects
   */
  async listSubjects(
    pagination: { skip?: number; take?: number },
    filters?: BaseFilters & { courseId?: string },
  ) {
    const { skip = 0, take = 10 } = pagination;
    const { search, status, courseId } = filters || {};

    // Build where clause
    let where: any = {};

    if (courseId) {
      where.courseId = courseId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } }
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.subject.count({ where }),
      this.prisma.subject.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
    ]);

    return { total, items };
  }

  /**
   * Update a subject
   * @param id Subject ID
   * @param input Updated subject data
   * @returns Updated subject
   */
  async updateSubject(id: string, input: UpdateSubjectInput) {
    // Check if subject exists
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Subject not found',
      });
    }

    // Update subject
    const data: any = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.credits !== undefined) {
      data.credits = input.credits;
    }

    if (input.syllabus !== undefined) {
      // Convert syllabus to JSON or use undefined if empty
      data.syllabus = Object.keys(input.syllabus).length > 0
        ? input.syllabus as any
        : undefined;
    }

    if (input.bloomsDistribution !== undefined) {
      // Convert bloomsDistribution to JSON or use undefined if empty
      data.bloomsDistribution = Object.keys(input.bloomsDistribution).length > 0
        ? input.bloomsDistribution as any
        : undefined;
    }

    if (input.status !== undefined) {
      data.status = input.status;
    }

    try {
      const updatedSubject = await this.prisma.subject.update({
        where: { id },
        data
      });

      return updatedSubject;
    } catch (error) {
      console.error("Error updating subject:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update subject',
        cause: error,
      });
    }
  }

  /**
   * Delete subject
   */
  async deleteSubject(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            activities: true,
            assessments: true,
            teacherQualifications: true,
          },
        },
      },
    });

    if (!subject) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subject not found",
      });
    }

    // Check if subject has any dependencies
    if (
      subject._count.activities > 0 ||
      subject._count.assessments > 0 ||
      subject._count.teacherQualifications > 0
    ) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Cannot delete subject with existing activities, assessments, or teacher qualifications",
      });
    }

    await this.prisma.subject.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Get subject statistics with real-time calculations
   */
  async getSubjectStats(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            topics: true,
            learningOutcomes: true,
            activities: true,
            assessments: true,
            teacherQualifications: true,
          },
        },
        topics: {
          where: { status: SystemStatus.ACTIVE },
          include: {
            _count: {
              select: {
                learningOutcomes: true,
              },
            },
            learningOutcomes: {
              select: {
                bloomsLevel: true,
                criteria: true,
              },
            },
          },
        },
        learningOutcomes: {
          select: {
            bloomsLevel: true,
            criteria: true,
          },
        },


        activities: {
          select: {
            learningType: true,
            content: true,
          },
        },
        assessments: {
          select: {
            maxScore: true,
            weightage: true,
          },
        },
        teacherQualifications: {
          select: {
            level: true,
            isVerified: true,
          },
        },
      },
    }) as any; // Type assertion to handle Prisma's complex include types

    if (!subject) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subject not found",
      });
    }

    // Calculate activity type distribution
    // Map learningType or content.activityType to type for backward compatibility
    const activities = subject.activities.map((a: any) => {
      let activityType: string;
      if ((a as any).learningType) {
        // Convert enum value to string and make it lowercase for consistency
        activityType = (a as any).learningType.toString().toLowerCase().replace(/_/g, '-');
      } else {
        // Fall back to content.activityType if available
        const activityContent = (a as any).content;
        activityType = activityContent?.activityType || 'unknown';
      }
      return { type: activityType };
    });

    const activityTypeDistribution = activities.reduce(
      (acc: Record<string, number>, activity: { type: string }) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      },
      {},
    );

    // Calculate teacher qualification level distribution
    const qualificationLevelDistribution = subject.teacherQualifications.reduce(
      (acc: Record<string, number>, qual: { level: string }) => {
        acc[qual.level] = (acc[qual.level] || 0) + 1;
        return acc;
      },
      {},
    );

    // Calculate total assessment weightage
    const totalWeightage = subject.assessments.reduce(
      (sum: number, assessment: { weightage: number | null }) =>
        sum + (assessment.weightage || 0),
      0,
    );

    // Calculate real-time Bloom's taxonomy distribution from learning outcomes
    const allLearningOutcomes = [
      ...subject.learningOutcomes,
      ...subject.topics.flatMap((topic: any) => topic.learningOutcomes),
    ];

    const bloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    // Count learning outcomes by Bloom's level
    allLearningOutcomes.forEach(outcome => {
      if (outcome.bloomsLevel && bloomsDistribution.hasOwnProperty(outcome.bloomsLevel.toUpperCase())) {
        bloomsDistribution[outcome.bloomsLevel.toUpperCase() as keyof typeof bloomsDistribution]++;
      }
    });

    // Convert counts to percentages
    const totalOutcomes = allLearningOutcomes.length;
    const bloomsDistributionPercentage = totalOutcomes > 0 ? {
      REMEMBER: Math.round((bloomsDistribution.REMEMBER / totalOutcomes) * 100),
      UNDERSTAND: Math.round((bloomsDistribution.UNDERSTAND / totalOutcomes) * 100),
      APPLY: Math.round((bloomsDistribution.APPLY / totalOutcomes) * 100),
      ANALYZE: Math.round((bloomsDistribution.ANALYZE / totalOutcomes) * 100),
      EVALUATE: Math.round((bloomsDistribution.EVALUATE / totalOutcomes) * 100),
      CREATE: Math.round((bloomsDistribution.CREATE / totalOutcomes) * 100),
    } : null;

    // Calculate real-time counts
    const realTimeCounts = {
      topics: subject.topics.length,
      learningOutcomes: allLearningOutcomes.length,
      rubrics: 0, // TODO: Add rubrics count when rubrics relation is available
      rubricCriteria: 0, // TODO: Add rubric criteria count when relation is available
      activities: subject._count.activities,
      assessments: subject._count.assessments,
      teacherQualifications: subject._count.teacherQualifications,
    };

    return {
      counts: realTimeCounts,
      bloomsDistribution: bloomsDistributionPercentage,
      bloomsDistributionCounts: bloomsDistribution,
      activityTypeDistribution,
      qualificationLevelDistribution,
      totalWeightage,
      verifiedTeacherCount: subject.teacherQualifications.filter(
        (q: { isVerified: boolean }) => q.isVerified
      ).length,
    };
  }
}