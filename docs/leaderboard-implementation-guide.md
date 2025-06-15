# Leaderboard Implementation Guide

This guide provides specific code changes needed to fix the identified issues in the leaderboard implementation and ensure consistency across all portals.

## 1. Standardize Data Models

### Create a Standard Leaderboard Entry Interface

Create a new file `src/server/api/types/standard-leaderboard.ts`:

```typescript
/**
 * Standard Leaderboard Types
 * 
 * This file defines the standardized types for leaderboard data across all portals.
 */

export enum LeaderboardType {
  CLASS = "CLASS",
  SUBJECT = "SUBJECT",
  COURSE = "COURSE",
  OVERALL = "OVERALL",
}

export enum LeaderboardPeriod {
  ALL_TIME = "ALL_TIME",
  CURRENT_TERM = "CURRENT_TERM",
  CURRENT_MONTH = "CURRENT_MONTH",
  CURRENT_WEEK = "CURRENT_WEEK",
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  TERM = "TERM",
}

export interface LeaderboardFilters {
  period?: LeaderboardPeriod;
  limit?: number;
  offset?: number;
}

export interface StandardLeaderboardEntry {
  // Core identification
  studentId: string;
  studentName: string;
  enrollmentNumber?: string;
  
  // Academic performance
  academicScore: number;        // 0-100% based on grades
  totalPoints: number;          // Sum of earned points in activities
  totalMaxPoints: number;       // Maximum possible points
  
  // Reward system
  rewardPoints: number;         // Gamification points
  level?: number;               // Student level
  achievements?: number;        // Number of achievements
  
  // Progress tracking
  completionRate: number;       // % of activities completed
  totalActivities: number;
  completedActivities: number;
  
  // Ranking
  rank: number;                 // Current position
  previousRank?: number;        // Previous position
  improvement?: number;         // % improvement
  
  // Additional metadata
  lastActive?: Date;            // Last activity timestamp
}

export interface StandardLeaderboardResponse {
  leaderboard: StandardLeaderboardEntry[];
  totalStudents: number;
  filters: LeaderboardFilters;
  metadata?: {
    classId?: string;
    className?: string;
    subjectId?: string;
    subjectName?: string;
    courseId?: string;
    courseName?: string;
    campusId?: string;
    campusName?: string;
  };
}
```

## 2. Fix the Optimized Queries Implementation

Update `src/server/api/services/optimized-queries.ts` to use the standard model and fix the single student issue:

```typescript
// Import the standard types
import { 
  StandardLeaderboardEntry, 
  LeaderboardPeriod 
} from '@/server/api/types/standard-leaderboard';

// Update the LeaderboardEntry interface to extend StandardLeaderboardEntry
export interface LeaderboardEntry extends StandardLeaderboardEntry {}

// Fix the getOptimizedClassLeaderboard function
export async function getOptimizedClassLeaderboard(
  prisma: PrismaClient,
  classId: string,
  period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME,
  pagination: PaginationParams = { page: 1, pageSize: 10 }
): Promise<StandardLeaderboardEntry[]> {
  try {
    // ... existing code ...

    return await cacheLeaderboard(
      'class',
      classId,
      period.toLowerCase(),
      take,
      skip,
      async () => {
        // Get date range for filtering
        const { startDate, endDate } = getDateRangeFromPeriod(period);

        // For ALL_TIME, use the aggregates table for better performance
        if (period === LeaderboardPeriod.ALL_TIME) {
          // Get student data with proper joins
          const students = await prisma.studentEnrollment.findMany({
            where: {
              classId,
              status: SystemStatus.ACTIVE,
            },
            select: {
              student: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                    },
                  },
                  enrollmentNumber: true,
                  currentLevel: true,
                  studentAchievements: {
                    where: {
                      unlocked: true,
                      status: SystemStatus.ACTIVE,
                    },
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
            skip,
            take,
          });

          // Get student points
          const studentIds = students.map(s => s.student.id);
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

          // Get student grades
          const gradesData = await prisma.activityGrade.findMany({
            where: {
              studentId: { in: studentIds },
              activity: {
                classId,
                isGradable: true,
              },
            },
            select: {
              studentId: true,
              score: true,
              activity: {
                select: {
                  maxScore: true,
                },
              },
            },
          });

          // Create maps for efficient lookups
          const pointsMap = new Map();
          pointsData.forEach(p => pointsMap.set(p.studentId, p.totalPoints));

          // Aggregate grades by student
          const gradesMap = new Map();
          gradesData.forEach(g => {
            const studentId = g.studentId;
            if (!gradesMap.has(studentId)) {
              gradesMap.set(studentId, {
                totalPoints: 0,
                totalMaxPoints: 0,
                totalActivities: 0,
                completedActivities: 0,
              });
            }
            
            const data = gradesMap.get(studentId);
            data.totalPoints += g.score || 0;
            data.totalMaxPoints += g.activity.maxScore || 100;
            data.totalActivities += 1;
            data.completedActivities += g.score !== null ? 1 : 0;
          });

          // Transform to leaderboard entries
          const entries = students.map(enrollment => {
            const student = enrollment.student;
            const studentId = student.id;
            const points = pointsMap.get(studentId) || 0;
            const grades = gradesMap.get(studentId) || {
              totalPoints: 0,
              totalMaxPoints: 0,
              totalActivities: 0,
              completedActivities: 0,
            };

            // Calculate academic score
            const academicScore = grades.totalMaxPoints > 0
              ? (grades.totalPoints / grades.totalMaxPoints) * 100
              : 0;

            // Calculate completion rate
            const completionRate = grades.totalActivities > 0
              ? (grades.completedActivities / grades.totalActivities) * 100
              : 0;

            return {
              studentId,
              studentName: student.user.name || 'Unknown',
              enrollmentNumber: student.enrollmentNumber,
              academicScore,
              totalPoints: grades.totalPoints,
              totalMaxPoints: grades.totalMaxPoints,
              rewardPoints: points,
              level: student.currentLevel || 1,
              achievements: student.studentAchievements?.length || 0,
              completionRate,
              totalActivities: grades.totalActivities,
              completedActivities: grades.completedActivities,
              rank: 0, // Will be set after sorting
            };
          });

          // Sort and assign ranks
          return assignRanks(entries);
        } else {
          // ... similar changes for other periods ...
        }
      }
    );
  } catch (error) {
    logger.error('Error getting optimized class leaderboard', { error, classId, period });
    throw error;
  }
}

// Helper function to assign ranks with proper handling of ties
function assignRanks(entries: StandardLeaderboardEntry[]): StandardLeaderboardEntry[] {
  // Sort by reward points first, then by academic score
  entries.sort((a, b) => {
    if (b.rewardPoints !== a.rewardPoints) {
      return b.rewardPoints - a.rewardPoints;
    }
    if (b.academicScore !== a.academicScore) {
      return b.academicScore - a.academicScore;
    }
    return b.completionRate - a.completionRate;
  });

  // Assign ranks with proper handling of ties
  let currentRank = 1;
  let previousPoints = -1;
  let previousScore = -1;
  let sameRankCount = 0;

  entries.forEach((entry, index) => {
    if (index > 0 && entry.rewardPoints === previousPoints && entry.academicScore === previousScore) {
      // Tie - assign same rank
      sameRankCount++;
    } else {
      // New rank - skip ranks for ties
      currentRank = index + 1;
      sameRankCount = 0;
    }
    
    entry.rank = currentRank;
    previousPoints = entry.rewardPoints;
    previousScore = entry.academicScore;
  });

  return entries;
}
```

