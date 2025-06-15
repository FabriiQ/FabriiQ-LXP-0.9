import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

import { TRPCError } from '@trpc/server';
import { AssessmentService } from '../services/assessment.service';
import { TeacherRoleService } from '../services/teacher-role.service';
import { SystemStatus, AssessmentCategory, GradingType, GradingScale, UserType, SubmissionStatus } from '../constants';
import { logger } from '../utils/logger';


// Input validation schemas
const createAssessmentSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  classId: z.string(),
  subjectId: z.string(),
  topicId: z.string().optional(), // Keep for backward compatibility
  topicIds: z.array(z.string()).optional(), // New field for multiple topics
  category: z.nativeEnum(AssessmentCategory),
  instructions: z.string().optional(),
  maxScore: z.number().optional(),
  passingScore: z.number().optional(),
  weightage: z.number().optional(),
  dueDate: z.date().optional(),
  gradingScale: z.nativeEnum(GradingScale).optional(),
  gradingType: z.nativeEnum(GradingType).optional(),
  isPublished: z.boolean().optional(),
  allowLateSubmissions: z.boolean().optional(),

  // Enhanced fields for new dialog
  learningOutcomeIds: z.array(z.string()).optional(),
  rubricId: z.string().optional(),
  bloomsDistribution: z.record(z.string(), z.number()).optional(),
  status: z.nativeEnum(SystemStatus).optional(),

  // Legacy questions support
  questions: z.array(
    z.object({
      text: z.string(),
      type: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY', 'FILE_UPLOAD']),
      options: z.array(z.object({
        text: z.string(),
        isCorrect: z.boolean().optional(),
      })).optional(),
      maxScore: z.number().optional(),
    })
  ).optional(),
});

const updateAssessmentSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  maxScore: z.number().optional(),
  passingScore: z.number().optional(),
  weightage: z.number().optional(),
  dueDate: z.date().optional(),
  gradingScale: z.nativeEnum(GradingScale).optional(),
  gradingType: z.nativeEnum(GradingType).optional(),
  isPublished: z.boolean().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
  allowLateSubmissions: z.boolean().optional(),
  questions: z.array(
    z.object({
      id: z.string().optional(),
      text: z.string(),
      type: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY', 'FILE_UPLOAD']),
      options: z.array(z.object({
        id: z.string().optional(),
        text: z.string(),
        isCorrect: z.boolean().optional(),
      })).optional(),
      maxScore: z.number().optional(),
    })
  ).optional(),
});

const assessmentIdSchema = z.object({
  id: z.string(),
});

const gradeSubmissionSchema = z.object({
  submissionId: z.string(),
  gradingType: z.enum(['RUBRIC', 'SCORE', 'HYBRID']).optional(),

  // Score-based grading
  score: z.number().optional(),
  feedback: z.string().optional(),

  // Rubric-based grading
  rubricResults: z.array(z.object({
    criteriaId: z.string(),
    performanceLevelId: z.string(),
    score: z.number(),
    feedback: z.string().optional(),
  })).optional(),

  // Bloom's level analysis
  bloomsLevelScores: z.record(z.string(), z.number()).optional(),
  bloomsAnalysis: z.array(z.object({
    level: z.string(),
    score: z.number(),
    feedback: z.string(),
    recommendations: z.array(z.string()).optional(),
  })).optional(),

  // Topic mastery updates
  updateTopicMastery: z.boolean().optional(),
  topicMasteryChanges: z.array(z.object({
    topicId: z.string(),
    masteryLevel: z.number(),
    evidence: z.string(),
  })).optional(),

  status: z.nativeEnum(SubmissionStatus).optional(),
});

