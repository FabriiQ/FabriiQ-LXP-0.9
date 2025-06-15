import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { UserType, PrismaClient } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";

// Define extended PrismaClient type with RewardPointsConfig
type ExtendedPrismaClient = PrismaClient & {
  rewardPointsConfig: {
    findFirst: (args: any) => Promise<any>;
    updateMany: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
  }
};

// Define the schema for student activity points
const studentActivityPointsSchema = z.object({
  quiz: z.number().min(0),
  multipleChoice: z.number().min(0),
  multipleResponse: z.number().min(0),
  fillInTheBlanks: z.number().min(0),
  matching: z.number().min(0),
  sequence: z.number().min(0),
  dragAndDrop: z.number().min(0),
  dragTheWords: z.number().min(0),
  numeric: z.number().min(0),
  trueFalse: z.number().min(0),
  reading: z.number().min(0),
  video: z.number().min(0),
  h5p: z.number().min(0),
  flashCards: z.number().min(0),
  assignment: z.number().min(0),
  project: z.number().min(0),
  discussion: z.number().min(0),
});

// Define the schema for student achievement points
const studentAchievementPointsSchema = z.object({
  perfectScore: z.number().min(0),
  loginStreak: z.number().min(0),
  loginStreakBonus: z.number().min(0),
  highAchiever5: z.number().min(0),
  highAchiever10: z.number().min(0),
  highAchiever25: z.number().min(0),
  highAchiever50: z.number().min(0),
  highAchiever100: z.number().min(0),
});

// Define the schema for teacher points
const teacherPointsSchema = z.object({
  lessonPlanCreation: z.number().min(0),
  lessonPlanApproval: z.number().min(0),
  activityCreation: z.number().min(0),
  h5pContentCreation: z.number().min(0),
  gradeSubmission: z.number().min(0),
  perfectAttendance: z.number().min(0),
  studentFeedback: z.number().min(0),
  classPerformanceBonus: z.number().min(0),
});

// Define the schema for coordinator points
const coordinatorPointsSchema = z.object({
  lessonPlanReview: z.number().min(0),
  teacherObservation: z.number().min(0),
  programDevelopment: z.number().min(0),
  teacherMentoring: z.number().min(0),
  parentMeeting: z.number().min(0),
  studentCounseling: z.number().min(0),
});

// Combine all schemas
const rewardPointsConfigSchema = z.object({
  studentActivityPoints: studentActivityPointsSchema,
  studentAchievementPoints: studentAchievementPointsSchema,
  teacherPoints: teacherPointsSchema,
  coordinatorPoints: coordinatorPointsSchema,
});

/**
 * Reward Config Router
 *
 * This router provides endpoints for managing reward point configurations.
 */
