# Unified Leaderboard Implementation Plan

## Executive Summary

This document outlines a comprehensive plan to standardize and unify the leaderboard implementation across all portals in the LXP system. The plan incorporates the rich feature set described in the student portal leaderboard documentation while ensuring a single source of truth with clear separation between academic performance metrics and reward points.

The unified leaderboard will leverage the existing partitioned leaderboard architecture to create a consistent, high-performance system that works seamlessly across student, teacher, coordinator, and campus portals.

## Current State Analysis

### Existing Architecture

The system currently has a partitioned leaderboard architecture with these key components:

1. **Database Models**:
   - `LeaderboardSnapshot`: Partitioned table storing leaderboard data
   - `StudentPoints`: Records individual point awards
   - `StudentPointsAggregate`: Stores pre-calculated aggregates
   - `ActivityGrade`: Stores student grades for activities

2. **Services**:
   - `OptimizedLeaderboardService`: Performance-focused implementation
   - `EnhancedLeaderboardService`: Feature-rich implementation
   - `LeaderboardPartitioningService`: Handles data partitioning

3. **Frontend Components**:
   - `UnifiedLeaderboard.tsx`: Used in admin, coordinator, and teacher portals
   - `StudentLeaderboard.tsx`: Used in the student portal
   - `LeaderboardTable.tsx`: Basic table component
   - `VirtualizedLeaderboardTable.tsx`: Optimized for large datasets

### Current Issues

1. **Inconsistent Data Models**: Different data structures across services and portals
2. **Confusion Between Points and Scores**: Unclear distinction between academic performance and reward points
3. **Single Student Issue**: Data mapping errors causing a single student to appear in all rows
4. **Inconsistent Ranking**: Different ranking algorithms across implementations
5. **Performance Issues**: Inefficient queries for large datasets
6. **Duplicate Implementations**: Multiple components with similar functionality

## Student Portal Leaderboard Features

The student portal leaderboard documentation outlines a rich feature set that should be incorporated into the unified implementation:

1. **Multi-Context Competition**:
   - Class Leaderboards
   - Grade/Year Leaderboards
   - Campus Leaderboards
   - Subject-Specific Leaderboards
   - Custom Group Leaderboards

2. **Diverse Timeframes**:
   - Daily Leaderboards
   - Weekly Leaderboards
   - Monthly Leaderboards
   - Term Leaderboards
   - All-Time Leaderboards

3. **Comprehensive Scoring System**:
   - Activity Completion
   - Consistency Bonuses
   - Improvement Recognition
   - Helping Behaviors
   - Challenge Achievements

4. **Personal Position Tracking**:
   - Current Rank Display
   - Position Change Indicators
   - Historical Tracking
   - Distance Metrics
   - Personal Best Records

5. **Privacy-Conscious Design**:
   - Opt-Out Options
   - Anonymous Participation
   - Focus on Improvement
   - Anti-Gaming Protections
   - Educator Controls

## Unified Implementation Plan

### 1. Standardized Data Model