export const assessmentRouter = createTRPCRouter({
  getUpcomingForClass: protectedProcedure
    .input(z.object({
      classId: z.string(),
      limit: z.number().optional().default(5),
    }))
    .query(async ({ ctx, input }) => {
      const { classId, limit } = input;

      // Get upcoming assessments for the class
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

      const assessments = await ctx.prisma.assessment.findMany({
        where: {
          classId,
          status: SystemStatus.ACTIVE,
          dueDate: {
            gte: new Date(),
            lte: twoWeeksFromNow,
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
        take: limit,
        include: {
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      });

      return assessments.map(assessment => ({
        id: assessment.id,
        title: assessment.title,
        dueDate: assessment.dueDate || new Date(), // Ensure dueDate is not null
        category: assessment.templateId ? 'QUIZ' : 'ASSIGNMENT', // Default category if not available
        maxScore: assessment.maxScore,
        submissionsCount: assessment._count.submissions,
      }));
    }),
  // Create assessment
  create: protectedProcedure
    .input(createAssessmentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        logger.debug("Assessment creation request", {
          userId: ctx.session.user.id,
          userType: ctx.session.user.userType,
          classId: input.classId
        });

        // Check user type permissions
        if (
          ![
            UserType.SYSTEM_ADMIN,
            UserType.SYSTEM_MANAGER,
            UserType.CAMPUS_ADMIN,
            UserType.CAMPUS_COORDINATOR,
            UserType.CAMPUS_TEACHER,
            'SYSTEM_ADMIN',
            'SYSTEM_MANAGER',
            'CAMPUS_ADMIN',
            'CAMPUS_COORDINATOR',
            'CAMPUS_TEACHER',
            'TEACHER',
          ].includes(ctx.session.user.userType as string)
        ) {
          logger.warn("Unauthorized user type for assessment creation", {
            userId: ctx.session.user.id,
            userType: ctx.session.user.userType
          });
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You do not have permission to create assessments"
          });
        }

        // For teachers, check if they are assigned to this class
        if (
          ctx.session.user.userType === UserType.CAMPUS_TEACHER ||
          ctx.session.user.userType === 'TEACHER'
        ) {
          // Get the teacher profile
          const user = await ctx.prisma.user.findUnique({
            where: { id: ctx.session.user.id },
            include: { teacherProfile: true }
          });

          if (!user?.teacherProfile) {
            logger.warn("Teacher profile not found for assessment creation", {
              userId: ctx.session.user.id
            });
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Teacher profile not found"
            });
          }

          // Check if teacher is assigned to this class
          const teacherRoleService = new TeacherRoleService({ prisma: ctx.prisma });
          const isClassTeacher = await teacherRoleService.isClassTeacher(
            user.teacherProfile.id,
            input.classId
          );

          if (!isClassTeacher) {
            logger.warn("Teacher not assigned to class for assessment creation", {
              userId: ctx.session.user.id,
              teacherProfileId: user.teacherProfile.id,
              classId: input.classId
            });
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You are not assigned to this class"
            });
          }

          logger.debug("Teacher permission check passed for assessment creation", {
            userId: ctx.session.user.id,
            teacherProfileId: user.teacherProfile.id,
            classId: input.classId
          });
        }



        // Get the class to determine the institution and term
        const classDetails = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
          select: { termId: true, campusId: true }
        });

        if (!classDetails) {
          logger.warn("Class not found for assessment creation", {
            classId: input.classId
          });
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }

        // Get campus to get institutionId
        const campus = await ctx.prisma.campus.findUnique({
          where: { id: classDetails.campusId },
          select: { institutionId: true }
        });

        if (!campus) {
          logger.warn("Campus not found for assessment creation", {
            campusId: classDetails.campusId
          });
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campus not found",
          });
        }
      } catch (error) {
        logger.error("Error in assessment creation permission check", {
          error,
          userId: ctx.session.user.id,
          classId: input.classId
        });
        throw error;
      }

      try {
        // These variables are defined in the try block above, so we need to get them again
        const service = new AssessmentService({ prisma: ctx.prisma });

        // Get the class to determine the institution and term
        const classDetails = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
          select: { termId: true, campusId: true }
        });

        if (!classDetails) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }

        // Get campus to get institutionId
        const campus = await ctx.prisma.campus.findUnique({
          where: { id: classDetails.campusId },
          select: { institutionId: true }
        });

        if (!campus) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campus not found",
          });
        }

        logger.debug("Creating assessment with service", {
          title: input.title,
          classId: input.classId,
          subjectId: input.subjectId
        });

        // Create the assessment with enhanced fields
        const assessment = await service.createAssessment({
          title: input.title || 'Untitled Assessment',
          institutionId: campus.institutionId,
          termId: classDetails.termId,
          createdById: ctx.session.user.id,
          maxScore: input.maxScore ?? 100,
          passingScore: input.passingScore,
          weightage: input.weightage ?? 0,
          gradingType: input.gradingType ?? GradingType.MANUAL,
          category: input.category,
          description: input.description,
          subjectId: input.subjectId,
          classId: input.classId,
          topicId: input.topicId,
          dueDate: input.dueDate,
          instructions: input.instructions,
          rubricId: input.rubricId,
          bloomsDistribution: input.bloomsDistribution,
          // Store questions as rubric for legacy support
          rubric: input.questions ? { questions: input.questions } : undefined,
          status: input.status ?? SystemStatus.ACTIVE
        });

        // Create learning outcome associations if provided
        if (input.learningOutcomeIds && input.learningOutcomeIds.length > 0) {
          await ctx.prisma.assessmentOutcome.createMany({
            data: input.learningOutcomeIds.map(outcomeId => ({
              assessmentId: assessment.id,
              learningOutcomeId: outcomeId
            }))
          });
        }

        // TODO: Create assessment criteria associations if rubric is selected
        // This requires the Assessment model to have the assessmentCriteria relation
        // if (input.rubricId) {
        //   const rubricCriteria = await ctx.prisma.rubricCriteria.findMany({
        //     where: { rubricId: input.rubricId }
        //   });

        //   if (rubricCriteria.length > 0) {
        //     await ctx.prisma.assessmentCriteria.createMany({
        //       data: rubricCriteria.map((criteria, index) => ({
        //         assessmentId: assessment.id,
        //         criteriaId: criteria.id,
        //         weight: 1.0,
        //         maxScore: input.maxScore ? input.maxScore / rubricCriteria.length : 100 / rubricCriteria.length,
        //         orderIndex: index
        //       }))
        //     });
        //   }
        // }

        return assessment;
      } catch (error) {
        logger.error("Error creating assessment", {
          error,
          title: input.title,
          classId: input.classId,
          subjectId: input.subjectId
        });
        throw error;
      }
    }),

  // Update assessment
  update: protectedProcedure
    .input(updateAssessmentSchema)
    .mutation(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'SYSTEM_ADMIN',
          'SYSTEM_MANAGER',
          'CAMPUS_ADMIN',
          'CAMPUS_COORDINATOR',
          'CAMPUS_TEACHER',
          'TEACHER',
        ].includes(ctx.session.user.userType as string)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { id, ...data } = input;
      const service = new AssessmentService({ prisma: ctx.prisma });
      return service.updateAssessment(id, data);
    }),

  // Submit assessment (online)
  submit: protectedProcedure
    .input(z.object({
      id: z.string(),
      answers: z.array(z.object({
        questionId: z.string(),
        value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          UserType.CAMPUS_STUDENT,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Only students can submit assessments
      if (ctx.session.user.userType !== UserType.CAMPUS_STUDENT) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only students can submit assessments"
        });
      }

      const service = new AssessmentService({
        prisma: ctx.prisma,
        currentUserId: ctx.session.user.id
      });

      return service.createSubmission({
        assessmentId: input.id,
        studentId: ctx.session.user.id,
        answers: input.answers.map(answer => ({
          questionId: answer.questionId,
          value: answer.value !== undefined ? String(answer.value) : undefined,
        }))
      });
    }),

  // Grade submission
  grade: protectedProcedure
    .input(gradeSubmissionSchema)
    .mutation(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'TEACHER', // Add regular TEACHER type
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      console.log('Grade submission API called with:', input);

      const service = new AssessmentService({
        prisma: ctx.prisma,
        currentUserId: ctx.session.user.id
      });
      return service.gradeSubmission({
        submissionId: input.submissionId || '',
        gradingType: input.gradingType,
        score: input.score || 0,
        feedback: input.feedback,
        rubricResults: input.rubricResults,
        bloomsLevelScores: input.bloomsLevelScores,
        bloomsAnalysis: input.bloomsAnalysis,
        updateTopicMastery: input.updateTopicMastery,
        topicMasteryChanges: input.topicMasteryChanges,
      });
    }),

  // Get assessment by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string().optional(),
      assessmentId: z.string().optional(),
      includeQuestions: z.boolean().optional(),
      includeSubmissions: z.boolean().optional(),
    }).refine(data => data.id || data.assessmentId, {
      message: "Either id or assessmentId must be provided",
      path: ["id"]
    }))
    .query(async ({ ctx, input }) => {
      try {
        const service = new AssessmentService({ prisma: ctx.prisma });
        // Use id if provided, otherwise use assessmentId
        const assessmentId = input.id || input.assessmentId;

        if (!assessmentId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Assessment ID is required"
          });
        }

        logger.debug("Fetching assessment by ID", {
          assessmentId,
          includeQuestions: input.includeQuestions,
          includeSubmissions: input.includeSubmissions
        });

        return service.getAssessment(assessmentId);
      } catch (error) {
        logger.error("Error fetching assessment by ID", {
          error,
          id: input.id,
          assessmentId: input.assessmentId
        });
        throw error;
      }
    }),

  // Get assessment for taking (student view)
  getForTaking: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Only students can take assessments
      if (ctx.session.user.userType !== UserType.CAMPUS_STUDENT) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only students can take assessments"
        });
      }

      // Get assessment with questions
      const assessment = await ctx.prisma.assessment.findUnique({
        where: {
          id: input.id,
          status: SystemStatus.ACTIVE, // Only published assessments
        },
      });

      if (!assessment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Assessment not found or not available',
        });
      }

      // Check if student is enrolled in the class
      const studentEnrollment = await ctx.prisma.studentEnrollment.findFirst({
        where: {
          studentId: ctx.session.user.id,
          classId: assessment.classId,
          status: 'ACTIVE',
        },
      });

      if (!studentEnrollment) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not enrolled in this class',
        });
      }

      // Check if student already submitted
      const existingSubmission = await ctx.prisma.assessmentSubmission.findFirst({
        where: {
          assessmentId: input.id,
          studentId: ctx.session.user.id,
          status: {
            notIn: [SubmissionStatus.DRAFT]
          },
        },
      });

      if (existingSubmission) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You have already submitted this assessment',
        });
      }

      // Parse rubric to get questions
      const assessmentData = assessment.rubric ?
        (typeof assessment.rubric === 'string'
          ? JSON.parse(assessment.rubric as string)
          : assessment.rubric) : {};

      const questions = assessmentData.questions || [];

      // Remove correct answers from questions for student view
      const sanitizedQuestions = questions.map((q: any) => {
        const { correctAnswer, correctAnswers, ...rest } = q;

        // For multiple choice, remove isCorrect flag from options
        if (rest.options) {
          rest.options = rest.options.map((opt: any) => {
            const { isCorrect, ...optRest } = opt;
            return optRest;
          });
        }

        return rest;
      });

      return {
        id: assessment.id,
        title: assessment.title,
        description: assessmentData.description || '',
        instructions: assessmentData.instructions || '',
        maxScore: assessment.maxScore,
        dueDate: assessment.dueDate,
        timeLimit: assessmentData.timeLimit,
        questions: sanitizedQuestions,
      };
    }),

  list: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(10),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      status: z.nativeEnum(SystemStatus).optional(),
      search: z.string().optional(),
      subjectId: z.string().optional(),
      category: z.nativeEnum(AssessmentCategory).optional(),
      lessonPlanId: z.string().optional(), // Add lessonPlanId filter
    }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, sortBy, sortOrder, ...filters } = input;
      const service = new AssessmentService({ prisma: ctx.prisma });
      return service.listAssessments(
        { page, pageSize, sortBy, sortOrder },
        filters,
      );
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new Error("Unauthorized - Only admins can delete assessments");
      }

      const service = new AssessmentService({ prisma: ctx.prisma });
      return service.deleteAssessment(input);
    }),

  getStats: protectedProcedure
    .input(assessmentIdSchema)
    .query(async ({ input, ctx }) => {
      // Verify user has appropriate access
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'SYSTEM_ADMIN',
          'SYSTEM_MANAGER',
          'CAMPUS_ADMIN',
          'CAMPUS_COORDINATOR',
          'CAMPUS_TEACHER',
          'TEACHER',
        ].includes(ctx.session.user.userType as string)
      ) {
        throw new Error("Unauthorized - Insufficient permissions to view assessment stats");
      }

      const service = new AssessmentService({ prisma: ctx.prisma });
      return service.getAssessmentStats(input.id);
    }),

  // List templates
  listTemplates: protectedProcedure
    .input(z.object({
      status: z.nativeEnum(SystemStatus).optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, status } = input;
      const where = status ? { status } : {};

      const [total, items] = await Promise.all([
        ctx.prisma.assessmentTemplate.count({ where }),
        ctx.prisma.assessmentTemplate.findMany({
          where,
          orderBy: { createdAt: 'desc' },
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
    }),

  // List policies
  listPolicies: protectedProcedure
    .input(z.object({
      status: z.nativeEnum(SystemStatus).optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, status } = input;
      const where = status ? { status } : {};

      const [total, items] = await Promise.all([
        ctx.prisma.assessmentPolicy.count({ where }),
        ctx.prisma.assessmentPolicy.findMany({
          where,
          orderBy: { createdAt: 'desc' },
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
    }),

  // Get submission
  getSubmission: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new AssessmentService({ prisma: ctx.prisma });
      return service.getSubmission(input.id);
    }),

  // Get submission results (for students)
  getSubmissionResults: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Get submission
      const submission = await ctx.prisma.assessmentSubmission.findUnique({
        where: { id: input.id },
        include: {
          assessment: true,
        },
      });

      if (!submission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Submission not found',
        });
      }

      // Students can only view their own submissions
      if (
        ctx.session.user.userType === UserType.CAMPUS_STUDENT &&
        ctx.session.user.id !== submission.studentId
      ) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You can only view your own submissions',
        });
      }

      // Parse content to get answers
      const content = submission.content ?
        (typeof submission.content === 'string'
          ? JSON.parse(submission.content as string)
          : submission.content) : {};

      // Parse grading details
      const gradingDetails = submission.gradingDetails ?
        (typeof submission.gradingDetails === 'string'
          ? JSON.parse(submission.gradingDetails as string)
          : submission.gradingDetails) : null;

      // Parse assessment rubric to get questions
      const assessmentData = submission.assessment.rubric ?
        (typeof submission.assessment.rubric === 'string'
          ? JSON.parse(submission.assessment.rubric as string)
          : submission.assessment.rubric) : {};

      const questions = assessmentData.questions || [];

      return {
        id: submission.id,
        assessmentId: submission.assessmentId,
        studentId: submission.studentId,
        status: submission.status,
        score: submission.score,
        maxScore: submission.assessment.maxScore,
        submittedAt: submission.submittedAt,
        gradedAt: submission.gradedAt,
        assessment: {
          id: submission.assessment.id,
          title: submission.assessment.title,
          description: assessmentData.description || '',
          category: assessmentData.category || 'QUIZ',
          gradingType: submission.assessment.gradingType,
        },
        answers: content.answers || {},
        questions,
        gradingResults: gradingDetails,
        feedback: submission.feedback,
      };
    }),

  // Get all submissions for an assessment
  getSubmissions: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const submissions = await ctx.prisma.assessmentSubmission.findMany({
        where: { assessmentId: input.assessmentId },
        include: {
          student: {
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
        },
        orderBy: { submittedAt: 'desc' },
      });

      return {
        submissions,
      };
    }),

  // List assessments by class
  listByClass: protectedProcedure
    .input(z.object({
      classId: z.string(),
      category: z.nativeEnum(AssessmentCategory).optional(),
      status: z.nativeEnum(SystemStatus).optional(),
      lessonPlanId: z.string().optional(), // Add lessonPlanId filter
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(10),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { classId, category, status, lessonPlanId, ...pagination } = input;
      const service = new AssessmentService({ prisma: ctx.prisma });
      return service.listAssessmentsByClass(
        { classId, category, status, lessonPlanId },
        pagination
      );
    }),

  // Create assessment submission
  createSubmission: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
      studentId: z.string(),
      answers: z.array(z.object({
        questionId: z.string(),
        answerText: z.string().optional(),
        selectedOptionId: z.string().optional(),
        fileUrl: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          UserType.CAMPUS_STUDENT,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Students can only submit for themselves
      if (
        ctx.session.user.userType === UserType.CAMPUS_STUDENT &&
        ctx.session.user.id !== input.studentId
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Students can only submit assessments for themselves"
        });
      }

      const service = new AssessmentService({ prisma: ctx.prisma });
      return service.createSubmission({
        assessmentId: input.assessmentId || '',
        studentId: input.studentId || '',
        answers: (input.answers || []).map(answer => ({
          questionId: answer.questionId || '',
          value: answer.answerText,
          choiceId: answer.selectedOptionId
        }))
      });
    }),

  // List assessment submissions
  listSubmissions: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
      status: z.nativeEnum(SubmissionStatus).optional(),
      skip: z.number().optional(),
      take: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'TEACHER', // Add regular TEACHER type
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new AssessmentService({ prisma: ctx.prisma });
      return service.listSubmissions(
        {
          assessmentId: input.assessmentId,
          status: input.status,
        },
        input.skip,
        input.take
      );
    }),

  // Bulk grade submissions
  bulkGradeSubmissions: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
      grades: z.array(z.object({
        submissionId: z.string(),
        score: z.number(),
        feedback: z.string().optional(),
        status: z.nativeEnum(SubmissionStatus).optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'TEACHER', // Add regular TEACHER type
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new AssessmentService({ prisma: ctx.prisma });
      return service.bulkGradeSubmissions({
        assessmentId: input.assessmentId,
        submissions: input.grades.map(grade => ({
          submissionId: grade.submissionId || '',
          score: grade.score || 0,
          feedback: grade.feedback
        }))
      });
    }),

  // Publish assessment
  publishAssessment: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new AssessmentService({ prisma: ctx.prisma });
      return service.publishAssessment(input);
    }),

  // Unpublish assessment
  unpublishAssessment: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const service = new AssessmentService({ prisma: ctx.prisma });
      return service.unpublishAssessment(input);
    }),
});