## 3. Update the Frontend Components

Update `src/components/leaderboard/LeaderboardTable.tsx` to use the standard model:

```typescript
import { StandardLeaderboardEntry, LeaderboardPeriod } from "@/server/api/types/standard-leaderboard";

interface LeaderboardTableProps {
  title: string;
  description?: string;
  leaderboard: StandardLeaderboardEntry[];
  totalStudents: number;
  currentPeriod: LeaderboardPeriod;
  onPeriodChange?: (period: LeaderboardPeriod) => void;
  isLoading?: boolean;
  limit?: number;
  showPagination?: boolean;
}

// Update the table rendering to use the standard model
// ...

// Update the grade letter calculation
const getGradeLetter = (score: number) => {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
};

// In the table row rendering:
<TableCell className="text-center">
  <div className="flex flex-col items-center">
    <span className={cn("text-lg font-bold", getGradeColor(entry.academicScore))}>
      {getGradeLetter(entry.academicScore)}
    </span>
    <span className="text-xs text-muted-foreground">
      {typeof entry.academicScore === 'number' ? `${entry.academicScore.toFixed(1)}%` : '0%'}
    </span>
  </div>
</TableCell>
```

## 4. Update the API Router

Update `src/server/api/routers/leaderboard.ts` to use the standard model:

```typescript
import { StandardLeaderboardResponse, LeaderboardPeriod } from "../types/standard-leaderboard";

// Update the getClassLeaderboard endpoint
getClassLeaderboard: protectedProcedure
  .input(
    z.object({
      classId: z.string(),
      period: z.nativeEnum(LeaderboardPeriod).optional().default(LeaderboardPeriod.ALL_TIME),
      limit: z.number().min(1).max(100).optional().default(50),
    })
  )
  .query(async ({ ctx, input }): Promise<StandardLeaderboardResponse> => {
    // ... existing validation code ...

    const leaderboardService = new OptimizedLeaderboardService({ prisma: ctx.prisma });
    const leaderboard = await leaderboardService.getClassLeaderboard(input.classId, {
      period: input.period,
    });

    return {
      leaderboard: leaderboard.slice(0, input.limit),
      totalStudents: leaderboard.length,
      filters: {
        period: input.period,
        limit: input.limit,
      },
      metadata: {
        classId: classEntity.id,
        className: classEntity.name,
        campusId: classEntity.campusId,
        campusName: classEntity.campus.name,
      },
    };
  }),
```

## 5. Testing Plan

1. Create unit tests for the ranking algorithm
2. Test with various datasets to ensure proper handling of ties
3. Test across all portals to ensure consistent display
4. Test with large datasets to verify performance

## 6. Deployment Strategy

1. Deploy the changes in phases to minimize disruption
2. Monitor performance and user feedback
3. Be prepared to roll back if issues arise

By implementing these changes, the leaderboard system will provide a consistent experience across all portals, accurately represent student performance, and scale efficiently with large datasets.
