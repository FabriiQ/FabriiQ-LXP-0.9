# Activities System Scalability Analysis and Recommendations

## Current System Overview

The current activities system is designed to allow teachers to create learning and assessment activities for their classes. With the implementation of AI Studio and other content creation tools, we anticipate a significant increase in activity creation:

- Each teacher could create approximately 600 activities per month
- This translates to 7,200 activities per year per teacher
- With 500 classes, the system could potentially need to handle hundreds of thousands of activities

This document analyzes the current database structure and provides recommendations for improving scalability to handle this volume efficiently.

## Current Database Structure

### Activity Model

```prisma
model Activity {
  id             String                @id @default(cuid())
  title          String
  purpose        ActivityPurpose
  learningType   LearningActivityType?
  assessmentType AssessmentType?
  status         SystemStatus          @default(ACTIVE)
  subjectId      String
  topicId        String?
  classId        String
  content        Json
  activityType   String?
  h5pContentId   String?

  // Grading fields
  isGradable    Boolean @default(false)
  maxScore      Float?
  passingScore  Float?
  weightage     Float?
  gradingConfig Json?

  // Relationships
  subject       Subject        @relation(fields: [subjectId], references: [id])
  topic         SubjectTopic?  @relation(fields: [topicId], references: [id])
  class         Class          @relation(fields: [classId], references: [id])
  activityGrades ActivityGrade[]

  // Indexes
  @@index([status, classId])
  @@index([subjectId, purpose])
  @@index([topicId])
  @@index([purpose, learningType, assessmentType])
  @@index([activityType])
  @@map("activities")
}
```

### Activity Grade Model

```prisma
model ActivityGrade {
  id          String           @id @default(cuid())
  activityId  String
  studentId   String
  score       Float?
  feedback    String?
  status      SubmissionStatus @default(SUBMITTED)
  submittedAt DateTime         @default(now())
  gradedAt    DateTime?
  gradedById  String?
  content     Json?
  attachments Json?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  // Relationships
  activity Activity       @relation(fields: [activityId], references: [id])
  student  StudentProfile @relation(fields: [studentId], references: [id])
  gradedBy User?          @relation(fields: [gradedById], references: [id])

  @@unique([activityId, studentId])
  @@index([studentId])
  @@index([status])
  @@index([gradedAt])
  @@map("activity_grades")
}
```

## Current Strengths

1. **Database Indexing**: The schema includes several indexes to optimize common queries:
   - `[status, classId]` - For filtering active activities by class
   - `[subjectId, purpose]` - For filtering by subject and purpose
   - `[topicId]` - For filtering by topic
   - `[purpose, learningType, assessmentType]` - For filtering by activity type
   - `[activityType]` - For filtering by specific activity type

2. **Pagination**: The API includes pagination support for activity listings:
   ```typescript
   const { page = 1, pageSize = 10 } = pagination;
   const skip = (page - 1) * pageSize;
   ```

3. **Caching**: The system implements caching for frequently accessed data:
   ```typescript
   // Cache the pending activities fetch
   const getCachedPendingActivities = unstable_cache(
     async (studentId: string) => {
       // Query logic
     },
     ['pending-activities'],
     { revalidate: 120 } // Revalidate every 2 minutes
   );
   ```

4. **Optimized Queries**: The queries include selective field inclusion to reduce data transfer:
   ```typescript
   include: {
     subject: {
       select: {
         id: true,
         name: true
       }
     },
     // Other selective includes
   }
   ```

## Scalability Concerns

### 1. JSON Content Storage

**Issue**: All activity content is stored in a single JSON field, which can grow very large.

**Impact**:
- Large row sizes can impact database performance
- Querying within JSON is less efficient than structured data
- Increased storage requirements and backup size
- Potential performance issues when retrieving large activities

### 2. No Content Partitioning

**Issue**: All activity content is stored in a single field rather than being partitioned.

**Impact**:
- For activities with complex content (many questions, rich media), this impacts performance
- Retrieving only specific parts of an activity requires fetching the entire content
- Increased memory usage when processing activities

### 3. No Archiving Strategy

**Issue**: There doesn't appear to be an explicit strategy for archiving old activities.

**Impact**:
- With 600 activities per month per teacher, old activities will accumulate quickly
- Table size will grow continuously, potentially impacting query performance
- Backup and maintenance operations will become increasingly resource-intensive
- Teachers and students may experience slower loading times when browsing activities

### 4. Limited Database Sharding

**Issue**: No evidence of database sharding or horizontal partitioning strategies.

