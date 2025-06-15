-- CreateTable
CREATE TABLE "reward_points_config" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT,
  
  -- Student Activity Points
  "quizPoints" INTEGER NOT NULL DEFAULT 20,
  "multipleChoicePoints" INTEGER NOT NULL DEFAULT 20,
  "multipleResponsePoints" INTEGER NOT NULL DEFAULT 25,
  "fillInTheBlanksPoints" INTEGER NOT NULL DEFAULT 30,
  "matchingPoints" INTEGER NOT NULL DEFAULT 35,
  "sequencePoints" INTEGER NOT NULL DEFAULT 35,
  "dragAndDropPoints" INTEGER NOT NULL DEFAULT 40,
  "dragTheWordsPoints" INTEGER NOT NULL DEFAULT 40,
  "numericPoints" INTEGER NOT NULL DEFAULT 30,
  "trueFalsePoints" INTEGER NOT NULL DEFAULT 15,
  "readingPoints" INTEGER NOT NULL DEFAULT 10,
  "videoPoints" INTEGER NOT NULL DEFAULT 15,
  "h5pPoints" INTEGER NOT NULL DEFAULT 25,
  "flashCardsPoints" INTEGER NOT NULL DEFAULT 20,
  "assignmentPoints" INTEGER NOT NULL DEFAULT 30,
  "projectPoints" INTEGER NOT NULL DEFAULT 50,
  "discussionPoints" INTEGER NOT NULL DEFAULT 15,
  
  -- Student Achievement Points
  "perfectScorePoints" INTEGER NOT NULL DEFAULT 50,
  "loginStreakBasePoints" INTEGER NOT NULL DEFAULT 5,
  "loginStreakBonusPoints" INTEGER NOT NULL DEFAULT 5,
  "highAchiever5Points" INTEGER NOT NULL DEFAULT 10,
  "highAchiever10Points" INTEGER NOT NULL DEFAULT 20,
  "highAchiever25Points" INTEGER NOT NULL DEFAULT 50,
  "highAchiever50Points" INTEGER NOT NULL DEFAULT 100,
  "highAchiever100Points" INTEGER NOT NULL DEFAULT 200,
  
  -- Teacher Points
  "lessonPlanCreationPoints" INTEGER NOT NULL DEFAULT 20,
  "lessonPlanApprovalPoints" INTEGER NOT NULL DEFAULT 10,
  "activityCreationPoints" INTEGER NOT NULL DEFAULT 15,
  "h5pContentCreationPoints" INTEGER NOT NULL DEFAULT 25,
  "gradeSubmissionPoints" INTEGER NOT NULL DEFAULT 5,
  "perfectAttendancePoints" INTEGER NOT NULL DEFAULT 50,
  "studentFeedbackPoints" INTEGER NOT NULL DEFAULT 10,
  "classPerformanceBonusPoints" INTEGER NOT NULL DEFAULT 100,
  
  -- Coordinator Points
  "lessonPlanReviewPoints" INTEGER NOT NULL DEFAULT 15,
  "teacherObservationPoints" INTEGER NOT NULL DEFAULT 25,
  "programDevelopmentPoints" INTEGER NOT NULL DEFAULT 50,
  "teacherMentoringPoints" INTEGER NOT NULL DEFAULT 30,
  "parentMeetingPoints" INTEGER NOT NULL DEFAULT 20,
  "studentCounselingPoints" INTEGER NOT NULL DEFAULT 15,
  
  -- Metadata
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "reward_points_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reward_points_config_institutionId_idx" ON "reward_points_config"("institutionId");
CREATE INDEX "reward_points_config_isActive_idx" ON "reward_points_config"("isActive");

-- AddForeignKey
ALTER TABLE "reward_points_config" ADD CONSTRAINT "reward_points_config_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
