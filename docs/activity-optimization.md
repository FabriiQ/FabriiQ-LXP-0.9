# Activity System Optimization

This document provides a comprehensive overview of the optimizations implemented in the activity system to improve performance, scalability, and maintainability.

## Table of Contents

1. [Database Indexing](#database-indexing)
2. [Caching Implementation](#caching-implementation)
3. [Batch Processing](#batch-processing)
4. [Analytics Service](#analytics-service)
5. [Data Archiving](#data-archiving)
6. [API Reference](#api-reference)
7. [Performance Considerations](#performance-considerations)

## Database Indexing

### Overview

We've added strategic indexes to the `ActivityGrade` table to optimize query performance for frequently accessed data patterns. These indexes significantly improve the performance of queries related to student activity submissions, especially for high-volume operations.

### Implemented Indexes

```prisma
model ActivityGrade {
  // ... fields ...

  @@unique([activityId, studentId])
  @@index([studentId])
  @@index([status])
  @@index([gradedAt])
  @@index([submittedAt])
  @@index([activityId, submittedAt])
  @@index([studentId, submittedAt])
  @@index([isArchived])
  @@index([activityId, studentId, isArchived])
  @@index([activityId, status, isArchived])
}
```

### Benefits

- Faster retrieval of student activity history
- Improved performance for activity analytics queries
- Optimized filtering by submission date and status
- Efficient archiving operations

### When to Add More Indexes

Consider adding additional indexes if:

- New query patterns emerge that aren't covered by existing indexes
- Specific reports or analytics features require frequent access to other combinations of fields
- Performance monitoring indicates slow queries on specific fields

## Caching Implementation

### Overview

We've implemented a caching system for frequently accessed activity data to reduce database load and improve response times. The caching system uses an in-memory cache with configurable time-to-live (TTL) values.

### Key Components

- `ActivityCacheService`: Central service for managing activity-related caches
- Memory caches for:
  - Student statistics
  - Activity statistics
  - Submission details

### Cache Invalidation

Caches are automatically invalidated when:

- A new submission is processed
- A grade is updated
- An activity is archived

### Configuration Options

- `defaultTtl`: Default time-to-live for cache entries (in milliseconds)
- `maxSize`: Maximum number of entries in the cache
- Cache cleanup is performed periodically to remove expired entries

### Example Usage

```typescript
// Get student statistics from cache or compute them
const stats = await ActivityCacheService.getStudentStats(
  studentId,
  filters,
  async () => {
    // This function is only called on cache miss
    return computeExpensiveStatistics();
  }
);
```

## Batch Processing

### Overview

The batch processing system allows the application to handle high volumes of activity submissions efficiently. It uses a queue-based approach to process submissions in batches, reducing database load during peak periods.

### Key Components

- `ActivityBatchService`: Manages the submission queue and batch processing
- Priority-based queue for handling important submissions first
- Configurable batch size and processing interval
- Retry mechanism for failed submissions

### Configuration Options

- `batchSize`: Number of submissions to process in a batch
- `processingInterval`: Interval between batch processing (in milliseconds)
- `maxRetries`: Maximum number of retries for failed submissions
- `maxQueueSize`: Maximum size of the queue
- `priorityThreshold`: Threshold for high-priority processing

### Example Usage

```typescript
// Queue a submission for batch processing
const queueId = await batchService.queueSubmission(
  activityId,
  studentId,
  answers,
  clientResult,
  { storeDetailedResults: true },
  priority
);
```

## Analytics Service

### Overview

The analytics service provides comprehensive analytics for activities and student performance. It leverages the caching system for efficient data retrieval and processing.

### Key Features

- Student performance analytics
- Activity effectiveness analysis
- Comparative analytics across classes, subjects, and topics
- Trend analysis over time
- Strengths and weaknesses identification

### Analytics Types

1. **Student Analytics**
   - Overall performance metrics
   - Activity type performance
   - Time-based analysis
   - Topic performance
   - Strengths and weaknesses

2. **Activity Analytics**
   - Submission statistics
   - Score distribution
   - Question analysis
   - Student performance comparison
   - Submission time analysis

3. **Comparative Analytics**
   - Class comparison
   - Subject comparison
   - Topic comparison
   - Activity type comparison

### Example Usage

```typescript
// Get comprehensive student analytics
const analytics = await analyticsService.getStudentAnalytics(studentId, {
  classId,
  subjectId,
  topicId,
  timeRange
});
```

## Data Archiving

### Overview

The data archiving system maintains database performance by moving old activity submissions to an archive table. This approach preserves historical data while keeping the active database optimized for current operations.

### Key Components

- `ActivityArchivingService`: Manages the archiving process
- `ArchivedActivityGrade` model: Stores archived submissions
- Linear archiving strategy based on submission age
- Configurable archiving criteria

### Archiving Process

1. Identify submissions older than the threshold
2. Create summary data for each submission
3. Store the summary in the archive table
4. Mark the original submission as archived
5. Invalidate relevant caches

### Configuration Options

- `ageThresholdDays`: Age in days before a submission is eligible for archiving
- `batchSize`: Number of submissions to archive in a batch
- `preserveDetailedResults`: Whether to preserve detailed results in the archive
- `academicYearFormat`: Function to determine academic year from a date

### Example Usage

```typescript
// Archive old grades
const result = await archivingService.archiveOldGrades({
  classId,
  beforeDate,
  userId,
  dryRun
});
```

## API Reference

### Activity Router Endpoints

#### Submission Endpoints

- `submitActivity`: Submit an activity for grading
- `submitActivityBatch`: Queue an activity submission for batch processing
- `getBatchQueueStatus`: Get the status of the batch processing queue

#### Analytics Endpoints

- `getStudentActivityStats`: Get comprehensive analytics for a student
- `getActivityAnalytics`: Get comprehensive analytics for an activity
- `getComparativeAnalytics`: Get comparative analytics for activities

#### Archiving Endpoints

- `archiveActivityGrades`: Archive old activity grades
- `getArchivedGradesForStudent`: Get archived grades for a student

### Service APIs

#### ActivityCacheService

- `getStudentStats`: Get student statistics from cache or compute them
- `getActivityStats`: Get activity statistics from cache or compute them
- `getSubmissionDetails`: Get submission details from cache or compute them
- `invalidateStudentStats`: Invalidate student statistics cache
- `invalidateActivityStats`: Invalidate activity statistics cache
- `invalidateSubmissionDetails`: Invalidate submission details cache
- `cleanup`: Remove expired entries from all caches

#### ActivityBatchService

- `getInstance`: Get the singleton instance of the service
- `queueSubmission`: Add a submission to the processing queue
- `getQueueStatus`: Get the current queue status
- `clearQueue`: Clear the submission queue
- `startProcessing`: Start the batch processing timer
- `stopProcessing`: Stop the batch processing timer

#### ActivityAnalyticsService

- `getStudentAnalytics`: Get comprehensive analytics for a student
- `getActivityAnalytics`: Get comprehensive analytics for an activity
- `getComparativeAnalytics`: Get comparative analytics for activities

#### ActivityArchivingService

- `archiveOldGrades`: Archive old activity grades
- `restoreArchivedGrade`: Restore an archived grade
- `getArchivedGradesForStudent`: Get archived grades for a student
- `getArchivedGradesForActivity`: Get archived grades for an activity

## Performance Considerations

### Database Optimization

- Use the provided indexes for optimal query performance
- Consider adding additional indexes for specific query patterns
- Monitor database performance and adjust indexes as needed
- Regularly archive old data to maintain performance

### Caching Strategy

- Adjust cache TTL values based on data volatility
- Increase cache size for high-traffic environments
- Implement distributed caching (e.g., Redis) for production environments
- Ensure proper cache invalidation on data changes

### Batch Processing Configuration

- Adjust batch size based on server capacity
- Set appropriate processing interval for your workload
- Configure priority thresholds based on user experience requirements
- Monitor queue length during peak periods

### Archiving Strategy

- Set appropriate age threshold based on data retention requirements
- Schedule archiving operations during off-peak hours
- Consider incremental archiving for large datasets
- Implement data retention policies for archived data

### Monitoring and Maintenance

- Monitor cache hit rates and adjust TTL values accordingly
- Track batch processing queue length during peak periods
- Monitor database query performance
- Schedule regular archiving operations
- Implement alerting for queue overflow or processing delays
