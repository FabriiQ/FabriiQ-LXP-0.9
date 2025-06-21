import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { 
  createEssaySubmissionSchema,
  updateEssaySubmissionSchema,
  gradeEssaySubmissionSchema,
  requestAIGradingSchema,
  checkPlagiarismSchema,
  EssaySubmissionStatus,
  AIGradingMode
} from '@/features/assessments/types/essay';
import { EssayAIGradingService } from '@/features/assessments/services/essay-ai-grading.service';
import { PlagiarismDetectionService } from '@/features/assessments/services/plagiarism-detection.service';
import { AutomaticGradingService } from '@/features/assessments/services/automatic-grading.service';
// import { logger } from '@/lib/logger';

export const essayAssessmentRouter = createTRPCRouter({
  // Create or update essay submission
  submitEssay: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
      questionId: z.string(),
      content: z.string(),
      isDraft: z.boolean().default(false),
      submissionId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { assessmentId, questionId, content, isDraft, submissionId } = input;
        const userId = ctx.session.user.id;

        // Get student profile
        const student = await ctx.prisma.studentProfile.findUnique({
          where: { userId },
          select: { id: true }
        });

        if (!student) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Student profile not found'
          });
        }

        // Verify assessment exists and is accessible
        const assessment = await ctx.prisma.assessment.findUnique({
          where: { id: assessmentId },
          include: {
            class: {
              include: {
                students: {
                  where: { studentId: student.id }
                }
              }
            },
            // Include assessment settings for automatic grading
            metadata: true
          }
        });

        if (!assessment || assessment.class.students.length === 0) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Assessment not accessible'
          });
        }

        const wordCount = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
        const now = new Date();

        let submission: any;

        if (submissionId) {
          // Update existing submission
          submission = await ctx.prisma.assessmentSubmission.update({
            where: {
              id: submissionId,
              studentId: student.id
            },
            data: {
              answers: {
                [questionId]: {
                  content,
                  wordCount,
                  lastSavedAt: now
                }
              },
              status: isDraft ? 'DRAFT' : 'SUBMITTED',
              submittedAt: isDraft ? null : now,
              updatedAt: now
            }
          });
        } else {
          // Create new submission
          submission = await ctx.prisma.assessmentSubmission.create({
            data: {
              assessmentId,
              studentId: student.id,
              answers: {
                [questionId]: {
                  content,
                  wordCount,
                  lastSavedAt: now
                }
              },
              status: isDraft ? 'DRAFT' : 'SUBMITTED',
              submittedAt: isDraft ? null : now,
              score: null,
              feedback: null
            }
          });
        }

        // Trigger automatic grading if enabled and not a draft
        if (!isDraft && submission.status === 'SUBMITTED') {
          try {
            const automaticGradingService = new AutomaticGradingService();
            const assessmentSettings = assessment.metadata as any;

            // Check if automatic grading should be triggered
            if (automaticGradingService.shouldTriggerAutomaticGrading(assessmentSettings?.aiGradingMode)) {
              console.log('Triggering automatic AI grading for submission:', submission.id);

              // Process automatic grading
              const gradingResult = await automaticGradingService.processSubmission(
                {
                  id: submission.id,
                  content,
                  assessmentId,
                  studentId: student.id
                } as any,
                {
                  aiGradingMode: assessmentSettings?.aiGradingMode,
                  rubric: assessmentSettings?.rubric?.criteria,
                  question: {
                    text: assessmentSettings?.question?.text || assessment.title,
                    sampleAnswer: assessmentSettings?.sampleAnswer,
                    keywordsConcepts: assessmentSettings?.keywordsConcepts
                  }
                }
              );

              if (gradingResult.shouldGradeAutomatically && gradingResult.gradingResult) {
                // Format and store the automatic grading result
                const formattedGrading = automaticGradingService.formatGradingResultForStorage(
                  gradingResult.gradingResult
                );

                // Update submission with automatic grading
                submission = await ctx.prisma.assessmentSubmission.update({
                  where: { id: submission.id },
                  data: {
                    score: formattedGrading.totalScore,
                    feedback: formattedGrading.overallFeedback,
                    status: 'GRADED',
                    gradedAt: new Date(),
                    metadata: {
                      ...(submission.metadata as any || {}),
                      aiGrading: formattedGrading.aiGrading,
                      gradingType: 'AUTOMATIC_AI',
                      criteriaScores: formattedGrading.criteriaScores
                    }
                  }
                });

                console.log('Automatic grading completed for submission:', submission.id);
              } else if (gradingResult.error) {
                console.warn('Automatic grading failed:', gradingResult.error);
              }
            }
          } catch (error) {
            console.error('Error in automatic grading:', error);
            // Don't fail the submission if automatic grading fails
          }
        }

        return submission;
      } catch (error) {
        console.error('Error submitting essay:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit essay'
        });
      }
    }),

  // Get essay submission
  getSubmission: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
      studentId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { assessmentId, studentId } = input;
        const userId = ctx.session.user.id;

        // Determine which student's submission to get
        let targetStudentId = studentId;
        
        if (!targetStudentId) {
          // Get current user's student profile
          const student = await ctx.prisma.studentProfile.findUnique({
            where: { userId },
            select: { id: true }
          });
          
          if (!student) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Student profile not found'
            });
          }
          
          targetStudentId = student.id;
        }

        const submission = await ctx.prisma.assessmentSubmission.findFirst({
          where: {
            assessmentId,
            studentId: targetStudentId
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            },
            assessment: {
              include: {
                subject: true,
                class: true
              }
            }
          }
        });

        return submission;
      } catch (error) {
        console.error('Error getting essay submission:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get submission'
        });
      }
    }),

  // Grade essay submission
  gradeSubmission: protectedProcedure
    .input(gradeEssaySubmissionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { submissionId, criteriaScores, overallFeedback } = input;
        const userId = ctx.session.user.id;

        // Verify teacher has permission to grade this submission
        const submission = await ctx.prisma.assessmentSubmission.findUnique({
          where: { id: submissionId },
          include: {
            assessment: {
              include: {
                class: {
                  include: {
                    teacher: true
                  }
                }
              }
            }
          }
        });

        if (!submission) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Submission not found'
          });
        }

        if (submission.assessment.class.teacher.userId !== userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized to grade this submission'
          });
        }

        // Calculate total score
        const totalScore = criteriaScores.reduce((sum, cs) => sum + cs.score, 0);

        // Update submission with grading
        const updatedSubmission = await ctx.prisma.assessmentSubmission.update({
          where: { id: submissionId },
          data: {
            score: totalScore,
            feedback: overallFeedback,
            status: 'GRADED',
            gradedAt: new Date(),
            gradedById: userId,
            // Store detailed grading in metadata
            metadata: {
              criteriaScores,
              gradingType: 'MANUAL'
            }
          }
        });

        return updatedSubmission;
      } catch (error) {
        console.error('Error grading essay submission:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to grade submission'
        });
      }
    }),

  // Request AI grading
  requestAIGrading: protectedProcedure
    .input(requestAIGradingSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { submissionId, mode, includeExplanation } = input;

        // Get submission with question details
        const submission = await ctx.prisma.assessmentSubmission.findUnique({
          where: { id: submissionId },
          include: {
            assessment: {
              select: {
                rubric: true,
                title: true
              }
            }
          }
        });

        if (!submission) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Submission not found'
          });
        }

        // Extract essay content and question
        const answers = submission.answers as any;
        const essayContent = Object.values(answers)[0] as any;
        
        if (!essayContent?.content) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No essay content found'
          });
        }

        // Get rubric criteria from assessment
        const rubricData = submission.assessment.rubric as any;
        const criteria = rubricData?.criteria || [];

        if (criteria.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No rubric criteria found for AI grading'
          });
        }

        // Initialize AI grading service
        const aiGradingService = new EssayAIGradingService();

        // Perform AI grading
        const aiResult = await aiGradingService.gradeEssay(
          essayContent.content,
          submission.assessment.title,
          criteria,
          rubricData?.sampleAnswer,
          rubricData?.keywordsConcepts
        );

        // Store AI grading result
        await ctx.prisma.assessmentSubmission.update({
          where: { id: submissionId },
          data: {
            metadata: {
              ...(submission.metadata as any || {}),
              aiGrading: aiResult
            }
          }
        });

        return aiResult;
      } catch (error) {
        console.error('Error in AI grading:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AI grading failed'
        });
      }
    }),

  // Check plagiarism
  checkPlagiarism: protectedProcedure
    .input(checkPlagiarismSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { submissionId, content, threshold, checkSources } = input;

        // Get submission details
        const submission = await ctx.prisma.assessmentSubmission.findUnique({
          where: { id: submissionId },
          select: {
            assessmentId: true,
            studentId: true
          }
        });

        if (!submission) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Submission not found'
          });
        }

        // Initialize plagiarism detection service
        const plagiarismService = new PlagiarismDetectionService(ctx.prisma);

        // Perform plagiarism check
        const result = await plagiarismService.checkPlagiarism(
          content,
          submission.assessmentId,
          submission.studentId,
          threshold,
          {
            checkDatabase: checkSources?.database,
            checkSubmissions: checkSources?.submissions,
            checkInternet: checkSources?.internet
          }
        );

        // Store plagiarism result
        await ctx.prisma.assessmentSubmission.update({
          where: { id: submissionId },
          data: {
            metadata: {
              ...(submission as any).metadata || {},
              plagiarismResult: result
            }
          }
        });

        return result;
      } catch (error) {
        console.error('Error in plagiarism check:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Plagiarism check failed'
        });
      }
    }),

  // Get submissions for grading (teacher view)
  getSubmissionsForGrading: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
      status: z.enum(['ALL', 'SUBMITTED', 'GRADED', 'DRAFT']).default('ALL')
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { assessmentId, status } = input;
        const userId = ctx.session.user.id;

        // Verify teacher has access to this assessment
        const assessment = await ctx.prisma.assessment.findUnique({
          where: { id: assessmentId },
          include: {
            class: {
              include: {
                teacher: true
              }
            }
          }
        });

        if (!assessment || assessment.class.teacher.userId !== userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized to view these submissions'
          });
        }

        // Build where clause based on status filter
        const whereClause: any = { assessmentId };
        
        if (status !== 'ALL') {
          whereClause.status = status;
        }

        const submissions = await ctx.prisma.assessmentSubmission.findMany({
          where: whereClause,
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    image: true
                  }
                }
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        });

        return submissions;
      } catch (error) {
        console.error('Error getting submissions for grading:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get submissions'
        });
      }
    }),
});
