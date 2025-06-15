-- Add indexes to optimize rewards system queries

-- StudentPoints Table
CREATE INDEX IF NOT EXISTS "idx_student_points_student_id" ON "student_points" ("studentId");
CREATE INDEX IF NOT EXISTS "idx_student_points_class_id" ON "student_points" ("classId");
CREATE INDEX IF NOT EXISTS "idx_student_points_subject_id" ON "student_points" ("subjectId");
CREATE INDEX IF NOT EXISTS "idx_student_points_student_created" ON "student_points" ("studentId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_student_points_class_created" ON "student_points" ("classId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_student_points_subject_created" ON "student_points" ("subjectId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_student_points_status" ON "student_points" ("status");

-- StudentPointsAggregate Table
CREATE INDEX IF NOT EXISTS "idx_student_points_aggregate_student_id" ON "student_points_aggregate" ("studentId");
CREATE INDEX IF NOT EXISTS "idx_student_points_aggregate_class_id" ON "student_points_aggregate" ("classId");
CREATE INDEX IF NOT EXISTS "idx_student_points_aggregate_subject_id" ON "student_points_aggregate" ("subjectId");
CREATE INDEX IF NOT EXISTS "idx_student_points_aggregate_date" ON "student_points_aggregate" ("date");
CREATE INDEX IF NOT EXISTS "idx_student_points_aggregate_status" ON "student_points_aggregate" ("status");

-- LeaderboardSnapshot Table
CREATE INDEX IF NOT EXISTS "idx_leaderboard_snapshot_type_ref" ON "leaderboard_snapshot" ("type", "referenceId");
CREATE INDEX IF NOT EXISTS "idx_leaderboard_snapshot_date" ON "leaderboard_snapshot" ("snapshotDate");
CREATE INDEX IF NOT EXISTS "idx_leaderboard_snapshot_status" ON "leaderboard_snapshot" ("status");

-- StudentProfile Table
CREATE INDEX IF NOT EXISTS "idx_student_profile_total_points" ON "student_profile" ("totalPoints");
CREATE INDEX IF NOT EXISTS "idx_student_profile_campus_points" ON "student_profile" ("campusId", "totalPoints");