export const rewardConfigRouter = createTRPCRouter({
  /**
   * Get the current reward points configuration
   */
  getRewardPointsConfig: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }

        // Get the user's institution ID
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { institutionId: true, userType: true },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Get the reward points configuration for the institution
        const config = await (ctx.prisma as unknown as ExtendedPrismaClient).rewardPointsConfig.findFirst({
          where: {
            institutionId: user.institutionId,
            isActive: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        });

        if (!config) {
          // Return default configuration if none exists
          return {
            studentActivityPoints: {
              quiz: 20,
              multipleChoice: 20,
              multipleResponse: 25,
              fillInTheBlanks: 30,
              matching: 35,
              sequence: 35,
              dragAndDrop: 40,
              dragTheWords: 40,
              numeric: 30,
              trueFalse: 15,
              reading: 10,
              video: 15,
              h5p: 25,
              flashCards: 20,
              assignment: 30,
              project: 50,
              discussion: 15,
            },
            studentAchievementPoints: {
              perfectScore: 50,
              loginStreak: 5,
              loginStreakBonus: 5,
              highAchiever5: 10,
              highAchiever10: 20,
              highAchiever25: 50,
              highAchiever50: 100,
              highAchiever100: 200,
            },
            teacherPoints: {
              lessonPlanCreation: 20,
              lessonPlanApproval: 10,
              activityCreation: 15,
              h5pContentCreation: 25,
              gradeSubmission: 5,
              perfectAttendance: 50,
              studentFeedback: 10,
              classPerformanceBonus: 100,
            },
            coordinatorPoints: {
              lessonPlanReview: 15,
              teacherObservation: 25,
              programDevelopment: 50,
              teacherMentoring: 30,
              parentMeeting: 20,
              studentCounseling: 15,
            },
          };
        }

        // Map the database model to the expected format
        return {
          studentActivityPoints: {
            quiz: config.quizPoints,
            multipleChoice: config.multipleChoicePoints,
            multipleResponse: config.multipleResponsePoints,
            fillInTheBlanks: config.fillInTheBlanksPoints,
            matching: config.matchingPoints,
            sequence: config.sequencePoints,
            dragAndDrop: config.dragAndDropPoints,
            dragTheWords: config.dragTheWordsPoints,
            numeric: config.numericPoints,
            trueFalse: config.trueFalsePoints,
            reading: config.readingPoints,
            video: config.videoPoints,
            h5p: config.h5pPoints,
            flashCards: config.flashCardsPoints,
            assignment: config.assignmentPoints,
            project: config.projectPoints,
            discussion: config.discussionPoints,
          },
          studentAchievementPoints: {
            perfectScore: config.perfectScorePoints,
            loginStreak: config.loginStreakBasePoints,
            loginStreakBonus: config.loginStreakBonusPoints,
            highAchiever5: config.highAchiever5Points,
            highAchiever10: config.highAchiever10Points,
            highAchiever25: config.highAchiever25Points,
            highAchiever50: config.highAchiever50Points,
            highAchiever100: config.highAchiever100Points,
          },
          teacherPoints: {
            lessonPlanCreation: config.lessonPlanCreationPoints,
            lessonPlanApproval: config.lessonPlanApprovalPoints,
            activityCreation: config.activityCreationPoints,
            h5pContentCreation: config.h5pContentCreationPoints,
            gradeSubmission: config.gradeSubmissionPoints,
            perfectAttendance: config.perfectAttendancePoints,
            studentFeedback: config.studentFeedbackPoints,
            classPerformanceBonus: config.classPerformanceBonusPoints,
          },
          coordinatorPoints: {
            lessonPlanReview: config.lessonPlanReviewPoints,
            teacherObservation: config.teacherObservationPoints,
            programDevelopment: config.programDevelopmentPoints,
            teacherMentoring: config.teacherMentoringPoints,
            parentMeeting: config.parentMeetingPoints,
            studentCounseling: config.studentCounselingPoints,
          },
        };
      } catch (error) {
        logger.error("Error getting reward points configuration", { error });
        throw error;
      }
    }),

  /**
   * Update the reward points configuration
   */
  updateRewardPointsConfig: protectedProcedure
    .input(rewardPointsConfigSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }

        // Get the user's institution ID and ensure they are a system admin
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { institutionId: true, userType: true },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Check if user is a system admin
        if (user.userType !== UserType.SYSTEM_ADMIN) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only system administrators can update reward point configurations",
          });
        }

        // Deactivate any existing configurations
        await (ctx.prisma as unknown as ExtendedPrismaClient).rewardPointsConfig.updateMany({
          where: {
            institutionId: user.institutionId,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });

        // Create a new configuration
        const newConfig = await (ctx.prisma as unknown as ExtendedPrismaClient).rewardPointsConfig.create({
          data: {
            institutionId: user.institutionId,

            // Student Activity Points
            quizPoints: input.studentActivityPoints.quiz,
            multipleChoicePoints: input.studentActivityPoints.multipleChoice,
            multipleResponsePoints: input.studentActivityPoints.multipleResponse,
            fillInTheBlanksPoints: input.studentActivityPoints.fillInTheBlanks,
            matchingPoints: input.studentActivityPoints.matching,
            sequencePoints: input.studentActivityPoints.sequence,
            dragAndDropPoints: input.studentActivityPoints.dragAndDrop,
            dragTheWordsPoints: input.studentActivityPoints.dragTheWords,
            numericPoints: input.studentActivityPoints.numeric,
            trueFalsePoints: input.studentActivityPoints.trueFalse,
            readingPoints: input.studentActivityPoints.reading,
            videoPoints: input.studentActivityPoints.video,
            h5pPoints: input.studentActivityPoints.h5p,
            flashCardsPoints: input.studentActivityPoints.flashCards,
            assignmentPoints: input.studentActivityPoints.assignment,
            projectPoints: input.studentActivityPoints.project,
            discussionPoints: input.studentActivityPoints.discussion,

            // Student Achievement Points
            perfectScorePoints: input.studentAchievementPoints.perfectScore,
            loginStreakBasePoints: input.studentAchievementPoints.loginStreak,
            loginStreakBonusPoints: input.studentAchievementPoints.loginStreakBonus,
            highAchiever5Points: input.studentAchievementPoints.highAchiever5,
            highAchiever10Points: input.studentAchievementPoints.highAchiever10,
            highAchiever25Points: input.studentAchievementPoints.highAchiever25,
            highAchiever50Points: input.studentAchievementPoints.highAchiever50,
            highAchiever100Points: input.studentAchievementPoints.highAchiever100,

            // Teacher Points
            lessonPlanCreationPoints: input.teacherPoints.lessonPlanCreation,
            lessonPlanApprovalPoints: input.teacherPoints.lessonPlanApproval,
            activityCreationPoints: input.teacherPoints.activityCreation,
            h5pContentCreationPoints: input.teacherPoints.h5pContentCreation,
            gradeSubmissionPoints: input.teacherPoints.gradeSubmission,
            perfectAttendancePoints: input.teacherPoints.perfectAttendance,
            studentFeedbackPoints: input.teacherPoints.studentFeedback,
            classPerformanceBonusPoints: input.teacherPoints.classPerformanceBonus,

            // Coordinator Points
            lessonPlanReviewPoints: input.coordinatorPoints.lessonPlanReview,
            teacherObservationPoints: input.coordinatorPoints.teacherObservation,
            programDevelopmentPoints: input.coordinatorPoints.programDevelopment,
            teacherMentoringPoints: input.coordinatorPoints.teacherMentoring,
            parentMeetingPoints: input.coordinatorPoints.parentMeeting,
            studentCounselingPoints: input.coordinatorPoints.studentCounseling,

            isActive: true,
          },
        });

        return {
          success: true,
          message: "Reward points configuration updated successfully",
          configId: newConfig.id,
        };
      } catch (error) {
        logger.error("Error updating reward points configuration", { error });
        throw error;
      }
    }),
});
