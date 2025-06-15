# Leaderboard Data Partitioning Implementation

## Overview

This document details the implementation of a comprehensive data partitioning strategy for the leaderboard system. The implementation addresses scalability challenges with large datasets by partitioning data based on institution, time periods, and entity types, while also implementing a linear archiving methodology for historical data.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Partitioning Strategy](#partitioning-strategy)
5. [Linear Archiving Methodology](#linear-archiving-methodology)
6. [Implementation Details](#implementation-details)
7. [Background Jobs](#background-jobs)
8. [Performance Considerations](#performance-considerations)
9. [Usage Examples](#usage-examples)
10. [Multi-Tenancy Integration](#multi-tenancy-integration)
11. [Future Enhancements](#future-enhancements)

## Introduction

The leaderboard system is designed to handle large volumes of data, including:
- 1000+ classes
- 500,000+ students
- Multiple time periods (daily, weekly, monthly, term, all-time)
- Different entity types (class, subject, campus)
- Multiple institutions in a multi-tenant environment

To efficiently manage this data and ensure optimal performance, we've implemented a partitioning strategy that divides the data based on institutions, time periods, and entity types, along with a linear archiving methodology for historical data.

## Architecture

The leaderboard partitioning system consists of the following components:

1. **Database Schema**: Partitioned tables for leaderboard snapshots and archive tables for historical data
2. **Partitioning Service**: A service that manages the creation and retrieval of partitioned leaderboard data
3. **Archiving Jobs**: Background jobs that handle the partitioning and archiving of leaderboard data
4. **Enhanced Leaderboard Service**: An updated service that uses the partitioning system

## Database Schema

### Leaderboard Snapshots Table

The `leaderboard_snapshots` table has been converted to a partitioned table with the following structure:

```sql
CREATE TABLE "leaderboard_snapshots" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "institutionId" TEXT,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entries" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SystemStatus" NOT NULL DEFAULT 'ACTIVE',
    "timeGranularity" TEXT NOT NULL DEFAULT 'all-time',
    "partitionKey" TEXT GENERATED ALWAYS AS ("institutionId" || '_' || type || '_' || date_trunc('month', "snapshotDate")::text) STORED,

    CONSTRAINT "leaderboard_snapshots_pkey" PRIMARY KEY ("id", "partitionKey"),
    CONSTRAINT "leaderboard_snapshots_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE
) PARTITION BY LIST ("partitionKey");
```

### Archive Table

An archive table has been created to store historical leaderboard data:

```sql
CREATE TABLE "archived_leaderboard_snapshots" (
    "id" TEXT NOT NULL,
    "originalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "institutionId" TEXT,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "entries" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeGranularity" TEXT NOT NULL DEFAULT 'all-time',
    "academicYear" TEXT,
    "termId" TEXT,

    CONSTRAINT "archived_leaderboard_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "archived_leaderboard_snapshots_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
```

### Institution Table Updates

The `institutions` table has been updated to include metadata for leaderboard retention settings:

```sql
ALTER TABLE "institutions" ADD COLUMN "metadata" JSONB;
```

This allows each institution to have custom retention settings stored in the metadata field.

## Partitioning Strategy

### Institution-Based Partitioning

The primary partitioning is based on institution, ensuring complete data isolation in a multi-tenant environment:

1. **Institution Isolation**: Each institution's data is completely isolated
2. **Institution-Specific Retention**: Different institutions can have different retention policies
3. **Institution-Specific Archiving**: Archiving can be customized per institution

### Time-Based Partitioning

Leaderboard data is partitioned based on time granularity:

1. **Daily Snapshots**: Retained for 30 days
2. **Weekly Snapshots**: Retained for 90 days
3. **Monthly Snapshots**: Retained for 1 year
4. **Term Snapshots**: Retained for 2 years
5. **All-Time Snapshots**: Retained for 3 years

### Entity-Based Partitioning

Data is also partitioned based on entity type:

1. **Class Leaderboards**: Partitioned by class
2. **Subject Leaderboards**: Partitioned by subject
3. **Campus Leaderboards**: Partitioned by campus

### Partition Key

A partition key is generated for each snapshot using the following format:

```
{INSTITUTION_ID}_{ENTITY_TYPE}_{YYYY-MM}
```

For example:
- `inst_123_CLASS_2023-07` for class leaderboards from July 2023 for institution with ID 'inst_123'
- `inst_123_SUBJECT_2023-07` for subject leaderboards from July 2023 for institution with ID 'inst_123'
- `inst_123_CAMPUS_2023-07` for campus leaderboards from July 2023 for institution with ID 'inst_123'

## Linear Archiving Methodology

The linear archiving methodology implements a tiered retention policy based on time granularity:

1. **Retention Periods**:
   - Daily snapshots: 30 days
   - Weekly snapshots: 90 days
   - Monthly snapshots: 365 days
   - Term snapshots: 730 days
   - All-time snapshots: 1095 days

2. **Archiving Process**:
   - Snapshots older than their retention period are moved to the archive table
   - Archived snapshots include additional metadata such as academic year and term ID
   - The original snapshots are marked as archived but not deleted

3. **Archive Table Structure**:
   - Includes all original data plus archiving metadata
   - Indexed for efficient querying of historical data
   - Organized by academic year and term for educational context

## Implementation Details

### Leaderboard Partitioning Service

The `LeaderboardPartitioningService` manages the partitioning of leaderboard data with institution context:

```typescript
export class LeaderboardPartitioningService {
  private prisma: PrismaClient;
  private rewardSystem: RewardSystem;
  private config: PartitionConfig;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.rewardSystem = new RewardSystem({ prisma });

    // Default configuration
    this.config = {
      retentionPeriods: {
        [TimeGranularity.DAILY]: 30,
        [TimeGranularity.WEEKLY]: 90,
        [TimeGranularity.MONTHLY]: 365,
        [TimeGranularity.TERM]: 730,
        [TimeGranularity.ALL_TIME]: 1095,
      },
      institutionConfigs: [], // Institution-specific configurations
      batchSize: 100,
      archiveThreshold: 90,
    };
  }

  /**
   * Load institution-specific retention configurations from the database
   */
  async loadInstitutionConfigs(): Promise<void> {
    try {
      // Get all active institutions
      const institutions = await this.prisma.institution.findMany({
        where: { status: SystemStatus.ACTIVE },
        select: { id: true, name: true, metadata: true }
      });

      // Clear existing configs
      this.config.institutionConfigs = [];

      // Process each institution
      for (const institution of institutions) {
        // Check if institution has custom retention settings in metadata
        const metadata = institution.metadata as Record<string, any> | null;
        const retentionSettings = metadata?.leaderboardRetention || null;

        if (retentionSettings) {
          // Add institution-specific config
          this.config.institutionConfigs.push({
            institutionId: institution.id,
            retentionPeriods: retentionSettings
          });
        }
      }
    } catch (error) {
      logger.error('Error loading institution configurations', { error });
    }
  }

  // Methods for creating and managing partitioned snapshots
  // ...
}
```

Key methods include:

1. **createPartitionedSnapshot**: Creates a new leaderboard snapshot with partitioning
2. **archiveSnapshots**: Archives old snapshots based on retention policies
3. **applyLinearArchiving**: Applies the linear archiving methodology
4. **getHistoricalLeaderboard**: Retrieves historical leaderboard data
5. **getLeaderboardTrends**: Analyzes trends in leaderboard data over time

### Enhanced Leaderboard Service

The existing `LeaderboardService` has been enhanced to use the partitioning service:

```typescript
export class LeaderboardService extends ServiceBase {
  private rewardSystem: RewardSystem;
  private partitioningService: LeaderboardPartitioningService;

  constructor({ prisma }: LeaderboardServiceContext) {
    super({ prisma });
    this.rewardSystem = new RewardSystem({ prisma });
    this.partitioningService = new LeaderboardPartitioningService(prisma);
  }

  // Enhanced methods for creating and retrieving leaderboard data
  // ...
}
```

Key enhancements include:

1. **createLeaderboardSnapshot**: Updated to use partitioning
2. **getHistoricalLeaderboard**: Added to retrieve historical data
3. **getLeaderboardTrends**: Added to analyze trends over time

## Background Jobs

### Leaderboard Archiving Jobs

The `LeaderboardArchivingJobs` class manages the background processing of leaderboard data:

```typescript
export class LeaderboardArchivingJobs {
  private prisma: PrismaClient;
  private partitioningService: LeaderboardPartitioningService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.partitioningService = new LeaderboardPartitioningService(prisma);
  }

  // Methods for creating partitioned snapshots and archiving data
  // ...
}
```

Key methods include:

1. **createClassLeaderboardPartitions**: Creates partitioned snapshots for classes
2. **createSubjectLeaderboardPartitions**: Creates partitioned snapshots for subjects
3. **createCampusLeaderboardPartitions**: Creates partitioned snapshots for campuses
4. **applyLinearArchiving**: Applies the linear archiving methodology
5. **runAllJobs**: Runs all leaderboard archiving jobs

### Integration with Reward Processing Jobs

The existing `RewardProcessingJobs` class has been updated to use the new archiving jobs:

```typescript
export class RewardProcessingJobs {
  private prisma: RewardSystemPrismaClient;
  private rewardSystem: RewardSystem;
  private leaderboardArchivingJobs: LeaderboardArchivingJobs;

  constructor(prisma: PrismaClient) {
    this.prisma = getRewardSystemPrisma(prisma);
    this.rewardSystem = new RewardSystem({ prisma });
    this.leaderboardArchivingJobs = new LeaderboardArchivingJobs(prisma);
  }

  // Updated methods for reward processing
  // ...
}
```

The `runAllJobs` method has been enhanced to use the new archiving jobs:

```typescript
async runAllJobs(): Promise<{
  success: boolean;
  results: Record<string, any>;
}> {
  try {
    logger.info('Starting all reward processing jobs');

    const results: Record<string, any> = {};

    // Update point aggregates
    results.pointAggregates = await this.updatePointAggregates();

    // Run leaderboard partitioning and archiving jobs
    results.leaderboardJobs = await this.leaderboardArchivingJobs.runAllJobs();

    // For backward compatibility, also run the old snapshot creation methods
    results.classLeaderboards = await this.createClassLeaderboardSnapshots();
    results.subjectLeaderboards = await this.createSubjectLeaderboardSnapshots();
    results.campusLeaderboards = await this.createCampusLeaderboardSnapshots();

    // Archive old data using the linear archiving methodology
    results.linearArchiving = await this.leaderboardArchivingJobs.applyLinearArchiving();

    // For backward compatibility, also run the old archiving method
    results.archiveSnapshots = await this.archiveOldLeaderboardSnapshots();

    logger.info('Completed all reward processing jobs', { results });

    return {
      success: true,
      results,
    };
  } catch (error) {
    logger.error('Error running all reward processing jobs', { error });
    return {
      success: false,
      results: {},
    };
  }
}
```

## Performance Considerations

### Database Optimization

1. **Partitioned Tables**: Improve query performance by limiting the data scanned
2. **Indexes**: Added indexes for efficient querying of partitioned data
3. **Batch Processing**: Process data in batches to avoid memory issues
4. **Parallel Processing**: Process multiple entities in parallel for better throughput

### Caching Strategy

1. **Time-Based Caching**: Cache leaderboard data based on time granularity
2. **Entity-Based Caching**: Cache data for specific entities
3. **Cache Invalidation**: Invalidate cache when data changes

### Query Optimization

1. **Partition Pruning**: Only scan relevant partitions
2. **Aggregation**: Pre-calculate aggregates for faster queries
3. **Pagination**: Use pagination for large result sets

## Usage Examples

### Creating Partitioned Snapshots

```typescript
// Create a daily snapshot for a class with institution context
await leaderboardPartitioningService.createPartitionedSnapshot({
  type: EntityType.CLASS,
  referenceId: 'class123',
  institutionId: 'inst123', // Institution ID is required
  timeGranularity: TimeGranularity.DAILY,
  limit: 20,
});

// Create a weekly snapshot for a subject with institution context
await leaderboardPartitioningService.createPartitionedSnapshot({
  type: EntityType.SUBJECT,
  referenceId: 'subject456',
  institutionId: 'inst123', // Institution ID is required
  timeGranularity: TimeGranularity.WEEKLY,
  limit: 50,
});

// Create a monthly snapshot for a campus with institution context
await leaderboardPartitioningService.createPartitionedSnapshot({
  type: EntityType.CAMPUS,
  referenceId: 'campus789',
  institutionId: 'inst123', // Institution ID is required
  timeGranularity: TimeGranularity.MONTHLY,
  limit: 100,
});
```

### Retrieving Historical Data

```typescript
// Get historical leaderboard data for a class with institution context
const classHistory = await leaderboardPartitioningService.getHistoricalLeaderboard({
  type: EntityType.CLASS,
  referenceId: 'class123',
  institutionId: 'inst123', // Institution ID is required
  timeGranularity: TimeGranularity.WEEKLY,
  startDate: new Date('2023-01-01'),
  endDate: new Date('2023-12-31'),
  limit: 10,
});

// Get leaderboard trends for a subject with institution context
const subjectTrends = await leaderboardPartitioningService.getLeaderboardTrends({
  type: EntityType.SUBJECT,
  referenceId: 'subject456',
  institutionId: 'inst123', // Institution ID is required
  timeGranularity: TimeGranularity.MONTHLY,
  months: 6,
});

// Get trends for a specific student with institution context
const studentTrends = await leaderboardPartitioningService.getLeaderboardTrends({
  type: EntityType.CLASS,
  referenceId: 'class123',
  institutionId: 'inst123', // Institution ID is required
  timeGranularity: TimeGranularity.WEEKLY,
  months: 3,
  studentId: 'student789',
});
```

### Running Background Jobs

```typescript
// Create an instance of the leaderboard archiving jobs
const leaderboardArchivingJobs = new LeaderboardArchivingJobs(prisma);

// Load institution-specific configurations before running jobs
await leaderboardArchivingJobs.partitioningService.loadInstitutionConfigs();

// Run all leaderboard archiving jobs
await leaderboardArchivingJobs.runAllJobs();

// Apply linear archiving with institution-specific retention policies
await leaderboardArchivingJobs.applyLinearArchiving();

// Create partitioned snapshots for all classes in a specific institution
await leaderboardArchivingJobs.createClassLeaderboardPartitions('inst123');

// Archive snapshots for a specific institution
await leaderboardArchivingJobs.archiveSnapshots({
  institutionId: 'inst123',
  olderThanDays: 90,
  timeGranularity: TimeGranularity.DAILY
});
```

## Multi-Tenancy Integration

The leaderboard partitioning system has been fully integrated with the platform's multi-tenancy architecture:

### Institution-Level Isolation

1. **Data Isolation**: Each institution's leaderboard data is completely isolated from other institutions
2. **Partition Key**: The partition key includes the institution ID as the first component
3. **Foreign Key Constraints**: Both the leaderboard snapshots and archive tables have foreign key constraints to the institutions table

### Institution-Specific Configurations

1. **Custom Retention Policies**: Each institution can have custom retention policies defined in its metadata
2. **Example Configuration**:
   ```json
   {
     "leaderboardRetention": {
       "daily": 45,       // Keep daily snapshots for 45 days
       "weekly": 120,     // Keep weekly snapshots for 120 days
       "monthly": 365,    // Keep monthly snapshots for 1 year
       "term": 730,       // Keep term snapshots for 2 years
       "all-time": 1095   // Keep all-time snapshots for 3 years
     }
   }
   ```

3. **Dynamic Loading**: Institution configurations are loaded dynamically and applied during archiving

### Service-Level Validation

1. **Institution Context**: All service methods require an institution ID parameter
2. **Validation**: Institution existence and active status are validated before any operation
3. **Error Handling**: Appropriate error messages are returned if institution validation fails

## Future Enhancements

1. **Advanced Analytics**: Implement more advanced analytics on historical leaderboard data
2. **Machine Learning**: Use machine learning to predict student performance based on leaderboard trends
3. **Dynamic Partitioning**: Adjust partitioning strategy based on usage patterns
4. **Cross-Entity Analysis**: Analyze trends across different entity types
5. **Visualization**: Enhance visualization of leaderboard trends
6. **Database-Level Partitioning**: Implement true database-level partitioning for even better performance

## Conclusion

The leaderboard partitioning implementation provides a scalable solution for managing large volumes of leaderboard data in a multi-tenant environment. By partitioning data based on institutions, time periods, and entity types, and implementing a linear archiving methodology, the system can efficiently handle data for 500,000+ students across 1000+ classes across multiple institutions while maintaining optimal performance and data isolation.
