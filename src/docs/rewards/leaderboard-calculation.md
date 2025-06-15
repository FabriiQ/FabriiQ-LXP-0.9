# Leaderboard Calculation Methodology

This document outlines the methodology used for calculating and displaying leaderboards in the student portal reward system.

## Overview

Leaderboards provide students with a way to compare their progress and achievements with their peers. The system is designed to be fair, motivating, and scalable to handle large numbers of students (500,000+) efficiently.

## Leaderboard Types

The system supports several types of leaderboards:

1. **Class Leaderboards**: Rankings within a specific class
2. **Subject Leaderboards**: Rankings within a specific subject across all classes
3. **Course Leaderboards**: Rankings within a specific course across all classes
4. **Campus/Overall Leaderboards**: Rankings across the entire campus or institution

## Time Periods

Each leaderboard type can be filtered by different time periods:

1. **All-Time**: Based on all points earned since account creation
2. **Term**: Based on points earned during the current academic term
3. **Monthly**: Based on points earned during the current calendar month
4. **Weekly**: Based on points earned during the current week (Monday-Sunday)
5. **Daily**: Based on points earned during the current day

## Ranking Calculation

### Basic Ranking

The basic ranking is calculated by sorting students by their total points in descending order:

```
SELECT 
  studentId, 
  studentName, 
  SUM(points) as totalPoints
FROM 
  student_points
WHERE 
  classId = ? AND 
  createdAt >= ? AND
  status = 'ACTIVE'
GROUP BY 
  studentId, 
  studentName
ORDER BY 
  totalPoints DESC
```

### Tie-Breaking

In case of ties (students with the same number of points), the following tie-breakers are applied in order:

1. **Completion Rate**: Students with higher activity completion rates rank higher
2. **Achievement Count**: Students with more unlocked achievements rank higher
3. **Consistency**: Students with more consistent activity (fewer gaps) rank higher
4. **Earliest Achievement**: Students who reached the point total earlier rank higher

### Rank Calculation

Ranks are assigned sequentially (1, 2, 3, ...) based on the sorted order. Students with identical scores (after applying tie-breakers) receive the same rank, and the next rank is skipped.

## Data Partitioning

To handle large numbers of students efficiently, leaderboard data is partitioned in several ways:

### Time-Based Partitioning

Leaderboard data is partitioned by time period:

- **Daily Aggregates**: Updated in real-time
- **Weekly Aggregates**: Updated daily
- **Monthly Aggregates**: Updated daily
- **Term Aggregates**: Updated daily
- **All-Time Aggregates**: Updated daily

### Entity-Based Partitioning

Leaderboard data is also partitioned by entity:

- **Class Partitions**: One partition per class
- **Subject Partitions**: One partition per subject
- **Course Partitions**: One partition per course
- **Campus Partitions**: One partition per campus

### Multi-Tenancy Partitioning

For multi-tenant deployments, leaderboard data is further partitioned by institution:

- Each institution has its own set of partitions
- Institution context is validated for all leaderboard operations
- Database-level partitioning is used for efficient queries

## Leaderboard Snapshots

To improve performance and enable historical analysis, the system takes regular snapshots of leaderboard data:

```
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
```

Snapshots are taken:
- Daily for all leaderboard types
- Weekly for historical trend analysis
- At the end of each term for long-term records

## Leaderboard Entry Data

Each leaderboard entry contains:

```typescript
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
  improvementRank?: number;
}
```

## Performance Optimizations

Several optimizations are implemented to ensure leaderboard performance at scale:

### Caching Strategy

1. **In-Memory Caching**: Frequently accessed leaderboards are cached in memory
2. **Cache Invalidation**: Caches are invalidated when relevant data changes
3. **Tiered Caching**: Different cache durations for different time periods (shorter for daily, longer for all-time)

### Database Optimizations

1. **Indexing**: Proper indexes on all fields used in leaderboard queries
2. **Aggregation Tables**: Pre-aggregated data for efficient leaderboard generation
3. **Pagination**: All leaderboard queries use pagination to limit result size
4. **Query Optimization**: Carefully optimized SQL queries with proper joins and filters

### Frontend Optimizations

1. **Virtualization**: Leaderboard tables use virtualization for efficient rendering
2. **Lazy Loading**: Leaderboard data is loaded lazily as the user scrolls
3. **Incremental Updates**: Only changed entries are re-rendered when data updates

## Archiving Strategy

To manage historical data efficiently, the system implements a linear archiving methodology:

1. **Recent Data** (0-30 days): Stored in primary tables with full detail
2. **Medium-Term Data** (31-90 days): Stored in aggregated form with daily granularity
3. **Long-Term Data** (91+ days): Stored in aggregated form with weekly granularity
4. **Historical Data** (previous terms): Stored as snapshots with limited detail

## Implementation Details

The leaderboard system is implemented in the following files:
- `src/server/api/services/leaderboard.service.ts` - Core leaderboard logic
- `src/server/api/services/leaderboard.service.enhanced.ts` - Enhanced version with reward system integration
- `src/components/leaderboard/LeaderboardTable.tsx` - Basic leaderboard UI component
- `src/components/leaderboard/VirtualizedLeaderboardTable.tsx` - Optimized leaderboard with virtualization

For technical details on the API endpoints, see the [API Endpoints documentation](./api-endpoints.md).
