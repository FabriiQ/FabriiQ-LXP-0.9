# Database Indexing Recommendations for Rewards System

This document provides recommendations for database indexes to optimize the performance of the rewards system, especially for leaderboards and points calculations.

## Current Performance Issues

The rewards system needs to handle a large volume of data:
- 1000+ classes
- 500,000+ students
- Millions of point transactions
- Thousands of leaderboard queries per day

Without proper indexing, these queries can become slow, especially as the data grows.

## Recommended Indexes

### StudentPoints Table

```sql
-- Index for querying points by student
CREATE INDEX "idx_student_points_student_id" ON "student_points" ("studentId");

-- Index for querying points by class
CREATE INDEX "idx_student_points_class_id" ON "student_points" ("classId");

-- Index for querying points by subject
CREATE INDEX "idx_student_points_subject_id" ON "student_points" ("subjectId");

-- Composite index for time-based queries by student
CREATE INDEX "idx_student_points_student_time" ON "student_points" ("studentId", "createdAt");

-- Composite index for time-based queries by class
CREATE INDEX "idx_student_points_class_time" ON "student_points" ("classId", "createdAt");

-- Composite index for time-based queries by subject
CREATE INDEX "idx_student_points_subject_time" ON "student_points" ("subjectId", "createdAt");

-- Index for status filtering
CREATE INDEX "idx_student_points_status" ON "student_points" ("status");
```

### StudentAchievement Table

```sql
-- Index for querying achievements by student
CREATE INDEX "idx_student_achievement_student_id" ON "student_achievement" ("studentId");

-- Index for querying unlocked achievements
CREATE INDEX "idx_student_achievement_unlocked" ON "student_achievement" ("unlocked");

-- Composite index for querying achievements by student and type
CREATE INDEX "idx_student_achievement_student_type" ON "student_achievement" ("studentId", "type");

-- Index for status filtering
CREATE INDEX "idx_student_achievement_status" ON "student_achievement" ("status");
```

### StudentPointsAggregate Table

```sql
-- Index for querying aggregates by student
CREATE INDEX "idx_student_points_aggregate_student_id" ON "student_points_aggregate" ("studentId");

-- Index for querying aggregates by class
CREATE INDEX "idx_student_points_aggregate_class_id" ON "student_points_aggregate" ("classId");

-- Index for querying aggregates by subject
CREATE INDEX "idx_student_points_aggregate_subject_id" ON "student_points_aggregate" ("subjectId");

-- Index for querying aggregates by date
CREATE INDEX "idx_student_points_aggregate_date" ON "student_points_aggregate" ("date");

-- Index for status filtering
CREATE INDEX "idx_student_points_aggregate_status" ON "student_points_aggregate" ("status");
```

### LeaderboardSnapshot Table

```sql
-- Index for querying snapshots by type and reference
CREATE INDEX "idx_leaderboard_snapshot_type_ref" ON "leaderboard_snapshot" ("type", "referenceId");

-- Index for querying snapshots by date
CREATE INDEX "idx_leaderboard_snapshot_date" ON "leaderboard_snapshot" ("snapshotDate");

-- Index for status filtering
CREATE INDEX "idx_leaderboard_snapshot_status" ON "leaderboard_snapshot" ("status");
```

### StudentProfile Table

```sql
-- Index for querying profiles by campus
CREATE INDEX "idx_student_profile_campus_id" ON "student_profile" ("campusId");

-- Index for sorting by total points
CREATE INDEX "idx_student_profile_total_points" ON "student_profile" ("totalPoints");

-- Composite index for campus-based leaderboards
CREATE INDEX "idx_student_profile_campus_points" ON "student_profile" ("campusId", "totalPoints");

-- Index for status filtering
CREATE INDEX "idx_student_profile_status" ON "student_profile" ("status");
```

## Implementation Strategy

These indexes should be added incrementally, with performance testing after each addition to ensure they are providing the expected benefits. Some considerations:

1. **Add most critical indexes first**: Start with the indexes for the most frequently used queries.
2. **Monitor query performance**: Use database monitoring tools to identify slow queries.
3. **Consider index size**: Indexes improve read performance but increase write overhead and storage requirements.
4. **Regular maintenance**: Periodically analyze and rebuild indexes to maintain optimal performance.

## Prisma Implementation

For Prisma schema, add these indexes to the model definitions:

```prisma
model StudentPoints {
  // ... existing fields

  @@index([studentId])
  @@index([classId])
  @@index([subjectId])
  @@index([studentId, createdAt])
  @@index([classId, createdAt])
  @@index([subjectId, createdAt])
  @@index([status])
}

model StudentAchievement {
  // ... existing fields

  @@index([studentId])
  @@index([unlocked])
  @@index([studentId, type])
  @@index([status])
}

model StudentPointsAggregate {
  // ... existing fields

  @@index([studentId])
  @@index([classId])
  @@index([subjectId])
  @@index([date])
  @@index([status])
}

model LeaderboardSnapshot {
  // ... existing fields

  @@index([type, referenceId])
  @@index([snapshotDate])
  @@index([status])
}

model StudentProfile {
  // ... existing fields

  @@index([campusId])
  @@index([totalPoints])
  @@index([campusId, totalPoints])
  @@index([status])
}
```

Then generate and apply a migration to add these indexes to the database.
