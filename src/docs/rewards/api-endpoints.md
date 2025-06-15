# Reward System API Endpoints and Usage

This document outlines the API endpoints available for the student portal reward system, including request/response formats and authentication requirements.

## Overview

The reward system API is built using tRPC, which provides type-safe API endpoints with automatic validation. All endpoints are accessible through the `api` object in the client code.

## Authentication and Authorization

All reward system API endpoints require authentication. The user must be logged in, and the appropriate authorization checks are performed for each endpoint:

- Student endpoints require the user to be a student
- Teacher endpoints require the user to be a teacher
- Admin endpoints require the user to be an admin

## Achievement Endpoints

### Get Student Achievements

Retrieves all achievements for a student.

```typescript
// Client usage
const { data: achievements } = api.achievement.getStudentAchievements.useQuery();

// Response type
interface Achievement {
  id: string;
  title: string;
  description: string;
  type: string;
  progress: number;
  total: number;
  unlocked: boolean;
  unlockedAt?: Date;
  icon?: string;
  classId?: string;
  className?: string;
  subjectId?: string;
  subjectName?: string;
  newlyUnlocked?: boolean;
}
```

### Get Achievement Details

Retrieves detailed information about a specific achievement.

```typescript
// Client usage
const { data: achievement } = api.achievement.getAchievementDetails.useQuery({ 
  achievementId: "achievement_id" 
});

// Response includes all Achievement fields plus:
interface AchievementDetails extends Achievement {
  criteria: string;
  pointsAwarded: number;
  relatedAchievements: Achievement[];
}
```

### Get Class Achievements

Retrieves all achievements for a specific class.

```typescript
// Client usage
const { data: achievements } = api.achievement.getClassAchievements.useQuery({ 
  classId: "class_id" 
});

// Response is an array of Achievement objects
```

### Get Achievement Stats

Retrieves achievement statistics for a student.

```typescript
// Client usage
const { data: stats } = api.achievement.getAchievementStats.useQuery();

// Response type
interface AchievementStats {
  total: number;
  unlocked: number;
  byType: Record<string, { total: number; unlocked: number }>;
}
```

### Check Achievement Progress

Checks and updates progress for all applicable achievements.

```typescript
// Client usage
const checkProgressMutation = api.achievement.checkProgress.useMutation();
checkProgressMutation.mutate({ 
  activityId: "activity_id",
  score: 85
});

// Response type
interface AchievementProgressResult {
  updatedAchievements: Achievement[];
  newlyUnlocked: Achievement[];
}
```

## Points Endpoints

### Get Student Points

Retrieves point information for a student.

```typescript
// Client usage
const { data: points } = api.points.getStudentPoints.useQuery();

// Response type
interface StudentPointsInfo {
  totalPoints: number;
  todayPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  termPoints: number;
  byClass: Record<string, number>;
  bySubject: Record<string, number>;
}
```

### Get Points History

Retrieves point history for a student.

```typescript
// Client usage
const { data: history } = api.points.getPointsHistory.useQuery({
  limit: 20,
  offset: 0,
  filter: {
    source: "activity",
    classId: "class_id"
  }
});

// Response type
interface PointsHistoryEntry {
  id: string;
  amount: number;
  source: string;
  sourceId?: string;
  description?: string;
  classId?: string;
  className?: string;
  subjectId?: string;
  subjectName?: string;
  createdAt: Date;
}

interface PointsHistoryResponse {
  entries: PointsHistoryEntry[];
  total: number;
}
```

### Award Points

Awards points to a student.

```typescript
// Client usage (teacher/admin only)
const awardPointsMutation = api.points.awardPoints.useMutation();
awardPointsMutation.mutate({
  studentId: "student_id",
  amount: 50,
  source: "bonus",
  description: "Excellent participation in class",
  classId: "class_id"
});

// Response type
interface AwardPointsResult {
  success: boolean;
  pointsAwarded: number;
  newTotal: number;
}
```

## Level Endpoints

### Get Student Level

Retrieves level information for a student.

```typescript
// Client usage
const { data: level } = api.level.getStudentLevel.useQuery({
  classId: "class_id" // Optional, for class-specific level
});

// Response type
interface StudentLevelInfo {
  level: number;
  currentExp: number;
  nextLevelExp: number;
  progress: number;
  classId?: string;
  className?: string;
}
```

### Get Level History

Retrieves level-up history for a student.

