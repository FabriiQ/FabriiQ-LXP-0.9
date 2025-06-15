-- Add totalPoints field to TeacherProfile
ALTER TABLE "teacher_profiles" ADD COLUMN IF NOT EXISTS "totalPoints" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "teacher_profiles_totalPoints_idx" ON "teacher_profiles"("totalPoints");

-- Create TeacherPoints table
CREATE TABLE IF NOT EXISTS "teacher_points" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "classId" TEXT,
    "subjectId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
    "partitionKey" TEXT,

    CONSTRAINT "teacher_points_pkey" PRIMARY KEY ("id")
);

-- Create TeacherPointsAggregate table
CREATE TABLE IF NOT EXISTS "teacher_points_aggregate" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT,
    "subjectId" TEXT,
    "courseId" TEXT,
    "programId" TEXT,
    "campusId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "dailyPoints" INTEGER NOT NULL DEFAULT 0,
    "weeklyPoints" INTEGER NOT NULL DEFAULT 0,
    "monthlyPoints" INTEGER NOT NULL DEFAULT 0,
    "termPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
    "partitionKey" TEXT,

    CONSTRAINT "teacher_points_aggregate_pkey" PRIMARY KEY ("id")
);

-- Create TeacherAchievement table
CREATE TABLE IF NOT EXISTS "teacher_achievements" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "unlockedAt" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
    "partitionKey" TEXT,

    CONSTRAINT "teacher_achievements_pkey" PRIMARY KEY ("id")
);

-- Create TeacherPerformanceMetrics table
CREATE TABLE IF NOT EXISTS "teacher_performance_metrics" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT,
    "subjectId" TEXT,
    "courseId" TEXT,
    "programId" TEXT,
    "timeframe" TEXT NOT NULL DEFAULT 'all-time',
    "attendanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feedbackTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activityCreation" INTEGER NOT NULL DEFAULT 0,
    "activityEngagement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "classPerformance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
    "partitionKey" TEXT,

    CONSTRAINT "teacher_performance_metrics_pkey" PRIMARY KEY ("id")
);

-- Create indexes for TeacherPoints
CREATE INDEX IF NOT EXISTS "teacher_points_teacherId_idx" ON "teacher_points"("teacherId");
CREATE INDEX IF NOT EXISTS "teacher_points_classId_idx" ON "teacher_points"("classId");
CREATE INDEX IF NOT EXISTS "teacher_points_subjectId_idx" ON "teacher_points"("subjectId");
CREATE INDEX IF NOT EXISTS "teacher_points_source_idx" ON "teacher_points"("source");
CREATE INDEX IF NOT EXISTS "teacher_points_createdAt_idx" ON "teacher_points"("createdAt");
CREATE INDEX IF NOT EXISTS "teacher_points_status_idx" ON "teacher_points"("status");
CREATE INDEX IF NOT EXISTS "teacher_points_partitionKey_idx" ON "teacher_points"("partitionKey");

-- Create indexes for TeacherPointsAggregate
CREATE INDEX IF NOT EXISTS "teacher_points_aggregate_teacherId_idx" ON "teacher_points_aggregate"("teacherId");
CREATE INDEX IF NOT EXISTS "teacher_points_aggregate_classId_idx" ON "teacher_points_aggregate"("classId");
CREATE INDEX IF NOT EXISTS "teacher_points_aggregate_subjectId_idx" ON "teacher_points_aggregate"("subjectId");
CREATE INDEX IF NOT EXISTS "teacher_points_aggregate_courseId_idx" ON "teacher_points_aggregate"("courseId");
CREATE INDEX IF NOT EXISTS "teacher_points_aggregate_programId_idx" ON "teacher_points_aggregate"("programId");
CREATE INDEX IF NOT EXISTS "teacher_points_aggregate_campusId_idx" ON "teacher_points_aggregate"("campusId");
CREATE INDEX IF NOT EXISTS "teacher_points_aggregate_date_idx" ON "teacher_points_aggregate"("date");
CREATE INDEX IF NOT EXISTS "teacher_points_aggregate_status_idx" ON "teacher_points_aggregate"("status");
CREATE INDEX IF NOT EXISTS "teacher_points_aggregate_partitionKey_idx" ON "teacher_points_aggregate"("partitionKey");

-- Create indexes for TeacherAchievement
CREATE INDEX IF NOT EXISTS "teacher_achievements_teacherId_idx" ON "teacher_achievements"("teacherId");
CREATE INDEX IF NOT EXISTS "teacher_achievements_type_idx" ON "teacher_achievements"("type");
CREATE INDEX IF NOT EXISTS "teacher_achievements_unlocked_idx" ON "teacher_achievements"("unlocked");
CREATE INDEX IF NOT EXISTS "teacher_achievements_status_idx" ON "teacher_achievements"("status");
CREATE INDEX IF NOT EXISTS "teacher_achievements_partitionKey_idx" ON "teacher_achievements"("partitionKey");

-- Create indexes for TeacherPerformanceMetrics
CREATE INDEX IF NOT EXISTS "teacher_performance_metrics_teacherId_idx" ON "teacher_performance_metrics"("teacherId");
CREATE INDEX IF NOT EXISTS "teacher_performance_metrics_classId_idx" ON "teacher_performance_metrics"("classId");
CREATE INDEX IF NOT EXISTS "teacher_performance_metrics_subjectId_idx" ON "teacher_performance_metrics"("subjectId");
CREATE INDEX IF NOT EXISTS "teacher_performance_metrics_courseId_idx" ON "teacher_performance_metrics"("courseId");
CREATE INDEX IF NOT EXISTS "teacher_performance_metrics_programId_idx" ON "teacher_performance_metrics"("programId");
CREATE INDEX IF NOT EXISTS "teacher_performance_metrics_timeframe_idx" ON "teacher_performance_metrics"("timeframe");
CREATE INDEX IF NOT EXISTS "teacher_performance_metrics_date_idx" ON "teacher_performance_metrics"("date");
CREATE INDEX IF NOT EXISTS "teacher_performance_metrics_status_idx" ON "teacher_performance_metrics"("status");
CREATE INDEX IF NOT EXISTS "teacher_performance_metrics_partitionKey_idx" ON "teacher_performance_metrics"("partitionKey");

-- Add foreign key constraints
ALTER TABLE "teacher_points" ADD CONSTRAINT "teacher_points_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_points" ADD CONSTRAINT "teacher_points_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teacher_points" ADD CONSTRAINT "teacher_points_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "teacher_points_aggregate" ADD CONSTRAINT "teacher_points_aggregate_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_points_aggregate" ADD CONSTRAINT "teacher_points_aggregate_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teacher_points_aggregate" ADD CONSTRAINT "teacher_points_aggregate_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teacher_points_aggregate" ADD CONSTRAINT "teacher_points_aggregate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teacher_points_aggregate" ADD CONSTRAINT "teacher_points_aggregate_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "teacher_achievements" ADD CONSTRAINT "teacher_achievements_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "teacher_performance_metrics" ADD CONSTRAINT "teacher_performance_metrics_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_performance_metrics" ADD CONSTRAINT "teacher_performance_metrics_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teacher_performance_metrics" ADD CONSTRAINT "teacher_performance_metrics_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teacher_performance_metrics" ADD CONSTRAINT "teacher_performance_metrics_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
