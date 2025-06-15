# Topic Mastery Partitioning

This document explains how topic mastery is partitioned in the system, following the same pattern as the leaderboard.

## Overview

Topic mastery data is partitioned to provide different views of student performance across Bloom's Taxonomy levels. This partitioning allows for more targeted analysis and comparison of student performance in different contexts.

## Partition Types

The system supports the following partition types:

1. **Global**: All topic masteries across the system
2. **Subject**: Topic masteries for a specific subject
3. **Topic**: Topic masteries for a specific topic
4. **Class**: Topic masteries for students in a specific class
5. **Bloom's Level**: Topic masteries sorted by performance in a specific Bloom's Taxonomy level

## Partition Structure

Each partition contains:

- **Entries**: A list of mastery entries, each representing a student's performance
- **User Position**: The position of the current user in the full list (if applicable)
- **Partition Type**: The type of partition (global, subject, topic, class, bloomsLevel)
- **Partition ID**: The ID of the partition (e.g., subject ID, topic ID, class ID)
- **Partition Name**: The name of the partition (e.g., subject name, topic name, class name)
- **Total Count**: The total number of entries in the partition

## Mastery Entry Structure

Each mastery entry contains:

- **ID**: The student's ID
- **Name**: The student's name
- **Avatar**: The student's avatar (if available)
- **Overall Mastery**: The student's overall mastery percentage
- **Mastery Level**: The student's mastery level (NOVICE, DEVELOPING, PROFICIENT, ADVANCED, EXPERT)
- **Bloom's Levels**: The student's mastery percentage for each Bloom's Taxonomy level

## Implementation

The partitioning is implemented in the `MasteryPartitionService` class, which provides methods for:

- Getting partitioned mastery data for a single partition
- Getting mastery data for multiple partitions
- Generating unique keys for partitions

## Usage Examples

### Getting a Single Partition

```typescript
const masteryPartitionService = new MasteryPartitionService(prisma);

// Get topic mastery data for a specific subject
const subjectPartition = await masteryPartitionService.getPartitionedMasteryData({
  partitionType: 'subject',
  subjectId: 'subject-123',
  limit: 10,
  userId: 'current-user-id'
});

// Get topic mastery data for a specific Bloom's level
const bloomsLevelPartition = await masteryPartitionService.getPartitionedMasteryData({
  partitionType: 'bloomsLevel',
  bloomsLevel: BloomsTaxonomyLevel.APPLY,
  limit: 10,
  userId: 'current-user-id'
});
```

### Getting Multiple Partitions

```typescript
const masteryPartitionService = new MasteryPartitionService(prisma);

// Get topic mastery data for multiple partitions
const partitions = await masteryPartitionService.getMultiPartitionMasteryData([
  {
    partitionType: 'global',
    limit: 10,
    userId: 'current-user-id'
  },
  {
    partitionType: 'subject',
    subjectId: 'subject-123',
    limit: 10,
    userId: 'current-user-id'
  },
  {
    partitionType: 'class',
    classId: 'class-456',
    limit: 10,
    userId: 'current-user-id'
  }
]);

// Access individual partitions
const globalPartition = partitions['global'];
const subjectPartition = partitions['subject_subject-123'];
const classPartition = partitions['class_class-456'];
```

## Integration with UI Components

The partitioned mastery data is designed to work seamlessly with the `MasteryLeaderboard` component, which can display the data in a user-friendly format.

```tsx
import { MasteryLeaderboard } from '@/features/bloom';

function MyComponent() {
  // ...
  
  return (
    <MasteryLeaderboard
      entries={subjectPartition.entries}
      title={`${subjectPartition.partitionName} Mastery Leaderboard`}
      highlightUserId={currentUser.id}
      showBloomsLevels={true}
      onEntryClick={handleEntryClick}
    />
  );
}
```

## Database Schema

The partitioning relies on the following database schema:

```prisma
model TopicMastery {
  id                String              @id @default(cuid())
  studentId         String
  topicId           String
  subjectId         String
  rememberLevel     Float               @default(0)
  understandLevel   Float               @default(0)
  applyLevel        Float               @default(0)
  analyzeLevel      Float               @default(0)
  evaluateLevel     Float               @default(0)
  createLevel       Float               @default(0)
  overallMastery    Float               @default(0)
  lastAssessmentDate DateTime
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  student           User                @relation(fields: [studentId], references: [id])
  topic             SubjectTopic        @relation(fields: [topicId], references: [id])
  subject           Subject             @relation(fields: [subjectId], references: [id])
  assessmentResults AssessmentResult[]

  @@unique([studentId, topicId])
}
```

## Performance Considerations

- The partitioning service uses database indexes to optimize queries
- Partitioned data is cached where appropriate to reduce database load
- Batch queries are used to retrieve data for multiple partitions efficiently