Create a comprehensive leaderboard entry model that supports all required features:

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
  
  // Ranking and movement
  rank: number;                 // Current position
  previousRank?: number;        // Previous position
  improvement?: number;         // % improvement
  
  // Additional metrics
  consistencyScore?: number;    // Measure of regular engagement
  helpingScore?: number;        // Measure of peer assistance
  challengeScore?: number;      // Measure of tackling difficult content
  
  // Privacy controls
  isAnonymous?: boolean;        // Whether the student has opted for anonymity
}
```

### 2. Unified Leaderboard Service

Create a new `UnifiedLeaderboardService` that will be the single source of truth:

```typescript
export class UnifiedLeaderboardService {
  private prisma: PrismaClient;
  private partitioningService: LeaderboardPartitioningService;
  
  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
    this.partitioningService = new LeaderboardPartitioningService(prisma);
  }
  
  /**
   * Get leaderboard data for any entity type and timeframe
   */
  async getLeaderboard(options: {
    type: 'class' | 'subject' | 'course' | 'campus' | 'custom';
    referenceId: string;
    timeframe: 'daily' | 'weekly' | 'monthly' | 'term' | 'all-time';
    limit?: number;
    offset?: number;
    includeCurrentStudent?: boolean;
    currentStudentId?: string;
    filterOptions?: any;
  }): Promise<StandardLeaderboardResponse> {
    // Implementation that uses the partitioning service
  }
  
  // Other methods for specific features
}
```

### 3. Standardized UI Components

Create a set of standardized UI components that can be used across all portals:

1. **BaseLeaderboardTable**: Core table component with standard styling
2. **StudentLeaderboardView**: Student-focused view with personal position tracking
3. **TeacherLeaderboardView**: Teacher-focused view with additional analytics
4. **AdminLeaderboardView**: Admin-focused view with comprehensive data

### 4. Implementation Phases

#### Phase 1: Data Model and Service Standardization

1. Create the `StandardLeaderboardEntry` interface
2. Implement the `UnifiedLeaderboardService`
3. Update the leaderboard snapshot creation process
4. Fix the single student issue in data mapping

#### Phase 2: API Standardization

1. Create standardized API endpoints using the new service
2. Update existing endpoints to use the new model
3. Implement proper error handling and validation

#### Phase 3: Frontend Standardization

1. Create standardized UI components
2. Update portal-specific views to use the new components
3. Ensure consistent styling and behavior across all portals

#### Phase 4: Feature Enhancement

1. Implement multi-context competition
2. Add diverse timeframes
3. Enhance the scoring system
4. Improve personal position tracking
5. Add privacy controls

#### Phase 5: Testing and Validation

1. Create comprehensive tests for all components
2. Test across all portals with various datasets
3. Verify consistent behavior and appearance
4. Gather user feedback

## Cleanup Plan

The following files will be replaced or removed as part of the standardization:

### Files to Replace

1. **Backend Services**:
   - `src/server/api/services/leaderboard.service.optimized.ts` → `src/server/api/services/unified-leaderboard.service.ts`
   - `src/server/api/services/leaderboard.service.enhanced.ts` → (functionality merged into unified service)
   - `src/server/api/services/optimized-queries.ts` → `src/server/api/services/leaderboard-queries.ts`

2. **API Endpoints**:
   - `src/server/api/routers/leaderboard.ts` → Updated with unified endpoints

3. **Types**:
   - `src/server/api/types/leaderboard.ts` → `src/server/api/types/standard-leaderboard.ts`

4. **Frontend Components**:
   - `src/components/leaderboard/UnifiedLeaderboard.tsx` → `src/components/leaderboard/StandardLeaderboard.tsx`
   - `src/components/leaderboard/LeaderboardTable.tsx` → `src/components/leaderboard/BaseLeaderboardTable.tsx`
   - `src/components/leaderboard/VirtualizedLeaderboardTable.tsx` → `src/components/leaderboard/VirtualizedLeaderboardTable.tsx` (updated)
   - `src/components/leaderboard/LeaderboardTable.enhanced.tsx` → (functionality merged into base components)
   - `src/components/shared/entities/students/StudentLeaderboard.tsx` → `src/components/leaderboard/StudentLeaderboardView.tsx`

### Files to Remove

1. **Deprecated Services**:
   - `src/server/api/services/leaderboard.service.ts` (original implementation)

2. **Deprecated Components**:
   - `src/components/student/ClassLeaderboard.tsx` (replaced by StudentLeaderboardView)

3. **Deprecated Types**:
   - Any duplicate type definitions across the codebase

### Database Changes

No schema changes are required as we'll leverage the existing partitioned leaderboard architecture. However, we'll need to:

1. Update the structure of the entries JSON field in the LeaderboardSnapshot model
2. Migrate existing snapshots to the new format (can be done gradually)

## Technical Implementation Details

### 1. Standard Leaderboard Entry Interface

Create a new file `src/server/api/types/standard-leaderboard.ts` with the standardized types.

### 2. Unified Leaderboard Service

Create a new file `src/server/api/services/unified-leaderboard.service.ts` that leverages the partitioning service.

### 3. Standardized API Endpoints

Update `src/server/api/routers/leaderboard.ts` with unified endpoints.

### 4. Standardized UI Components

Create new components in the `src/components/leaderboard` directory.

## Conclusion

By implementing this unified leaderboard plan, we will create a single source of truth for leaderboard data with clear separation between academic performance and reward points. The implementation will incorporate all the rich features described in the student portal leaderboard documentation while ensuring consistency across all portals.

The cleanup plan will eliminate duplicate implementations and create a more maintainable codebase. The standardized approach will fix the single student issue, improve performance, and provide a better user experience across all portals.
