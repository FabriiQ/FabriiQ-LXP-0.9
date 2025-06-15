import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { BloomsTaxonomyLevel, RubricType } from "@/features/bloom/types";
import {
  SubmissionStatus,
  GradableContentType
} from "@/features/bloom/types/grading";
import { TRPCError } from "@trpc/server";
import { SystemStatus } from "../constants";

/**
 * Bloom's Taxonomy Grading API Router
 *
 * This router provides endpoints for grading submissions with Bloom's Taxonomy integration.
 */

// Helper function to process agent response into structured feedback
function processAgentResponseHelper(response: string, bloomsLevel?: BloomsTaxonomyLevel): any[] {
  try {
    // Try to parse the response as JSON if it's in that format
    if (response.includes('{') && response.includes('}')) {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        if (Array.isArray(jsonData.suggestions)) {
          return jsonData.suggestions;
        }
        if (jsonData.suggestion) {
          return [jsonData];
        }
      }
    }

    // Otherwise, extract sections from the text response
    const level = bloomsLevel || BloomsTaxonomyLevel.UNDERSTAND;

    // Extract suggestion (main feedback)
    const suggestionMatch = response.match(/(?:feedback|suggestion|assessment)[\s\S]*?(?=improvement|strength|area|resource|$)/i);
    const suggestion = suggestionMatch
      ? suggestionMatch[0].replace(/^(?:feedback|suggestion|assessment)[:\s]*/i, '').trim()
      : `The submission shows elements of ${level.toLowerCase()} skills.`;

    // Extract improvement tips
    const improvementTips: string[] = [];
    const improvementMatch = response.match(/(?:improvement|area|suggestion)[\s\S]*?(?=resource|strength|$)/i);
    if (improvementMatch) {
      const improvementText = improvementMatch[0];
      const tips = improvementText.split(/\d+\.\s|\n-\s|\n•\s/);
      tips.forEach(tip => {
        const cleanedTip = tip.replace(/^(?:improvement|area|suggestion)[:\s]*/i, '').trim();
        if (cleanedTip && cleanedTip.length > 10) {
          improvementTips.push(cleanedTip);
        }
      });
    }

    // Extract resources
    const resources: string[] = [];
    const resourceMatch = response.match(/(?:resource|material|practice)[\s\S]*?(?=$)/i);
    if (resourceMatch) {
      const resourceText = resourceMatch[0];
      const resourceItems = resourceText.split(/\d+\.\s|\n-\s|\n•\s/);
      resourceItems.forEach(item => {
        const cleanedItem = item.replace(/^(?:resource|material|practice)[:\s]*/i, '').trim();
        if (cleanedItem && cleanedItem.length > 10) {
          resources.push(cleanedItem);
        }
      });
    }

    // If we couldn't extract improvement tips or resources, provide defaults
    if (improvementTips.length === 0) {
      improvementTips.push(`Focus on developing ${level.toLowerCase()} skills through practice.`);
      improvementTips.push(`Try to apply these concepts in different contexts.`);
    }

    if (resources.length === 0) {
      resources.push(`Review related textbook chapters and class materials.`);
      resources.push(`Practice with additional exercises to strengthen these skills.`);
    }

    return [{
      bloomsLevel: level,
      suggestion,
      improvementTips,
      resources
    }];
  } catch (error) {
    console.error('Error processing agent response:', error);

    // Return a basic fallback
    return [{
      bloomsLevel: bloomsLevel || BloomsTaxonomyLevel.UNDERSTAND,
      suggestion: `The submission shows understanding of the concepts.`,
      improvementTips: [
        `Continue practicing these skills.`,
        `Try to apply these concepts in different contexts.`
      ],
      resources: [
        `Review related materials for more examples.`,
        `Practice with additional exercises.`
      ]
    }];
  }
}

