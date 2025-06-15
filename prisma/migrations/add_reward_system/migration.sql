-- Add new fields to StudentProfile
ALTER TABLE "student_profiles" ADD COLUMN "totalPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "student_profiles" ADD COLUMN "currentLevel" INTEGER NOT NULL DEFAULT 1;

-- Create StudentAchievement table
CREATE TABLE "student_achievements" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "classId" TEXT,
    "subjectId" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3),
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "student_achievements_pkey" PRIMARY KEY ("id")
);

-- Create StudentPoints table
CREATE TABLE "student_points" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "classId" TEXT,
    "subjectId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "student_points_pkey" PRIMARY KEY ("id")
);

-- Create StudentLevel table
CREATE TABLE "student_levels" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentExp" INTEGER NOT NULL DEFAULT 0,
    "nextLevelExp" INTEGER NOT NULL DEFAULT 100,
    "classId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "student_levels_pkey" PRIMARY KEY ("id")
);

-- Create LeaderboardSnapshot table
CREATE TABLE "leaderboard_snapshots" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entries" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "leaderboard_snapshots_pkey" PRIMARY KEY ("id")
);

-- Create StudentPointsAggregate table
CREATE TABLE "student_points_aggregates" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT,
    "subjectId" TEXT,
    "courseId" TEXT,
    "campusId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "dailyPoints" INTEGER NOT NULL DEFAULT 0,
    "weeklyPoints" INTEGER NOT NULL DEFAULT 0,
    "monthlyPoints" INTEGER NOT NULL DEFAULT 0,
    "termPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_points_aggregates_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "student_achievements_studentId_idx" ON "student_achievements"("studentId");
CREATE INDEX "student_achievements_classId_idx" ON "student_achievements"("classId");
CREATE INDEX "student_achievements_subjectId_idx" ON "student_achievements"("subjectId");
CREATE INDEX "student_achievements_type_idx" ON "student_achievements"("type");

CREATE INDEX "student_points_studentId_idx" ON "student_points"("studentId");
CREATE INDEX "student_points_classId_idx" ON "student_points"("classId");
CREATE INDEX "student_points_subjectId_idx" ON "student_points"("subjectId");
CREATE INDEX "student_points_source_idx" ON "student_points"("source");

CREATE INDEX "student_levels_studentId_idx" ON "student_levels"("studentId");
CREATE INDEX "student_levels_classId_idx" ON "student_levels"("classId");
CREATE UNIQUE INDEX "student_levels_studentId_classId_key" ON "student_levels"("studentId", "classId");

CREATE INDEX "leaderboard_snapshots_type_referenceId_idx" ON "leaderboard_snapshots"("type", "referenceId");
CREATE INDEX "leaderboard_snapshots_snapshotDate_idx" ON "leaderboard_snapshots"("snapshotDate");

CREATE INDEX "student_points_aggregates_studentId_idx" ON "student_points_aggregates"("studentId");
CREATE INDEX "student_points_aggregates_classId_idx" ON "student_points_aggregates"("classId");
CREATE INDEX "student_points_aggregates_subjectId_idx" ON "student_points_aggregates"("subjectId");
CREATE INDEX "student_points_aggregates_date_idx" ON "student_points_aggregates"("date");
CREATE UNIQUE INDEX "student_points_aggregates_studentId_classId_subjectId_date_key" ON "student_points_aggregates"("studentId", "classId", "subjectId", "date");

-- Add foreign key constraints
ALTER TABLE "student_achievements" ADD CONSTRAINT "student_achievements_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_achievements" ADD CONSTRAINT "student_achievements_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "student_achievements" ADD CONSTRAINT "student_achievements_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "student_points" ADD CONSTRAINT "student_points_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_points" ADD CONSTRAINT "student_points_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "student_points" ADD CONSTRAINT "student_points_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "student_levels" ADD CONSTRAINT "student_levels_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_levels" ADD CONSTRAINT "student_levels_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "student_points_aggregates" ADD CONSTRAINT "student_points_aggregates_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_points_aggregates" ADD CONSTRAINT "student_points_aggregates_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "student_points_aggregates" ADD CONSTRAINT "student_points_aggregates_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
