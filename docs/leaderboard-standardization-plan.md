# Leaderboard Standardization Plan

## Executive Summary

This document outlines a comprehensive plan to standardize the leaderboard implementation across all portals in the LXP system. The goal is to create a single source of truth with clear separation between academic performance metrics and reward points, ensuring consistent user experience and data representation across student, teacher, coordinator, and campus portals.

The current implementation has several issues:
1. Inconsistent data models between frontend and backend
2. Confusion between points and scores in ranking calculations
3. Single student showing in all rows due to data mapping errors
4. Different implementations across portals
5. Performance issues with large datasets

## Current Architecture

### Database Schema

The system uses a partitioned leaderboard architecture with these key models:

1. **LeaderboardSnapshot**: A partitioned table that stores leaderboard data
   ```prisma
   model LeaderboardSnapshot {
     id              String       @id @default(cuid())
     type            String       // CLASS, SUBJECT, COURSE, OVERALL
     referenceId     String       // classId, subjectId, courseId, or campusId
     snapshotDate    DateTime     @default(now())
     entries         Json         // Array of leaderboard entries
     metadata        Json?        // Additional metadata
     timeGranularity String       @default("all-time")
     partitionKey    String?      // For database partitioning
     institutionId   String?      // Institution reference
     // ...indexes and relations
   }
   ```

2. **StudentPoints**: Records individual point awards
   ```prisma
   model StudentPoints {
     id          String
     studentId   String
     amount      Int
     source      String
     sourceId    String?
     classId     String?
     subjectId   String?
     // ...other fields
   }
   ```

3. **StudentPointsAggregate**: Stores pre-calculated aggregates
   ```prisma
   model StudentPointsAggregate {
     id            String
     studentId     String
     classId       String?
     subjectId     String?
     courseId      String?
     campusId      String?
     date          DateTime
     dailyPoints   Int
     weeklyPoints  Int
     monthlyPoints Int
     termPoints    Int
     totalPoints   Int
     // ...other fields
   }
   ```

4. **ActivityGrade**: Stores student grades for activities
   ```prisma
   model ActivityGrade {
     id        String
     activityId String
     studentId  String
     score      Float?           // Grade score for gradable activities
     points     Int?             // Points earned for any activity (separate from grade)
     // ...other fields
   }
   ```

### Current Services

1. **OptimizedLeaderboardService**: Focuses on performance with caching
2. **EnhancedLeaderboardService**: Adds additional features
3. **LeaderboardPartitioningService**: Handles data partitioning

### Current Issues

1. **Data Model Inconsistency**: Different data models across services and portals
2. **Confusion Between Points and Scores**: Unclear distinction between academic performance and reward points
3. **Single Student Issue**: Data mapping errors causing a single student to appear in all rows
4. **Inconsistent Ranking**: Different ranking algorithms across implementations
5. **Performance Issues**: Inefficient queries for large datasets

## Standardization Plan

### 1. Create a Unified Data Model

Define a standard leaderboard entry structure to be used across all services and portals:

```typescript
export interface StandardLeaderboardEntry {
  // Core identification
  studentId: string;
  studentName: string;
  enrollmentNumber?: string;
  
  // Academic performance (grades-based)
  academicScore: number;        // 0-100% based on grades
  totalGradePoints: number;     // Sum of earned points in graded activities
  totalMaxGradePoints: number;  // Maximum possible points in graded activities
  
  // Reward system (gamification)
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
}
```

### 2. Implement a Centralized Leaderboard Service

Create a new `StandardLeaderboardService` that will be the single source of truth:

```typescript
export class StandardLeaderboardService {
  private prisma: PrismaClient;
  private partitioningService: LeaderboardPartitioningService;
  
  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
    this.partitioningService = new LeaderboardPartitioningService(prisma);
  }
  
  /**
   * Get leaderboard data for any entity type
   */
  async getLeaderboard(options: {
    type: 'class' | 'subject' | 'course' | 'campus';
    referenceId: string;
    period?: LeaderboardPeriod;
    limit?: number;
    offset?: number;
  }): Promise<StandardLeaderboardEntry[]> {
    // Implementation that uses the partitioning service
    // to get data from the centralized leaderboard snapshots
  }
  
  // Other methods for specific entity types, student positions, etc.
}
```

### 3. Fix the Single Student Issue

Update the data mapping logic to correctly handle student data:

