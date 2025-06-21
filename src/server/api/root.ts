/**
 * Root Router
 * Combines all API routers
 */

import { TRPCError } from "@trpc/server";
import { createTRPCRouter } from "./trpc";
import { authRouter } from "./routers/auth";
import { userRouter } from "./routers/user";
import { institutionRouter } from "./routers/institution";
import { campusRouter } from "./routers/campus";
import { programRouter } from "./routers/program";
import { courseRouter } from "./routers/course";
import { subjectRouter } from "./routers/subject";
import { classRouter } from "./routers/class";
import { assessmentRouter } from "./routers/assessment";
import { essayAssessmentRouter } from "./routers/essay-assessment";
import { submissionRouter } from "./routers/submission";
import { feedbackRouter } from "./routers/feedback";
import { analyticsRouter } from "./routers/analytics";
import { activityRouter } from "./routers/activity";
import { fileStorageRouter } from "./routers/file-storage";
import { permissionRouter } from "./routers/permission";
import { curriculumRouter } from "./routers/curriculum";
import { termRouter } from "./routers/term";
import { scheduleRouter } from "./routers/schedule";
import { schedulePatternRouter } from "./routers/schedule-pattern";
import { attendanceRouter } from "./routers/attendance";
import { gradeRouter } from "./routers/grade";
import { assignmentRouter } from "./routers/assignment";
import { resourceRouter } from "./routers/resource";
import { notificationRouter } from "./routers/notification";
import { docsRouter } from "./routers/docs";
import { enrollmentRouter } from "./routers/enrollment";
import { communicationRouter } from "./routers/communication";
import { exampleRouter } from "./routers/example.router";
import { gradingRouter } from "./routers/grading";
import { policyRouter } from "./routers/policy";
import { subjectTopicRouter } from "./routers/subjectTopic";
import { activityGradeRouter } from "./routers/activityGrade";
import { facilityRouter } from "./routers/facility";
import { studentRouter } from "./routers/student";
import { teacherRouter } from "./routers/teacher";
import { coordinatorRouter } from "./routers/coordinator";
import { programAnalyticsRouter } from "./routers/program-analytics";
import { teacherAssignmentRouter } from "./routers/teacher-assignment";
import { studentPerformanceRouter } from "./routers/student-performance";
import { teacherRoleRouter } from "./routers/teacher-role";
import { leaderboardRouter } from "./routers/leaderboard";
import { unifiedLeaderboardRouter } from "./routers/unified-leaderboard";
import { systemAnalyticsRouter } from "./routers/system-analytics";
import { campusAnalyticsRouter } from "./routers/campus-analytics";
import { campusAttendanceAnalyticsRouter } from "./routers/campus-attendance-analytics";
import { gradebookRouter } from "./routers/gradebook";
import { classAnalyticsRouter } from "./routers/class-analytics";
import { courseAnalyticsRouter } from "./routers/course-analytics";
import { worksheetRouter } from "./routers/worksheet";
import { aiContentStudioRouter } from "./routers/ai-content-studio";
import { activityTeacherRouter } from "./routers/activity-teacher";
import { classTeacherRouter } from "./routers/class-teacher";
import { lessonPlanRouter } from "./routers/lesson-plan";
import { canvasRouter } from "./routers/canvas";

// Fee Management Routers
import { feeStructureRouter } from "./routers/fee-structure";
import { discountTypeRouter } from "./routers/discount-type";
import { enrollmentFeeRouter } from "./routers/enrollment-fee";
import { challanRouter } from "./routers/challan";

// Reward System Routers
import { achievementRouter } from "./routers/achievement";
import { pointsRouter } from "./routers/points";
import { levelRouter } from "./routers/level";
import { learningGoalRouter } from "./routers/learning-goal";
import { journeyEventRouter } from "./routers/journey-event";
import { personalBestRouter } from "./routers/personal-best";
import { commitmentContractRouter } from "./routers/commitment-contract";
import { activityJourneyRouter } from "./routers/activity-journey";
import { activitiesRouter } from "./routers/activities";
import { rewardsRouter } from "./routers/rewards";
import { rewardConfigRouter } from "./routers/reward-config";

// Background Jobs Router
import { backgroundJobsRouter } from "./routers/background-jobs";

// Question Bank Router
import { questionBankRouter, questionUsageRouter } from "@/features/question-bank/api";

// Learning Time Router
import { learningTimeRouter } from "./routers/learning-time";
import { learningTimeRecordRouter } from "./routers/learningTimeRecord";
import { teacherAnalyticsRouter } from "./routers/teacher-analytics";
import { teacherLeaderboardRouter } from "./routers/teacher-leaderboard";
import { classTransferRouter } from "./routers/class-transfer";
import { teacherPointsRouter } from "./routers/teacher-points";
import { coordinatorAnalyticsRouter } from "./routers/coordinator-analytics";
import { classPerformanceRouter } from "./routers/class-performance";
import { studentAssistantRouter } from "./routers/student-assistant";
import { teacherAssistantRouter } from "./routers/teacher-assistant";
import { learningOutcomeRouter } from "./routers/learning-outcome";