**Impact**:
- With hundreds of thousands of activities, a single database might become a bottleneck
- Scaling vertically (bigger server) has limits and becomes expensive
- No isolation between different types of activities or different time periods

### 5. Inefficient Activity Retrieval for Students

**Issue**: When students access activities, the system may need to query across a large dataset.

**Impact**:
- Slower loading times for student dashboards and activity lists
- Increased server load during peak usage times (e.g., when assignments are due)
- Potential for system-wide performance degradation

## Recommendations for Improved Scalability

### 1. Content Storage Optimization

**Recommendation**:
- Move large content (rich text, images, videos) to external storage like AWS S3
- Store only metadata and references in the database
- Implement a content delivery network (CDN) for serving media content

**Implementation Example**:
```typescript
// Example improved structure
content: {
  type: "document",
  metadata: { /* small metadata */ },
  contentRef: "s3://activities-content/12345.json"
}

// Service implementation
async function createActivity(data) {
  // Upload content to S3
  const contentKey = `activities/${uuid()}.json`;
  await s3Client.putObject({
    Bucket: 'activities-content',
    Key: contentKey,
    Body: JSON.stringify(data.content),
    ContentType: 'application/json'
  });
  
  // Store reference in database
  return prisma.activity.create({
    data: {
      ...data,
      content: {
        type: data.content.type,
        metadata: data.content.metadata,
        contentRef: `s3://activities-content/${contentKey}`
      }
    }
  });
}
```

**Benefits**:
- Reduced database size and improved query performance
- Better scalability for large content
- Ability to serve content directly from CDN to students
- Reduced database backup size and time

### 2. Implement Activity Archiving

**Recommendation**:
- Implement an archiving system that moves older activities to a separate table or storage
- Create a policy that automatically archives activities after a certain period
- Provide a way to restore archived activities if needed

**Implementation Example**:
```sql
-- Example archiving table
CREATE TABLE archived_activities (
  -- Same structure as activities
  archived_at TIMESTAMP NOT NULL
);

-- Archiving procedure
CREATE PROCEDURE archive_old_activities()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO archived_activities
  SELECT *, NOW() as archived_at
  FROM activities
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND status != 'ACTIVE';
  
  DELETE FROM activities
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND status != 'ACTIVE';
END;
$$;
```

**Benefits**:
- Keeps the active activities table smaller and more performant
- Reduces the impact of data growth on query performance
- Allows for different storage strategies for archived data
- Maintains access to historical data when needed

### 3. Database Partitioning

**Recommendation**:
- Implement table partitioning by academic year or term
- This would allow for more efficient queries on recent data
- Older partitions could be moved to slower, cheaper storage

**Implementation Example**:
```sql
-- Example partitioning
CREATE TABLE activities (
  -- Fields
) PARTITION BY RANGE (created_at);

CREATE TABLE activities_2023 PARTITION OF activities
  FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

CREATE TABLE activities_2024 PARTITION OF activities
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

**Benefits**:
- Queries can target specific partitions, improving performance
- Maintenance operations can be performed on individual partitions
- Different storage policies can be applied to different partitions
- Easier to implement retention policies

### 4. Enhanced Caching Strategy

**Recommendation**:
- Implement multi-level caching (memory, distributed cache, CDN)
- Cache activity content separately from metadata
- Use cache invalidation strategies based on activity updates

**Implementation Example**:
```typescript
// Example enhanced caching
const activityCache = createCache('activities', 3600); // 1 hour TTL

async function getActivityWithCaching(id: string) {
  return activityCache.getOrSet(
    `activity:${id}:metadata`,
    async () => {
      const activity = await prisma.activity.findUnique({
        where: { id },
        select: { /* metadata fields */ }
      });
      return activity;
    }
  );
}

async function getActivityContent(id: string) {
  return contentCache.getOrSet(
    `activity:${id}:content`,
    async () => {
      // Fetch content from S3 or other storage
      const activity = await getActivityWithCaching(id);
      if (!activity?.content?.contentRef) return null;
      
      const contentRef = activity.content.contentRef;
      // Extract bucket and key from contentRef (s3://bucket/key)
      const [bucket, key] = parseContentRef(contentRef);
      
      const response = await s3Client.getObject({
        Bucket: bucket,
        Key: key
      });
      
      return JSON.parse(await response.Body.transformToString());
    }
  );
}
```

**Benefits**:
- Reduced database load for frequently accessed activities
- Faster response times for students and teachers
- Better handling of traffic spikes
- More efficient use of database resources

### 5. Read/Write Splitting

**Recommendation**:
- Implement database read replicas for handling read-heavy operations
- Direct write operations to the primary database
- Scale read replicas horizontally as needed

