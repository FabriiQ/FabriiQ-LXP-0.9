# Leaderboard Cross-Portal Standardization

## Current Implementation Comparison

This document compares the leaderboard implementations across different portals and provides recommendations for standardization.

### 1. Student Portal

**Components:**
- `StudentLeaderboard.tsx`: Custom implementation for student view
- `ClassLeaderboard.tsx`: Class-specific leaderboard with offline support

**Features:**
- Shows student's own position prominently
- Displays position change (improvement)
- Tabs for class, grade, and campus views
- Focuses on student's relative performance

**Data Model:**
```typescript
interface StudentLeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  position: number;
  score: number;
  subject?: string;
}
```

**Ranking Logic:**
- Uses `position` property directly
- No explicit handling of ties
- Displays medals for top 3 positions

### 2. Teacher Portal

**Components:**
- `UnifiedLeaderboard.tsx`: Main component used across teacher views
- `LeaderboardTable.tsx`: Table component for displaying rankings

**Features:**
- Tabs for class, subject, course, and campus views
- Additional cards for top performers, most improved, and participation
- Pagination for large datasets

**Data Model:**
```typescript
interface LeaderboardEntry {
  rank?: number;
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  score: number;
  totalPoints: number;
  totalMaxPoints: number;
  completionRate: number;
  totalActivities: number;
  completedActivities: number;
  improvement?: number;
  previousScore?: number;
  improvementRank?: number;
  rewardPoints?: number;
  level?: number;
}
```

**Ranking Logic:**
- Sorts by reward points first, then by score
- Assigns ranks based on array index after sorting
- No explicit handling of ties

### 3. Coordinator Portal

**Components:**
- Uses the same `UnifiedLeaderboard.tsx` as the teacher portal
- Adds program and course level views

**Features:**
- Similar to teacher portal but with broader scope
- Access to cross-class and cross-course data

**Data Model:**
- Same as teacher portal

**Ranking Logic:**
- Same as teacher portal

### 4. Campus Portal (Admin)

**Components:**
- Uses the same `UnifiedLeaderboard.tsx` as other portals
- `TopStudentsLeaderboard.tsx`: Simplified view for dashboards

**Features:**
- Campus-wide leaderboard
- Institution-level analytics
- Historical data comparison

**Data Model:**
- Same as teacher portal

**Ranking Logic:**
- Same as teacher portal

## Key Inconsistencies

1. **Different Data Models:**
   - Student portal uses a simplified model with `position`
   - Other portals use a comprehensive model with `rank`
   - Field naming is inconsistent (`position` vs `rank`, `score` vs `points`)

2. **Different Ranking Logic:**
   - Student portal uses pre-calculated positions
   - Other portals calculate ranks based on array indices
   - Ties are not handled consistently

3. **Different UI Components:**
   - Student portal has a custom implementation
   - Other portals share the `UnifiedLeaderboard` component
   - Mobile responsiveness varies between implementations

4. **Different Data Sources:**
   - Student portal may use mock data in some places
   - Teacher portal uses the optimized leaderboard service
   - Some implementations may bypass the standard API endpoints

## Standardization Recommendations

### 1. Unified Data Model

Create a single, comprehensive data model to be used across all portals:

```typescript
export interface StandardLeaderboardEntry {
  // Core identification
  studentId: string;
  studentName: string;
  enrollmentNumber?: string;
  
  // Academic performance
  academicScore: number;        // 0-100% based on grades
  
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
}
```

### 2. Consistent API Endpoints

Create a set of standardized API endpoints to be used by all portals:

```typescript
// Example TRPC router
export const leaderboardRouter = createTRPCRouter({
  getLeaderboard: protectedProcedure
    .input(
      z.object({
        type: z.enum(['class', 'subject', 'course', 'campus']),
        referenceId: z.string(),
        period: z.nativeEnum(LeaderboardPeriod).optional().default(LeaderboardPeriod.ALL_TIME),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().optional().default(0),
        includeCurrentStudent: z.boolean().optional().default(false),
        currentStudentId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const leaderboardService = new StandardLeaderboardService({ prisma: ctx.prisma });
      return leaderboardService.getLeaderboard(input);
    }),
});
```

### 3. Standardized UI Components

Create a set of standardized UI components that can be used across all portals:

1. **BaseLeaderboardTable**: Core table component with standard styling
2. **StudentLeaderboardView**: Extends BaseLeaderboardTable with student-specific features
3. **TeacherLeaderboardView**: Extends BaseLeaderboardTable with teacher-specific features
4. **AdminLeaderboardView**: Extends BaseLeaderboardTable with admin-specific features

### 4. Consistent Ranking Algorithm

Implement a consistent ranking algorithm across all services:

```typescript
/**
 * Assigns ranks to leaderboard entries with proper handling of ties
 */
function assignRanks<T extends { rewardPoints: number; academicScore: number; rank: number }>(entries: T[]): T[] {
  // Sort by reward points first, then by academic score
  entries.sort((a, b) => {
    if (b.rewardPoints !== a.rewardPoints) {
      return b.rewardPoints - a.rewardPoints;
    }
    return b.academicScore - a.academicScore;
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

## Implementation Plan

### Phase 1: Data Model Standardization

1. Create the `StandardLeaderboardEntry` interface
2. Update backend services to use this model
3. Create adapters for existing components to work with the new model

### Phase 2: API Standardization

1. Create the standardized API endpoints
2. Update existing endpoints to use the new model
3. Deprecate any redundant endpoints

### Phase 3: UI Component Standardization

1. Create the base leaderboard components
2. Update portal-specific views to use the base components
3. Ensure consistent styling and behavior across all portals

### Phase 4: Testing and Validation

1. Test across all portals with various datasets
2. Verify consistent behavior and appearance
3. Gather feedback from users of different portals

## Benefits of Standardization

1. **Consistent User Experience**: Users will have a consistent experience regardless of which portal they use
2. **Reduced Maintenance**: A single set of components and services is easier to maintain than multiple implementations
3. **Improved Performance**: Standardized queries and caching strategies can improve performance across all portals
4. **Better Code Quality**: Standardized interfaces and components lead to better code quality and fewer bugs
5. **Easier Onboarding**: New developers can more easily understand and work with a standardized system

## Conclusion

By standardizing the leaderboard implementation across all portals, we can provide a consistent user experience, reduce maintenance overhead, and improve overall system quality. The standardization should focus on creating a unified data model, consistent API endpoints, standardized UI components, and a consistent ranking algorithm.
