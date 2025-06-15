# Unified Leaderboard System

This module provides a standardized leaderboard implementation across all portals in the LXP system. It implements a clear separation between academic performance metrics and reward points to create a trusted, single source of truth.

## Features

- **Unified Data Model**: Standardized leaderboard entry interface with clear separation between academic performance and reward points
- **Partitioning**: Time-based, context-based, demographic, and custom group partitioning
- **UX Psychology Principles**: Designed to minimize relative deprivation and maximize motivation
- **Microinteractions**: Subtle animations and interactive elements for better user experience
- **Transparency**: Clear documentation of ranking algorithms and point calculations
- **Performance Optimization**: Virtualized lists, efficient caching, and optimized queries

## Usage

### Basic Usage

```typescript
import { PrismaClient } from '@prisma/client';
import { UnifiedLeaderboardService, LeaderboardEntityType, TimeGranularity } from '@/features/leaderboard';

// Initialize the Prisma client
const prisma = new PrismaClient();

// Create an instance of the unified leaderboard service
const leaderboardService = new UnifiedLeaderboardService({ prisma });

// Get class leaderboard
const classLeaderboard = await leaderboardService.getLeaderboard({
  type: LeaderboardEntityType.CLASS,
  referenceId: 'class-123',
  timeGranularity: TimeGranularity.WEEKLY,
  filterOptions: {
    limit: 10,
    offset: 0,
    includeCurrentStudent: true,
    currentStudentId: 'student-456'
  }
});

// Access leaderboard data
console.log(`Total students: ${classLeaderboard.totalStudents}`);
console.log(`Top student: ${classLeaderboard.leaderboard[0].studentName}`);
console.log(`Current student rank: ${classLeaderboard.currentStudentPosition?.rank}`);
```

### React Component Usage

```tsx
import { StandardLeaderboard } from '@/features/leaderboard';

function ClassPage({ classId }: { classId: string }) {
  return (
    <div>
      <h1>Class Leaderboard</h1>
      <StandardLeaderboard
        entityType="class"
        entityId={classId}
        timeGranularity="weekly"
        limit={10}
        showCurrentStudent={true}
      />
    </div>
  );
}
```

## Architecture

The leaderboard system is designed with a clean architecture:

- **Types**: Standardized interfaces for leaderboard entries and responses
- **Services**: Business logic for fetching and processing leaderboard data
- **Components**: React components for displaying leaderboards
- **Hooks**: React hooks for accessing leaderboard data
- **Utils**: Utility functions for calculations and data processing

## Data Model

The core of the system is the `StandardLeaderboardEntry` interface, which provides a clear separation between academic performance metrics and reward points:

```typescript
interface StandardLeaderboardEntry {
  // Core identification
  studentId: string;
  studentName: string;

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

  // Ranking and movement
  rank: number;                 // Current position
  previousRank?: number;        // Previous position

  // Additional metrics and privacy controls
  // ...
}
```

## UX Psychology Principles

The leaderboard system implements several UX psychology principles:

1. **Micro and Macro Leaderboards**: Minimizes relative deprivation by providing multiple contexts for success
2. **Progress Indicators**: Shows distance to next rank to encourage improvement
3. **Personal Best Tracking**: Encourages self-improvement rather than just competition
4. **Positive Reinforcement**: Celebrates improvements and achievements
5. **Privacy Controls**: Allows students to opt out of public rankings

## Performance Optimizations

The system is designed for high performance across all devices:

### Frontend Performance

- **Virtualized Lists**: Implemented `VirtualizedLeaderboardTable` component for efficient rendering of large datasets using `@tanstack/react-virtual`
- **Progressive Loading**: Implemented `useProgressiveLoading` hook for prioritized content loading based on importance
- **Efficient DOM Updates**: Implemented `scheduleDOMUpdate` and `DOMUpdateBatcher` utilities to batch DOM updates and reduce reflows
- **Code Splitting**: Implemented dynamic imports for leaderboard components grouped into logical bundles
- **Responsive Layouts**: Implemented CSS containment for layout and paint optimizations with minimal reflows

### Backend Performance

- **Caching**: Multi-level caching with appropriate TTLs based on timeframe
- **Partitioning**: Database partitioning for efficient data retrieval and high-scale deployments
- **Background Processing**: Implemented `BackgroundProcessingService` for complex calculations and asynchronous processing
- **Optimized Queries**: Efficient database queries with proper indexing and aggregation
- **Pagination**: Efficient pagination for large datasets

### Mobile Optimization

- **Touch-Optimized Interactions**: Implemented `useTouchInteractions` hook for mobile devices with gesture support
- **Data-Efficient API Calls**: Implemented `useDataEfficientApi` hook that adapts API calls based on network conditions
- **Battery-Efficient Updates**: Implemented `useBatteryEfficientUpdates` hook that adapts update frequency based on device state
- **Offline Support**: Robust offline functionality with data synchronization
- **Responsive Design**: Adaptive layouts for all screen sizes and orientations
