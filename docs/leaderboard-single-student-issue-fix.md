# Fixing the Single Student Issue in Leaderboard

## Problem Description

The unified leaderboard is currently showing a single student in all rows instead of displaying different students with their respective rankings. This issue is likely caused by:

1. Incorrect data mapping in the optimized queries
2. Type assertions (`student as any`) causing property access issues
3. Improper student map creation and lookup
4. Inconsistent data transformation between different services

## Root Cause Analysis

After reviewing the code, the following issues were identified:

### 1. Type Assertions in Optimized Queries

In `src/server/api/services/optimized-queries.ts`, there are numerous type assertions (`as any`) that bypass TypeScript's type checking:

```typescript
// Example from getOptimizedClassLeaderboard
return aggregates.map((aggregate: any, index: number) => ({
  studentId: aggregate.studentId,
  studentName: (aggregate.student as any)?.user?.name || 'Unknown',
  points: aggregate.totalPoints,
  rank: skip + index + 1,
  level: (aggregate.student as any)?.currentLevel || 1,
  achievements: (aggregate.student as any)?.studentAchievements?.length || 0,
}));
```

These assertions can lead to undefined properties being accessed, especially if the database schema doesn't match the expected structure.

### 2. Inconsistent Student Data Mapping

The student data mapping is inconsistent between different query methods:

```typescript
// In getOptimizedClassLeaderboard for ALL_TIME period
const studentMap = new Map();
students.forEach(student => {
  studentMap.set(student.id, {
    name: (student as any).user?.name || 'Unknown',
    level: (student as any).currentLevel || 1,
    achievements: (student as any).studentAchievements?.length || 0,
  });
});

// Later when using the map
const student = studentMap.get(points.studentId) || {
  name: 'Unknown',
  level: 1,
  achievements: 0,
};
```

If `points.studentId` doesn't match any key in `studentMap`, it will always return the default object, potentially causing the same student data to be used for all entries.

### 3. Incorrect Sorting and Rank Assignment

The rank assignment doesn't properly handle ties and might be assigning the same rank to different students:

```typescript
// Sort by reward points first, then by score
leaderboard.sort((a, b) => {
  const bPoints = b.rewardPoints || 0;
  const aPoints = a.rewardPoints || 0;
  if (bPoints !== aPoints) {
    return bPoints - aPoints;
  }
  return b.score - a.score;
});

// Add rank
leaderboard.forEach((entry, index) => {
  entry.rank = index + 1;
});
```

This approach doesn't handle ties correctly and might lead to incorrect rankings.

## Solution

### 1. Fix the Optimized Queries Implementation

Update `src/server/api/services/optimized-queries.ts` to use proper joins and avoid type assertions:

```typescript
export async function getOptimizedClassLeaderboard(
  prisma: PrismaClient,
  classId: string,
  period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME,
  pagination: PaginationParams = { page: 1, pageSize: 10 }
): Promise<LeaderboardEntry[]> {
  try {
    // Calculate pagination parameters
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 10;
    const skip = pagination.skip || (page - 1) * pageSize;
    const take = pagination.take || pageSize;

    // Use caching for better performance
    return await cacheLeaderboard(
      'class',
      classId,
      period.toLowerCase(),
      take,
      skip,
      async () => {
        // Get date range for filtering
        const { startDate, endDate } = getDateRangeFromPeriod(period);

        // For ALL_TIME, use a more reliable query approach
        if (period === LeaderboardPeriod.ALL_TIME) {
          // Get all students enrolled in this class
          const enrollments = await prisma.studentEnrollment.findMany({
            where: {
              classId,
              status: SystemStatus.ACTIVE,
            },
            select: {
              student: {
                select: {
                  id: true,
                  enrollmentNumber: true,
                  user: {
                    select: {
                      name: true,
                    }
                  },
                  // Add explicit selects for other needed fields
                  // instead of using type assertions
                }
              }
            },
          });

          // Get student IDs for further queries
          const studentIds = enrollments.map(e => e.student.id);

          // Get points data for these students
          const pointsData = await prisma.studentPointsAggregate.findMany({
            where: {
              studentId: { in: studentIds },
              classId,
            },
            select: {
              studentId: true,
              totalPoints: true,
            },
          });

          // Get student levels
          const levelsData = await prisma.studentProfile.findMany({
            where: {
              id: { in: studentIds },
            },
            select: {
              id: true,
              currentLevel: true,
            },
          });

          // Get achievement counts
          const achievementsData = await prisma.studentAchievement.groupBy({
            by: ['studentId'],
            where: {
              studentId: { in: studentIds },
              unlocked: true,
              status: SystemStatus.ACTIVE,
            },
            _count: {
              id: true,
            },
          });

          // Create maps for efficient lookups
          const pointsMap = new Map();
          pointsData.forEach(p => pointsMap.set(p.studentId, p.totalPoints || 0));

          const levelsMap = new Map();
          levelsData.forEach(l => levelsMap.set(l.id, l.currentLevel || 1));

          const achievementsMap = new Map();
          achievementsData.forEach(a => achievementsMap.set(a.studentId, a._count.id || 0));

          // Create leaderboard entries
          const entries = enrollments.map(enrollment => {
            const student = enrollment.student;
            const studentId = student.id;
            
            return {
              studentId,
              studentName: student.user.name || 'Unknown',
              enrollmentNumber: student.enrollmentNumber || '',
              points: pointsMap.get(studentId) || 0,
              rank: 0, // Will be set after sorting
              level: levelsMap.get(studentId) || 1,
              achievements: achievementsMap.get(studentId) || 0,
            };
          });

          // Sort by points
          entries.sort((a, b) => b.points - a.points);

          // Assign ranks with proper handling of ties
          let currentRank = 1;
          let previousPoints = -1;
          let sameRankCount = 0;

          entries.forEach((entry, index) => {
            if (index > 0 && entry.points === previousPoints) {
              // Tie - assign same rank
              sameRankCount++;
            } else {
              // New rank - skip ranks for ties
              currentRank = index + 1;
              sameRankCount = 0;
            }
            
            entry.rank = currentRank;
            previousPoints = entry.points;
          });

          // Apply pagination
          return entries.slice(skip, skip + take);
        } else {
          // Similar changes for other periods...
        }
      }
    );
  } catch (error) {
    logger.error('Error getting optimized class leaderboard', { error, classId, period });
    throw error;
  }
}
```