export const bloomGradingRouter = createTRPCRouter({
  // Get grading context for a submission
  getGradingContext: protectedProcedure
    .input(z.object({
      submissionId: z.string(),
      contentType: z.nativeEnum(GradableContentType)
    }))
    .query(async ({ ctx, input }) => {
      const { submissionId, contentType } = input;

      try {
        // Fetch submission based on content type
        let submission;
        let rubric;
        let bloomsLevels;

        if (contentType === GradableContentType.ASSESSMENT) {
          // Fetch assessment submission
          submission = await ctx.prisma.assessmentSubmission.findUnique({
            where: { id: submissionId },
            include: {
              assessment: {
                include: {
                  bloomsRubric: true
                }
              },
              student: {
                include: {
                  user: true
                }
              }
            }
          });

          if (!submission) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Assessment submission not found"
            });
          }

          // Get rubric from assessment
          if (submission.assessment.rubricId) {
            rubric = await ctx.prisma.rubric.findUnique({
              where: { id: submission.assessment.rubricId }
            });
          } else if (submission.assessment.rubric) {
            // Use embedded rubric if available
            rubric = submission.assessment.rubric;
          }

          // Get Bloom's levels from assessment distribution
          if (submission.assessment.bloomsDistribution) {
            const distribution = submission.assessment.bloomsDistribution as Record<string, number>;
            bloomsLevels = Object.keys(distribution).filter(
              level => Object.values(BloomsTaxonomyLevel).includes(level as BloomsTaxonomyLevel)
            ) as BloomsTaxonomyLevel[];
          }
        } else if (contentType === GradableContentType.ACTIVITY) {
          // Fetch activity submission
          submission = await ctx.prisma.activityGrade.findUnique({
            where: { id: submissionId },
            include: {
              activity: true,
              student: {
                include: {
                  user: true
                }
              }
            }
          });

          if (!submission) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Activity submission not found"
            });
          }

          // Get rubric from activity
          if (submission.activity.rubricId) {
            rubric = await ctx.prisma.rubric.findUnique({
              where: { id: submission.activity.rubricId }
            });
          } else if (submission.activity.rubric) {
            // Use embedded rubric if available
            rubric = submission.activity.rubric;
          }

          // Get Bloom's levels from activity
          if (submission.activity.bloomsLevel) {
            bloomsLevels = [submission.activity.bloomsLevel as BloomsTaxonomyLevel];
          }
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unsupported content type"
          });
        }

        // Format rubric data if available
        let formattedRubric;
        if (rubric) {
          formattedRubric = {
            id: typeof rubric.id === 'string' ? rubric.id : 'embedded-rubric',
            name: rubric.name || 'Rubric',
            description: rubric.description || '',
            type: rubric.type || RubricType.ANALYTIC,
            maxScore: rubric.maxScore || 100,
            criteria: (rubric.criteria || []).map((criterion: any) => ({
              id: criterion.id,
              name: criterion.name,
              description: criterion.description,
              weight: criterion.weight,
              bloomsLevel: criterion.bloomsLevel
            })),
            performanceLevels: (rubric.performanceLevels || []).map((level: any) => ({
              id: level.id,
              name: level.name,
              description: level.description,
              scoreMultiplier: level.scoreMultiplier
            }))
          };
        }

        // Use default Bloom's levels if none found
        if (!bloomsLevels || bloomsLevels.length === 0) {
          bloomsLevels = [
            BloomsTaxonomyLevel.REMEMBER,
            BloomsTaxonomyLevel.UNDERSTAND,
            BloomsTaxonomyLevel.APPLY,
            BloomsTaxonomyLevel.ANALYZE,
            BloomsTaxonomyLevel.EVALUATE
          ];
        }

        // Format submission data
        const formattedSubmission = {
          id: submission.id,
          studentId: submission.studentId,
          studentName: submission.student?.user?.name || 'Student',
          content: submission.content,
          status: submission.status,
          submittedAt: submission.submittedAt || new Date(),
        };

        return {
          submission: formattedSubmission,
          rubric: formattedRubric,
          bloomsLevels
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error('Error fetching grading context:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch grading context"
        });
      }
    }),

  // Submit grades for a submission
  submitGrades: protectedProcedure
    .input(z.object({
      submissionId: z.string(),
      contentType: z.nativeEnum(GradableContentType),
      score: z.number(),
      feedback: z.string().optional(),
      bloomsLevelScores: z.record(z.nativeEnum(BloomsTaxonomyLevel), z.number()).optional(),
      criteriaResults: z.array(z.object({
        criterionId: z.string(),
        score: z.number(),
        feedback: z.string().optional()
      })).optional(),
      questionResults: z.array(z.object({
        questionId: z.string(),
        score: z.number(),
        maxScore: z.number(),
        feedback: z.string().optional(),
        bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional()
      })).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { submissionId, contentType, score, feedback, bloomsLevelScores, criteriaResults, questionResults } = input;

      try {
        // Prepare grading details
        const gradingDetails = {
          bloomsLevelScores,
          criteriaResults,
          questionResults,
          gradedAt: new Date(),
          gradedById: ctx.session.user.id
        };

        if (contentType === GradableContentType.ASSESSMENT) {
          // Update assessment submission
          const submission = await ctx.prisma.assessmentSubmission.findUnique({
            where: { id: submissionId },
            include: { assessment: true }
          });

          if (!submission) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Assessment submission not found"
            });
          }

          // Update the submission
          const updatedSubmission = await ctx.prisma.assessmentSubmission.update({
            where: { id: submissionId },
            data: {
              score,
              feedback: feedback || undefined,
              status: "GRADED",
              gradedAt: new Date(),
              gradedById: ctx.session.user.id,
              gradingDetails: gradingDetails as any
            }
          });

          // Create or update assessment result for analytics
          if (submission.assessment && bloomsLevelScores) {
            await ctx.prisma.assessmentResult.upsert({
              where: {
                id: `${submission.assessment.id}_${submission.studentId}`
              },
              create: {
                assessmentId: submission.assessment.id,
                studentId: submission.studentId,
                score,
                maxScore: submission.assessment.maxScore || 100,
                passingScore: submission.assessment.passingScore || 60,
                bloomsLevelScores: bloomsLevelScores as any,
                submittedAt: new Date()
              },
              update: {
                score,
                bloomsLevelScores: bloomsLevelScores as any,
                updatedAt: new Date()
              }
            });
          }

          return {
            success: true,
            submissionId,
            status: SubmissionStatus.GRADED
          };
        } else if (contentType === GradableContentType.ACTIVITY) {
          // Update activity submission
          const submission = await ctx.prisma.activityGrade.findUnique({
            where: { id: submissionId }
          });

          if (!submission) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Activity submission not found"
            });
          }

          // Update the submission
          const updatedSubmission = await ctx.prisma.activityGrade.update({
            where: { id: submissionId },
            data: {
              score,
              feedback: feedback || null,
              status: "GRADED",
              gradedAt: new Date(),
              gradedById: ctx.session.user.id,
              // Store grading details in attachments field
              attachments: {
                ...((submission.attachments as any) || {}),
                gradingDetails
              }
            }
          });

          return {
            success: true,
            submissionId,
            status: SubmissionStatus.GRADED
          };
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unsupported content type"
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error('Error submitting grades:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit grades"
        });
      }
    }),

  // Get batch grading entries
  getBatchGradingEntries: protectedProcedure
    .input(z.object({
      classId: z.string(),
      contentType: z.nativeEnum(GradableContentType),
      contentId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { classId, contentType, contentId } = input;

      try {
        if (contentType === GradableContentType.ASSESSMENT) {
          // Get assessment submissions
          const whereClause: any = {
            assessment: {
              classId
            }
          };

          // Add contentId filter if provided
          if (contentId) {
            whereClause.assessmentId = contentId;
          }

          const submissions = await ctx.prisma.assessmentSubmission.findMany({
            where: whereClause,
            include: {
              assessment: true,
              student: {
                include: {
                  user: true
                }
              }
            },
            orderBy: {
              submittedAt: 'desc'
            }
          });

          // Format submissions for batch grading
          return {
            entries: submissions.map(submission => ({
              submissionId: submission.id,
              studentId: submission.studentId,
              studentName: submission.student?.user?.name || 'Student',
              score: submission.score || 0,
              maxScore: submission.assessment?.maxScore || 100,
              feedback: submission.feedback || '',
              status: submission.status,
              submittedAt: submission.submittedAt || new Date()
            }))
          };
        } else if (contentType === GradableContentType.ACTIVITY) {
          // Get activity submissions
          const whereClause: any = {
            activity: {
              classId
            }
          };

          // Add contentId filter if provided
          if (contentId) {
            whereClause.activityId = contentId;
          }

          const submissions = await ctx.prisma.activityGrade.findMany({
            where: whereClause,
            include: {
              activity: true,
              student: {
                include: {
                  user: true
                }
              }
            },
            orderBy: {
              submittedAt: 'desc'
            }
          });

          // Format submissions for batch grading
          return {
            entries: submissions.map(submission => ({
              submissionId: submission.id,
              studentId: submission.studentId,
              studentName: submission.student?.user?.name || 'Student',
              score: submission.score || 0,
              maxScore: submission.activity?.maxScore || 100,
              feedback: submission.feedback || '',
              status: submission.status,
              submittedAt: submission.submittedAt || new Date()
            }))
          };
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unsupported content type"
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error('Error fetching batch grading entries:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch batch grading entries"
        });
      }
    }),

  // Submit batch grades
  submitBatchGrades: protectedProcedure
    .input(z.object({
      entries: z.array(z.object({
        submissionId: z.string(),
        score: z.number(),
        feedback: z.string().optional(),
        status: z.nativeEnum(SubmissionStatus),
        contentType: z.nativeEnum(GradableContentType)
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      const { entries } = input;

      try {
        // Group entries by content type for batch processing
        const assessmentEntries = entries.filter(entry => entry.contentType === GradableContentType.ASSESSMENT);
        const activityEntries = entries.filter(entry => entry.contentType === GradableContentType.ACTIVITY);

        let updatedCount = 0;

        // Process assessment submissions
        if (assessmentEntries.length > 0) {
          // Use transaction for batch updates
          await ctx.prisma.$transaction(async (prisma) => {
            for (const entry of assessmentEntries) {
              const { submissionId, score, feedback } = entry;

              // Update the submission
              await prisma.assessmentSubmission.update({
                where: { id: submissionId },
                data: {
                  score,
                  feedback: feedback || undefined,
                  status: "GRADED",
                  gradedAt: new Date(),
                  gradedById: ctx.session.user.id
                }
              });

              updatedCount++;
            }
          });
        }

        // Process activity submissions
        if (activityEntries.length > 0) {
          // Use transaction for batch updates
          await ctx.prisma.$transaction(async (prisma) => {
            for (const entry of activityEntries) {
              const { submissionId, score, feedback } = entry;

              // Update the submission
              await prisma.activityGrade.update({
                where: { id: submissionId },
                data: {
                  score,
                  feedback: feedback || undefined,
                  status: "GRADED",
                  gradedAt: new Date(),
                  gradedById: ctx.session.user.id
                }
              });

              updatedCount++;
            }
          });
        }

        return {
          success: true,
          updatedCount
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error('Error submitting batch grades:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit batch grades"
        });
      }
    }),

  // Generate AI feedback
  generateFeedback: protectedProcedure
    .input(z.object({
      submissionContent: z.string(),
      studentName: z.string(),
      bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { submissionContent, studentName, bloomsLevel } = input;

      try {
        // For now, generate a simulated response since the agent system may not be fully implemented
        // This is a temporary solution until the agent system is properly integrated

        // Prepare a simulated response based on the input
        let response = '';

        // Generate different responses based on the Bloom's level
        if (bloomsLevel) {
          const levelName = bloomsLevel.charAt(0) + bloomsLevel.slice(1).toLowerCase();

          response = `
            # Feedback for ${studentName}

            ## Assessment (${levelName} Level)
            ${studentName} demonstrates ${bloomsLevel.toLowerCase()} skills in their submission.
            The work shows ${bloomsLevel === BloomsTaxonomyLevel.REMEMBER ? 'recall of key facts' :
              bloomsLevel === BloomsTaxonomyLevel.UNDERSTAND ? 'comprehension of the main concepts' :
              bloomsLevel === BloomsTaxonomyLevel.APPLY ? 'application of concepts to solve problems' :
              bloomsLevel === BloomsTaxonomyLevel.ANALYZE ? 'analysis of relationships between concepts' :
              bloomsLevel === BloomsTaxonomyLevel.EVALUATE ? 'evaluation of ideas and making judgments' :
              'creation of original work using learned concepts'}.

            ## Strengths
            - Good demonstration of ${bloomsLevel.toLowerCase()} skills
            - Clear organization of ideas

            ## Areas for Improvement
            - Expand on explanations to show deeper understanding
            - Connect concepts more explicitly to demonstrate mastery

            ## Suggested Activities
            - Practice with more complex examples
            - Review related materials to strengthen understanding
          `;
        } else {
          response = `
            # Feedback for ${studentName}

            ## Assessment
            ${studentName}'s submission demonstrates understanding of the core concepts.

            ## Strengths
            - Clear presentation of ideas
            - Good organization of content

            ## Areas for Improvement
            - Expand explanations to show deeper understanding
            - Connect concepts more explicitly

            ## Suggested Activities
            - Practice with additional examples
            - Review related materials
          `;
        }

        // Process the response to extract structured feedback
        const processedResponse = processAgentResponseHelper(response, bloomsLevel);

        return {
          suggestions: processedResponse
        };
      } catch (error) {
        console.error('Error generating feedback:', error);

        // Fallback to basic feedback if agent system fails
        const level = bloomsLevel || BloomsTaxonomyLevel.UNDERSTAND;
        const levelName = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();

        return {
          suggestions: [
            {
              bloomsLevel: level,
              suggestion: `${studentName} demonstrates ${levelName} skills in this submission.`,
              improvementTips: [
                `To further develop ${level.toLowerCase()} skills, focus on more detailed explanations.`,
                `Practice applying these concepts in different contexts.`
              ],
              resources: [
                `Review related materials for more examples.`,
                `Practice with additional exercises to strengthen these skills.`
              ]
            }
          ]
        };
      }
    }),

  // Helper function to process agent response into structured feedback
  processAgentResponse: protectedProcedure
    .input(z.object({
      response: z.string(),
      bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional()
    }))
    .query(({ input }) => {
      const { response, bloomsLevel } = input;
      return processAgentResponseHelper(response, bloomsLevel);
    }),

  // Get grading result
  getGradingResult: protectedProcedure
    .input(z.object({
      submissionId: z.string(),
      contentType: z.nativeEnum(GradableContentType)
    }))
    .query(async ({ ctx, input }) => {
      const { submissionId, contentType } = input;

      try {
        if (contentType === GradableContentType.ASSESSMENT) {
          // Fetch assessment submission
          const submission = await ctx.prisma.assessmentSubmission.findUnique({
            where: { id: submissionId },
            include: {
              assessment: true,
              student: {
                include: {
                  user: true
                }
              }
            }
          });

          if (!submission) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Assessment submission not found"
            });
          }

          // Check if the submission has been graded
          if (submission.status !== "GRADED") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Submission has not been graded yet"
            });
          }

          // Extract grading details
          const gradingDetails = submission.gradingDetails as any || {};

          // Determine if the submission passed
          const passingScore = submission.assessment?.passingScore || 60;
          const passed = (submission.score || 0) >= passingScore;

          return {
            submissionId,
            score: submission.score || 0,
            maxScore: submission.assessment?.maxScore || 100,
            passed,
            feedback: submission.feedback || "",
            gradedAt: submission.gradedAt || new Date(),
            bloomsLevelScores: gradingDetails.bloomsLevelScores || {},
            criteriaResults: gradingDetails.criteriaResults || [],
            questionResults: gradingDetails.questionResults || []
          };
        } else if (contentType === GradableContentType.ACTIVITY) {
          // Fetch activity submission
          const submission = await ctx.prisma.activityGrade.findUnique({
            where: { id: submissionId },
            include: {
              activity: true,
              student: {
                include: {
                  user: true
                }
              }
            }
          });

          if (!submission) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Activity submission not found"
            });
          }

          // Check if the submission has been graded
          if (submission.status !== "GRADED") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Submission has not been graded yet"
            });
          }

          // Extract grading details from attachments
          const attachments = submission.attachments as any || {};
          const gradingDetails = attachments.gradingDetails || {};

          // Determine if the submission passed
          const passingScore = submission.activity?.passingScore || 60;
          const passed = (submission.score || 0) >= passingScore;

          return {
            submissionId,
            score: submission.score || 0,
            maxScore: submission.activity?.maxScore || 100,
            passed,
            feedback: submission.feedback || "",
            gradedAt: submission.gradedAt || new Date(),
            bloomsLevelScores: gradingDetails.bloomsLevelScores || {},
            criteriaResults: gradingDetails.criteriaResults || [],
            questionResults: gradingDetails.questionResults || []
          };
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unsupported content type"
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error('Error fetching grading result:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch grading result"
        });
      }
    })
});