```typescript
// Client usage
const { data: history } = api.level.getLevelHistory.useQuery();

// Response type
interface LevelHistoryEntry {
  level: number;
  achievedAt: Date;
  pointsAtLevelUp: number;
}

interface LevelHistoryResponse {
  entries: LevelHistoryEntry[];
  currentLevel: number;
}
```

## Leaderboard Endpoints

### Get Class Leaderboard

Retrieves the leaderboard for a specific class.

```typescript
// Client usage
const { data: leaderboard } = api.leaderboard.getClassLeaderboard.useQuery({
  classId: "class_id",
  period: "WEEK", // ALL_TIME, TERM, MONTH, WEEK, DAY
  limit: 20,
  offset: 0
});

// Response type
interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  enrollmentNumber?: string;
  score: number;
  totalPoints: number;
  completionRate: number;
  level?: number;
  achievements?: number;
  previousRank?: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  totalStudents: number;
  metadata: {
    className?: string;
    subjectName?: string;
    courseName?: string;
    campusName?: string;
    period: string;
  }
}
```

### Get Subject Leaderboard

Retrieves the leaderboard for a specific subject.

```typescript
// Client usage
const { data: leaderboard } = api.leaderboard.getSubjectLeaderboard.useQuery({
  subjectId: "subject_id",
  period: "MONTH",
  limit: 20,
  offset: 0
});

// Response type is the same as LeaderboardResponse
```

### Get Overall Leaderboard

Retrieves the overall leaderboard.

```typescript
// Client usage
const { data: leaderboard } = api.leaderboard.getOverallLeaderboard.useQuery({
  period: "ALL_TIME",
  limit: 20,
  offset: 0
});

// Response type is the same as LeaderboardResponse
```

### Get Student Rank

Retrieves a specific student's rank in various leaderboards.

```typescript
// Client usage
const { data: ranks } = api.leaderboard.getStudentRank.useQuery({
  studentId: "student_id" // Optional, defaults to current user
});

// Response type
interface StudentRankInfo {
  overall: {
    rank: number;
    totalStudents: number;
    percentile: number;
  };
  byClass: Record<string, {
    rank: number;
    totalStudents: number;
    percentile: number;
  }>;
  bySubject: Record<string, {
    rank: number;
    totalStudents: number;
    percentile: number;
  }>;
}
```

## Integration Endpoints

### Submit Activity Result

Submits an activity result and processes rewards.

```typescript
// Client usage
const submitResultMutation = api.activities.submitResult.useMutation();
submitResultMutation.mutate({
  activityId: "activity_id",
  answers: [...],
  score: 85,
  maxScore: 100
});

// Response type
interface ActivitySubmissionResult {
  success: boolean;
  score: number;
  pointsAwarded: number;
  achievementsUnlocked: Achievement[];
  levelUp?: {
    oldLevel: number;
    newLevel: number;
  };
}
```

### Submit Grade

Submits a grade and processes rewards (teacher only).

```typescript
// Client usage
const submitGradeMutation = api.grading.submitGrade.useMutation();
submitGradeMutation.mutate({
  studentId: "student_id",
  activityId: "activity_id",
  score: 85,
  maxScore: 100,
  feedback: "Great work!"
});

// Response type
interface GradeSubmissionResult {
  success: boolean;
  pointsAwarded: number;
  achievementsUnlocked: Achievement[];
  levelUp?: {
    oldLevel: number;
    newLevel: number;
  };
}
```

## Error Handling

All API endpoints return standardized error responses:

```typescript
interface ApiError {
  code: string; // e.g., "UNAUTHORIZED", "NOT_FOUND", "INTERNAL_SERVER_ERROR"
  message: string;
  details?: any;
}
```

Common error codes:
- `UNAUTHORIZED`: User is not authenticated or lacks permission
- `NOT_FOUND`: Requested resource not found
- `BAD_REQUEST`: Invalid request parameters
- `INTERNAL_SERVER_ERROR`: Server-side error

## Implementation Details

The API endpoints are implemented in the following files:
- `src/server/api/routers/achievement.ts`
- `src/server/api/routers/points.ts`
- `src/server/api/routers/level.ts`
- `src/server/api/routers/leaderboard.ts`

The corresponding services are implemented in:
- `src/server/api/services/achievement.service.ts`
- `src/server/api/services/points.service.ts`
- `src/server/api/services/level.service.ts`
- `src/server/api/services/leaderboard.service.ts`