### 2. Fix the Rank Assignment

Create a helper function for consistent rank assignment:

```typescript
/**
 * Assigns ranks to leaderboard entries with proper handling of ties
 */
function assignRanks<T extends { points: number; rank: number }>(entries: T[]): T[] {
  // Sort by points
  entries.sort((a, b) => b.points - a.points);

  // Assign ranks with proper handling of ties
  let currentRank = 1;
  let previousPoints = -1;
  let sameRankCount = 0;

  entries.forEach((entry, index) => {
    if (index > 0 && entry.points === previousPoints) {
      // Tie - assign same rank
      sameRankCount++;
    } else {
      // New rank - skip ranks for ties
      currentRank = index + 1;
      sameRankCount = 0;
    }
    
    entry.rank = currentRank;
    previousPoints = entry.points;
  });

  return entries;
}
```

### 3. Ensure Consistent Data Transformation

Update the leaderboard service to ensure consistent data transformation:

```typescript
/**
 * Transform database results to standard leaderboard entries
 */
function transformToLeaderboardEntries(
  students: any[],
  pointsMap: Map<string, number>,
  gradesMap: Map<string, any>,
  levelsMap: Map<string, number>,
  achievementsMap: Map<string, number>
): LeaderboardEntry[] {
  return students.map(student => {
    const studentId = student.id;
    const points = pointsMap.get(studentId) || 0;
    const grades = gradesMap.get(studentId) || { totalPoints: 0, totalMaxPoints: 0 };
    const level = levelsMap.get(studentId) || 1;
    const achievements = achievementsMap.get(studentId) || 0;

    // Calculate score as a percentage
    const score = grades.totalMaxPoints > 0
      ? (grades.totalPoints / grades.totalMaxPoints) * 100
      : 0;

    return {
      studentId,
      studentName: student.name || 'Unknown',
      enrollmentNumber: student.enrollmentNumber || '',
      points,
      score,
      rank: 0, // Will be set by assignRanks
      level,
      achievements,
    };
  });
}
```

## Testing the Fix

1. Add logging to track the data flow:
   ```typescript
   logger.debug('Student data before transformation', { students });
   logger.debug('Points map', { pointsMap: Array.from(pointsMap.entries()) });
   logger.debug('Transformed entries', { entries });
   ```

2. Create a test endpoint that returns detailed information about the query execution:
   ```typescript
   debugLeaderboard: protectedProcedure
     .input(z.object({ classId: z.string() }))
     .query(async ({ ctx, input }) => {
       // Detailed query with debugging information
       // ...
     }),
   ```

3. Test with a small dataset to verify the fix works correctly.

## Conclusion

The single student issue in the leaderboard is likely caused by incorrect data mapping and type assertions. By implementing proper joins, avoiding type assertions, and ensuring consistent data transformation, the issue should be resolved. The fix also improves the handling of ties in the rank assignment, providing a more accurate representation of student rankings.