**Implementation Example**:
```typescript
// Example implementation
const prismaWrite = new PrismaClient({ /* primary DB config */ });
const prismaRead = new PrismaClient({ /* read replica config */ });

async function createActivity(data) {
  return prismaWrite.activity.create({ data });
}

async function getActivities(filters) {
  return prismaRead.activity.findMany({ where: filters });
}
```

**Benefits**:
- Better handling of concurrent read operations
- Improved write performance by offloading reads
- Ability to scale horizontally for read-heavy workloads
- Increased system resilience

### 6. Implement Activity Versioning

**Recommendation**:
- Implement a versioning system for activities
- Store only the differences between versions rather than complete copies
- Allow teachers to revert to previous versions if needed

**Implementation Example**:
```typescript
// Example versioning structure
interface ActivityVersion {
  id: string;
  activityId: string;
  versionNumber: number;
  changes: Json; // Only the changes from previous version
  createdAt: Date;
  createdBy: string;
}

// Prisma schema addition
model ActivityVersion {
  id            String   @id @default(cuid())
  activityId    String
  versionNumber Int
  changes       Json
  createdAt     DateTime @default(now())
  createdById   String
  
  activity      Activity @relation(fields: [activityId], references: [id])
  createdBy     User     @relation(fields: [createdById], references: [id])
  
  @@unique([activityId, versionNumber])
  @@index([activityId, createdAt])
  @@map("activity_versions")
}
```

**Benefits**:
- Reduced storage requirements for activity updates
- Ability to track changes and revert if needed
- Better audit trail for activity modifications
- Improved collaboration between teachers

### 7. Implement Data Retention Policies

**Recommendation**:
- Define clear data retention policies for different types of activities
- Automatically archive or delete activities based on these policies
- Allow administrators to configure retention periods

**Implementation Example**:
```typescript
// Example retention policy configuration
const retentionPolicies = {
  LEARNING: {
    ACTIVE: '2 years',
    ARCHIVED: '5 years',
    DELETE: true
  },
  ASSESSMENT: {
    ACTIVE: '3 years',
    ARCHIVED: '7 years',
    DELETE: false // Keep indefinitely in archived state
  }
};

// Scheduled job to apply retention policies
async function applyRetentionPolicies() {
  const now = new Date();
  
  // Archive old activities
  for (const [purpose, policy] of Object.entries(retentionPolicies)) {
    const archiveDate = subYears(now, parseInt(policy.ACTIVE));
    
    await prisma.activity.updateMany({
      where: {
        purpose,
        status: 'ACTIVE',
        updatedAt: { lt: archiveDate }
      },
      data: {
        status: 'ARCHIVED'
      }
    });
    
    // Delete if policy allows
    if (policy.DELETE) {
      const deleteDate = subYears(now, parseInt(policy.ARCHIVED));
      
      await prisma.activity.deleteMany({
        where: {
          purpose,
          status: 'ARCHIVED',
          updatedAt: { lt: deleteDate }
        }
      });
    }
  }
}
```

**Benefits**:
- Automated management of data lifecycle
- Compliance with data retention requirements
- Reduced storage costs
- Improved system performance

## Implementation Priority

To address these scalability concerns, we recommend implementing the changes in the following order:

1. **Content Storage Optimization** - Highest priority as it addresses the most immediate concern of large JSON content storage
2. **Enhanced Caching Strategy** - Quick win that can improve performance without major schema changes
3. **Activity Archiving** - Important for managing the growing dataset
4. **Database Partitioning** - Medium-term solution for better data organization
5. **Read/Write Splitting** - Implement when query volume increases significantly
6. **Activity Versioning** - Useful feature that also helps with storage optimization
7. **Data Retention Policies** - Long-term data management strategy

## Monitoring and Evaluation

After implementing these changes, it's important to:

1. Set up monitoring for:
   - Database query performance
   - Storage usage growth
   - Cache hit/miss rates
   - API response times

2. Establish performance baselines and targets:
   - Maximum acceptable response time for activity listing
   - Maximum acceptable response time for activity content loading
   - Expected storage growth rate

3. Regularly review and adjust:
   - Cache TTL values
   - Archiving policies
   - Partitioning strategies
   - Content storage optimizations

## Conclusion

The current activities system has a solid foundation but requires several optimizations to handle the projected scale of hundreds of thousands of activities. By implementing the recommendations in this document, particularly focusing on content storage optimization and archiving strategies, the system should be able to scale efficiently to meet the needs of teachers and students.

These changes will not only improve performance but also reduce operational costs and provide a better user experience as the system grows.