// Bloom's Taxonomy Routers
import { bloomRouter, masteryRouter, rubricRouter } from "@/features/bloom/api";
import { bloomsAnalyticsRouter } from "@/features/bloom/api/blooms-analytics.router";
import { bloomGradingRouter } from "./routers/bloom-grading";
import { gradebookBloomIntegrationRouter } from "./routers/gradebook-bloom-integration";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  institution: institutionRouter,
  campus: campusRouter,
  program: programRouter,
  course: courseRouter,
  subject: subjectRouter,
  class: classRouter,
  assessment: assessmentRouter,
  essayAssessment: essayAssessmentRouter,
  submission: submissionRouter,
  feedback: feedbackRouter,
  analytics: analyticsRouter,
  activity: activityRouter,
  fileStorage: fileStorageRouter,
  permission: permissionRouter,
  curriculum: curriculumRouter,
  term: termRouter,
  schedule: scheduleRouter,
  attendance: attendanceRouter,
  grade: gradeRouter,
  assignment: assignmentRouter,
  resource: resourceRouter,
  notification: notificationRouter,
  enrollment: enrollmentRouter,
  communication: communicationRouter,
  docs: docsRouter,
  example: exampleRouter,
  grading: gradingRouter,
  policy: policyRouter,
  subjectTopic: subjectTopicRouter,
  activityGrade: activityGradeRouter,
  facility: facilityRouter,
  student: studentRouter,
  teacher: teacherRouter,
  coordinator: coordinatorRouter,
  programAnalytics: programAnalyticsRouter,
  teacherAssignment: teacherAssignmentRouter,
  studentPerformance: studentPerformanceRouter,
  teacherRole: teacherRoleRouter,
  leaderboard: leaderboardRouter,
  unifiedLeaderboard: unifiedLeaderboardRouter,
  systemAnalytics: systemAnalyticsRouter,
  campusAnalytics: campusAnalyticsRouter,
  campusAttendanceAnalytics: campusAttendanceAnalyticsRouter,
  gradebook: gradebookRouter,
  schedulePattern: schedulePatternRouter,
  classAnalytics: classAnalyticsRouter,
  courseAnalytics: courseAnalyticsRouter,
  worksheet: worksheetRouter,
  aiContentStudio: aiContentStudioRouter,
  activityTeacher: activityTeacherRouter,
  classTeacher: classTeacherRouter,
  lessonPlan: lessonPlanRouter,
  canvas: canvasRouter,

  // Fee Management Routers
  feeStructure: feeStructureRouter,
  discountType: discountTypeRouter,
  enrollmentFee: enrollmentFeeRouter,
  challan: challanRouter,

  // Reward System Routers
  achievement: achievementRouter,
  points: pointsRouter,
  level: levelRouter,
  learningGoal: learningGoalRouter,
  journeyEvent: journeyEventRouter,
  personalBest: personalBestRouter,
  commitmentContract: commitmentContractRouter,
  activityJourney: activityJourneyRouter,
  rewards: rewardsRouter,
  rewardConfig: rewardConfigRouter,

  // Background Jobs Router
  backgroundJobs: backgroundJobsRouter,

  // Question Bank Router
  questionBank: questionBankRouter,
  questionUsage: questionUsageRouter,

  // Learning Time Router
  learningTime: learningTimeRouter,
  learningTimeRecord: learningTimeRecordRouter,

  // Teacher Management Routers
  teacherAnalytics: teacherAnalyticsRouter,
  teacherLeaderboard: teacherLeaderboardRouter,
  teacherPoints: teacherPointsRouter,
  classTransfer: classTransferRouter,

  // Coordinator Management Routers
  coordinatorAnalytics: coordinatorAnalyticsRouter,

  // Class Performance Router
  classPerformance: classPerformanceRouter,

  // Activities Router
  activities: activitiesRouter,

  // Student Assistant Router
  studentAssistant: studentAssistantRouter,

  // Teacher Assistant Router
  teacherAssistant: teacherAssistantRouter,

  // Learning Outcome Router
  learningOutcome: learningOutcomeRouter,

  // Bloom's Taxonomy Routers
  bloom: bloomRouter,
  mastery: masteryRouter,
  rubric: rubricRouter,
  bloomsAnalytics: bloomsAnalyticsRouter,
  bloomGrading: bloomGradingRouter,
  gradebookBloomIntegration: gradebookBloomIntegrationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

