# Student Portal UX Implementation Tasklist

This document outlines the detailed implementation plan for enhancing the student portal with modern, gamified interfaces and reward mechanisms as specified in the UX/UI Enhancement Plan. The implementation is designed to be scalable, handling thousands of classes and hundreds of thousands of students efficiently.

## Table of Contents
1. [Database Schema Updates](#1-database-schema-updates)
2. [API Implementation](#2-api-implementation)
3. [Core Reward Mechanisms](#3-core-reward-mechanisms)
4. [UI Components Implementation](#4-ui-components-implementation)
5. [Integration with Existing Systems](#5-integration-with-existing-systems)
6. [Offline Support](#6-offline-support)
7. [Performance Optimization](#7-performance-optimization)
8. [Testing and Documentation](#8-testing-and-documentation)

## 1. Database Schema Updates

### 1.1 Add Reward Mechanism Models to Prisma Schema ✅
- Update `prisma/schema.prisma` to add the following models:

```prisma
// Student Achievement model
model StudentAchievement {
  id              String       @id @default(cuid())
  studentId       String
  student         StudentProfile @relation(fields: [studentId], references: [id])
  title           String
  description     String
  type            String       // e.g., "class", "subject", "login", "streak"
  classId         String?
  class           Class?       @relation(fields: [classId], references: [id])
  subjectId       String?
  subject         Subject?     @relation(fields: [subjectId], references: [id])
  progress        Int          @default(0)
  total           Int
  unlocked        Boolean      @default(false)
  unlockedAt      DateTime?
  icon            String?      // Icon identifier
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  status          SystemStatus @default(ACTIVE)

  @@index([studentId])
  @@index([classId])
  @@index([subjectId])
  @@index([type])
  @@map("student_achievements")
}

// Student Points model
model StudentPoints {
  id              String       @id @default(cuid())
  studentId       String
  student         StudentProfile @relation(fields: [studentId], references: [id])
  amount          Int
  source          String       // e.g., "activity", "login", "bonus"
  sourceId        String?      // ID of the source (activity ID, etc.)
  classId         String?
  class           Class?       @relation(fields: [classId], references: [id])
  subjectId       String?
  subject         Subject?     @relation(fields: [subjectId], references: [id])
  description     String?
  createdAt       DateTime     @default(now())
  status          SystemStatus @default(ACTIVE)

  @@index([studentId])
  @@index([classId])
  @@index([subjectId])
  @@index([source])
  @@map("student_points")
}

// Student Level model
model StudentLevel {
  id              String       @id @default(cuid())
  studentId       String
  student         StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  level           Int          @default(1)
  currentExp      Int          @default(0)
  nextLevelExp    Int          @default(100)
  classId         String?
  class           Class?       @relation(fields: [classId], references: [id])
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  status          SystemStatus @default(ACTIVE)

  @@unique([studentId, classId])
  @@index([studentId])
  @@index([classId])
  @@map("student_levels")
}
```

### 1.2 Update Existing Models ✅
- Modify `StudentProfile` model to include reward-related fields:

```prisma
model StudentProfile {
  // Existing fields...

  // New fields for rewards
  totalPoints     Int          @default(0)
  currentLevel    Int          @default(1)

  // New relationships
  achievements    StudentAchievement[]
  points          StudentPoints[]
  levels          StudentLevel[]
}
```

- Update `Class` and `Subject` models to include relationships to achievement models:

```prisma
model Class {
  // Existing fields...

  // New relationships
  studentAchievements StudentAchievement[]
  studentPoints       StudentPoints[]
  studentLevels       StudentLevel[]
}

model Subject {
  // Existing fields...

  // New relationships
  studentAchievements StudentAchievement[]
  studentPoints       StudentPoints[]
}
```

### 1.3 Create Leaderboard Aggregation Tables ✅
- Add tables for efficient leaderboard queries with historical data:

```prisma
// Leaderboard snapshot model for historical data
model LeaderboardSnapshot {
  id              String       @id @default(cuid())
  type            String       // CLASS, SUBJECT, COURSE, OVERALL
  referenceId     String       // classId, subjectId, courseId, or campusId
  snapshotDate    DateTime     @default(now())
  entries         Json         // Array of leaderboard entries
  metadata        Json?        // Additional metadata
  createdAt       DateTime     @default(now())
  status          SystemStatus @default(ACTIVE)

  @@index([type, referenceId])
  @@index([snapshotDate])
  @@map("leaderboard_snapshots")
}

// Daily student points aggregation for efficient leaderboard calculation
model StudentPointsAggregate {
  id              String       @id @default(cuid())
  studentId       String
  student         StudentProfile @relation(fields: [studentId], references: [id])
  classId         String?
  class           Class?       @relation(fields: [classId], references: [id])
  subjectId       String?
  subject         Subject?     @relation(fields: [subjectId], references: [id])
  courseId        String?
  campusId        String?
  date            DateTime
  dailyPoints     Int          @default(0)
  weeklyPoints    Int          @default(0)
  monthlyPoints   Int          @default(0)
  termPoints      Int          @default(0)
  totalPoints     Int          @default(0)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@unique([studentId, classId, subjectId, date])
  @@index([studentId])
  @@index([classId])
  @@index([subjectId])
  @@index([date])
  @@map("student_points_aggregates")
}
```

### 1.4 Create Migration ✅
- Generate Prisma migration:
  ```bash
  npx prisma migrate dev --name add_reward_system
  ```

## 2. API Implementation

### 2.1 Create Achievement Service ✅
- Create `src/server/api/services/achievement.service.ts`:
  - Implement methods for creating, updating, and retrieving achievements
  - Add achievement progress tracking logic
  - Implement achievement unlocking logic

### 2.2 Create Points Service ✅
- Create `src/server/api/services/points.service.ts`:
  - Implement methods for awarding, retrieving, and aggregating points
  - Add point calculation logic based on grades and activities
  - Implement point history tracking

### 2.3 Create Level Service ✅
- Create `src/server/api/services/level.service.ts`:
  - Implement methods for calculating level progression
  - Add level-up detection and notification
  - Define level thresholds and requirements

### 2.4 Enhance Leaderboard Service ✅
- Update `src/server/api/services/leaderboard.service.ts`:
  - Optimize for scale with 500,000+ students
  - Implement caching and aggregation strategies
  - Add support for historical leaderboard data
  - Include achievement and level data in leaderboard entries

### 2.5 Create tRPC Routers ✅
- Create `src/server/api/routers/achievement.ts`:
  - Add endpoints for CRUD operations on achievements
  - Implement progress tracking endpoints
  - Add achievement unlocking endpoints

- Create `src/server/api/routers/points.ts`:
  - Add endpoints for awarding and retrieving points
  - Implement point history endpoints
  - Add aggregation endpoints for leaderboards

- Create `src/server/api/routers/level.ts`:
  - Add endpoints for retrieving and updating levels
  - Implement level progression endpoints
  - Add level-up notification endpoints

- Update `src/server/api/routers/leaderboard.ts`:
  - Optimize existing endpoints for scale
  - Add endpoints for historical leaderboard data
  - Implement filtering by achievements and levels

### 2.6 Update API Root ✅
- Update `src/server/api/root.ts` to include new routers:
  ```typescript
  import { achievementRouter } from "./routers/achievement";
  import { pointsRouter } from "./routers/points";
  import { levelRouter } from "./routers/level";

  // ...

  export const appRouter = createTRPCRouter({
    // Existing routers...
    achievement: achievementRouter,
    points: pointsRouter,
    level: levelRouter,
  });
  ```

## 3. Core Reward Mechanisms

### 3.1 Point System Implementation ✅
- Create `src/features/rewards/points/index.ts`:
  - Implement point awarding based on activity grades (1:1 mapping of score to points)
  - Add support for non-graded activities to earn points
  - Create point calculation algorithms
  - Implement point history tracking

### 3.2 Level Progression Implementation ✅
- Create `src/features/rewards/levels/index.ts`:
  - Define level thresholds (e.g., Level 1: 0-100 points, Level 2: 101-250 points, etc.)
  - Implement level-up detection
  - Create level progression algorithms
  - Add level-up celebration triggers

### 3.3 Achievement System Implementation ✅
- Create `src/features/rewards/achievements/index.ts`:
  - Define achievement types and criteria
  - Implement progress tracking for multi-step achievements
  - Create achievement unlocking logic
  - Add "newly unlocked" detection

### 3.4 Integration with Activity System ✅
- Update activity submission logic to award points
- Add achievement checks on activity completion
- Implement point awarding for non-graded activities

### 3.5 Background Processing for Rewards ✅
- Create `src/server/jobs/reward-processing.ts`:
  - Implement background job for processing rewards
  - Add scheduled tasks for updating leaderboards
  - Create batch processing for large student populations

## 4. UI Components Implementation

### 4.1 Create Achievement Badge Component ✅
- Create `src/components/rewards/AchievementBadge.tsx`:
  ```typescript
  interface AchievementBadgeProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    progress: number;
    total: number;
    unlocked: boolean;
    newlyUnlocked?: boolean;
    colors?: {
      unlocked: string;
      locked: string;
      progress: string;
    };
  }
  ```
  - Implement badge component with progress indicator
  - Add animations for unlocked and newly unlocked states
  - Use brand colors as specified in UX document

### 4.2 Create Achievement Grid Component ✅
- Create `src/components/rewards/AchievementGrid.tsx`:
  - Implement grid layout for displaying multiple achievements
  - Add filtering by category (class, subject, etc.)
  - Implement empty state and loading indicators

### 4.3 Create Points Display Component ✅
- Create `src/components/rewards/PointsDisplay.tsx`:
  - Implement component for displaying current points
  - Add animations for points changes
  - Include history/breakdown of points earned

### 4.4 Create Level Progress Component ✅
- Create `src/components/rewards/LevelProgress.tsx`:
  - Implement progress bar for level progression
  - Add visual indicators using brand colors
  - Include level-up animation

### 4.5 Create Student Profile Achievements Section ✅
- Create `src/components/shared/entities/students/StudentAchievements.tsx`:
  - Add achievements section to student profile
  - Display earned badges and progress toward upcoming badges
  - Include filtering and sorting options

### 4.6 Update Leaderboard Components ✅
- Update `src/components/leaderboard/LeaderboardTable.tsx`:
  - Add columns for points, level, and achievements
  - Implement optimized rendering for large datasets
  - Add visual indicators for top performers

### 4.7 Create Achievement Notification Component ✅
- Create `src/components/rewards/AchievementNotification.tsx`:
  - Implement toast notification for newly unlocked achievements
  - Add celebration animations
  - Include sound effects (optional)

## 5. Integration with Existing Systems

### 5.1 Integrate with Activity System ✅
- Update `src/features/activities/index.ts`:
  - Add point awarding on activity completion
  - Trigger achievement checks
  - Update student level based on points earned

### 5.2 Integrate with Grading System ✅
- Update `src/server/api/services/grading.service.ts`:
  - Add point awarding on grade submission
  - Trigger achievement checks based on grades
  - Update leaderboard with new points

### 5.3 Integrate with Student Dashboard ✅
- Update `src/components/shared/entities/students/StudentDashboard.tsx`:
  - Add points and level display
  - Show recent achievements
  - Include leaderboard position

### 5.4 Integrate with Student Profile ✅
- Update `src/app/student/profile/page.tsx`:
  - Add achievements section
  - Display level and points
  - Show progress toward next level

### 5.5 Create Achievement Pages ✅
- Create `src/app/student/achievements/page.tsx`:
  - Implement page for viewing all achievements
  - Add filtering and sorting options
  - Include progress tracking

### 5.6 Create Points History Page ✅
- Create `src/app/student/points/page.tsx`:
  - Implement page for viewing points history
  - Add filtering by source and date
  - Include visualizations of point earning trends

## 6. Offline Support

### 6.1 Update IndexedDB Schema
- Update `src/features/activities/offline/db.ts`:
  - Add tables for achievements, points, and levels
  - Implement sync logic for offline achievements
  - Add conflict resolution for points awarded offline

### 6.2 Implement Offline UI Components
- Create `src/features/rewards/offline/index.ts`:
  - Implement offline-aware achievement components
  - Add sync indicators for offline achievements
  - Create optimistic UI updates for points and levels

### 6.3 Add Analytics for Offline Usage
- Create `src/features/rewards/analytics/index.ts`:
  - Track offline achievement progress
  - Record points awarded offline
  - Monitor sync events and conflicts

## 7. Performance Optimization

### 7.1 Implement Caching Strategy ✅
- Create `src/server/api/cache/rewards.ts`:
  - Implement in-memory caching for leaderboards with Redis-compatible interface
  - Add cache invalidation strategies
  - Create tiered caching for different data types

### 7.2 Optimize Database Queries ✅
- Review and optimize all reward-related queries:
  - Use proper indexing (documented in `src/server/api/db/indexing-recommendations.md`)
  - Implement pagination for leaderboard queries
  - Use aggregation queries for efficient leaderboard generation

### 7.3 Implement Data Partitioning
- Design partitioning strategy for leaderboard data:
  - Partition by time period (daily, weekly, monthly)
  - Partition by entity (class, subject, campus)
  - Implement archiving for historical data

### 7.4 Add Background Processing
- Implement background jobs for:
  - Leaderboard calculation
  - Achievement checking
  - Point aggregation
  - Data archiving

### 7.5 Optimize Frontend Rendering
- Implement virtualized lists for leaderboards
- Add lazy loading for achievements
- Optimize animations for performance

## 8. Testing and Documentation

### 8.1 Write Unit Tests
- Create tests for:
  - Achievement service methods
  - Points calculation logic
  - Level progression algorithms
  - Leaderboard generation

### 8.2 Write Integration Tests
- Create tests for:
  - Integration with activity system
  - Integration with grading system
  - Offline sync functionality
  - Leaderboard performance

### 8.3 Create Documentation
- Document:
  - Achievement types and criteria
  - Points system and calculations
  - Level progression thresholds
  - Leaderboard calculation methodology
  - API endpoints and usage

### 8.4 Create User Guide
- Create student-facing documentation:
  - How to earn points
  - How to unlock achievements
  - How to progress through levels
  - How to view leaderboards

## Implementation Details for Reward Mechanisms

### Point System
- Points are awarded 1:1 with activity scores (e.g., 85% score = 85 points)
- Additional points can be earned through:
  - Daily logins (5 points per day)
  - Streak bonuses (5 points × streak days, up to 25 points)
  - Completing non-graded activities (10-50 points based on complexity)
  - Special achievements (25-100 points)
- Points are tracked per class, subject, and overall
- Historical point data is stored for leaderboard calculations

### Level System
- Levels are calculated based on total points:
  - Level 1: 0-100 points
  - Level 2: 101-250 points
  - Level 3: 251-500 points
  - Level 4: 501-1000 points
  - Level 5: 1001-2000 points
  - And so on with increasing thresholds
- Each level provides visual indicators using brand colors
- Level-up events trigger celebrations and notifications
- Levels are displayed on student profile and leaderboards

### Achievement System
- Achievement types include:
  - Class-specific (complete all activities in a class)
  - Subject mastery (achieve 90%+ in all activities for a subject)
  - Streak achievements (login for consecutive days)
  - Milestone achievements (complete X activities, earn Y points)
  - Special achievements (teacher-awarded, system-generated)
- Achievements have progress tracking for multi-step achievements
- Newly unlocked achievements trigger notifications
- Achievements are displayed on student profile and class overview

### Leaderboard System
- Optimized for scale with 500,000+ students
- Uses aggregation tables for efficient queries
- Stores historical data for trend analysis
- Supports filtering by time period (all-time, term, month, week)
- Displays points, level, and achievement count
- Includes visual indicators for top performers
- Supports class, subject, course, and campus-wide leaderboards