1. Use proper joins instead of type assertions
2. Implement robust error handling
3. Add validation to ensure data integrity
4. Use a consistent approach to student data mapping

### 4. Standardize Ranking Algorithm

Implement a consistent ranking algorithm that clearly separates academic performance from reward points:

```typescript
/**
 * Assigns ranks to leaderboard entries with proper handling of ties
 */
function assignRanks(entries: StandardLeaderboardEntry[]): StandardLeaderboardEntry[] {
  // Primary sort by reward points
  entries.sort((a, b) => {
    // Primary sort by reward points
    if (b.rewardPoints !== a.rewardPoints) {
      return b.rewardPoints - a.rewardPoints;
    }
    
    // Secondary sort by academic score
    if (b.academicScore !== a.academicScore) {
      return b.academicScore - a.academicScore;
    }
    
    // Tertiary sort by completion rate
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

### 5. Update Frontend Components

Create standardized UI components that clearly separate academic performance from reward points:

1. **BaseLeaderboardTable**: Core table component with standard styling
2. **StudentLeaderboardView**: For student portal
3. **TeacherLeaderboardView**: For teacher portal
4. **CoordinatorLeaderboardView**: For coordinator portal
5. **AdminLeaderboardView**: For campus/admin portal

### 6. Optimize Performance

1. Leverage the partitioned leaderboard snapshots for efficient queries
2. Implement proper caching strategies
3. Use virtualization for large datasets
4. Implement pagination and lazy loading

## Implementation Phases

### Phase 1: Data Model and Service Standardization

1. Create the `StandardLeaderboardEntry` interface
2. Implement the `StandardLeaderboardService`
3. Update the leaderboard snapshot creation process
4. Fix the single student issue in data mapping

### Phase 2: API Standardization

1. Create standardized API endpoints using the new service
2. Update existing endpoints to use the new model
3. Implement proper error handling and validation

### Phase 3: Frontend Standardization

1. Create standardized UI components
2. Update portal-specific views to use the new components
3. Ensure consistent styling and behavior across all portals

### Phase 4: Performance Optimization

1. Optimize database queries
2. Implement efficient caching
3. Add virtualization for large datasets
4. Implement proper pagination

### Phase 5: Testing and Validation

1. Create comprehensive tests for all components
2. Test across all portals with various datasets
3. Verify consistent behavior and appearance
4. Gather user feedback

## Technical Implementation Details

### 1. Standard Leaderboard Entry Interface

Create a new file `src/server/api/types/standard-leaderboard.ts`:

```typescript
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

export interface StandardLeaderboardEntry {
  // Core identification
  studentId: string;
  studentName: string;
  enrollmentNumber?: string;
  
  // Academic performance
  academicScore: number;
  totalGradePoints: number;
  totalMaxGradePoints: number;
  
  // Reward system
  rewardPoints: number;
  level?: number;
  achievements?: number;
  
  // Progress tracking
  completionRate: number;
  totalActivities: number;
  completedActivities: number;
  
  // Ranking
  rank: number;
  previousRank?: number;
  improvement?: number;
}

export interface StandardLeaderboardResponse {
  leaderboard: StandardLeaderboardEntry[];
  totalStudents: number;
  filters: {
    period?: LeaderboardPeriod;
    limit?: number;
    offset?: number;
  };
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

### 2. Standard Leaderboard Service

Create a new file `src/server/api/services/standard-leaderboard.service.ts` that uses the partitioning service:

```typescript
import { PrismaClient } from '@prisma/client';
import { LeaderboardPartitioningService } from './leaderboard-partitioning.service';
import { StandardLeaderboardEntry, LeaderboardPeriod } from '../types/standard-leaderboard';

export class StandardLeaderboardService {
  private prisma: PrismaClient;
  private partitioningService: LeaderboardPartitioningService;
  
  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
    this.partitioningService = new LeaderboardPartitioningService(prisma);
  }
  
  /**
   * Get leaderboard data for any entity type
   */
  async getLeaderboard(options: {
    type: 'class' | 'subject' | 'course' | 'campus';
    referenceId: string;
    period?: LeaderboardPeriod;
    limit?: number;
    offset?: number;
  }): Promise<StandardLeaderboardEntry[]> {
    // Implementation that uses the partitioning service
  }
}
```

## Conclusion

By implementing this standardization plan, we will create a single source of truth for leaderboard data with clear separation between academic performance and reward points. This will ensure a consistent user experience across all portals, fix the single student issue, and improve overall system performance and maintainability.
