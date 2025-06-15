# Learning Time Records

This document describes the implementation of learning time records in the application, including the relation between ActivityGrade and LearningTimeRecord models, API endpoints, and usage examples.

## Overview

Learning time records track the time students spend on activities. This data is used for analytics, reporting, and to provide insights into student engagement and learning patterns.

The system supports two ways of storing learning time:

1. **Directly on ActivityGrade**: Basic time tracking fields are stored directly on the ActivityGrade model
2. **LearningTimeRecord relation**: More detailed time tracking with multiple sessions per activity is stored in the LearningTimeRecord model

## Database Schema

### ActivityGrade Model

The ActivityGrade model includes the following fields for learning time:

```prisma
model ActivityGrade {
  // Other fields...
  
  // Learning time fields
  timeSpentMinutes    Int?
  learningStartedAt   DateTime?
  learningCompletedAt DateTime?
  
  // Relation to learning time records
  learningTimeRecords LearningTimeRecord[]
}
```

### LearningTimeRecord Model

The LearningTimeRecord model stores detailed information about learning sessions:

```prisma
model LearningTimeRecord {
  id               String   @id @default(cuid())
  studentId        String
  activityId       String
  classId          String
  activityGradeId  String?
  timeSpentMinutes Int
  startedAt        DateTime
  completedAt      DateTime
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  partitionKey     String? // For horizontal partitioning (e.g., "class_2023_01")

  // Relations
  student       StudentProfile @relation(fields: [studentId], references: [id])
  activity      Activity       @relation(fields: [activityId], references: [id])
  class         Class          @relation(fields: [classId], references: [id])
  activityGrade ActivityGrade? @relation(fields: [activityGradeId], references: [id])
}
```

## API Endpoints

### LearningTimeRecord Router

The `learningTimeRecordRouter` provides the following endpoints:

#### Create a Learning Time Record

```typescript
// Create a new learning time record
const result = await api.learningTimeRecord.create.mutate({
  studentId: "student-id",
  activityId: "activity-id",
  classId: "class-id",
  activityGradeId: "activity-grade-id", // Optional
  timeSpentMinutes: 30,
  startedAt: new Date(),
  completedAt: new Date(),
});
```

#### Update a Learning Time Record

```typescript
// Update an existing learning time record
const result = await api.learningTimeRecord.update.mutate({
  id: "record-id",
  timeSpentMinutes: 45,
  startedAt: new Date(),
  completedAt: new Date(),
  activityGradeId: "activity-grade-id", // Optional
});
```

#### Get Learning Time Records for a Student

```typescript
// Get all learning time records for a student
const records = await api.learningTimeRecord.getByStudent.query({
  studentId: "student-id",
  classId: "class-id", // Optional
});
```

#### Get Learning Time Records for an Activity

```typescript
// Get all learning time records for an activity
const records = await api.learningTimeRecord.getByActivity.query({
  activityId: "activity-id",
});
```

### LearningTime Router

The `learningTimeRouter` provides the following endpoints:

#### Record Time Spent

```typescript
// Record time spent on an activity
const result = await api.learningTime.recordTimeSpent.mutate({
  activityId: "activity-id",
  timeSpentMinutes: 30,
  startedAt: new Date(), // Optional
  completedAt: new Date(), // Optional
});
```

#### Batch Record Time Spent

```typescript
// Batch record time spent on multiple activities
const result = await api.learningTime.batchRecordTimeSpent.mutate({
  records: [
    {
      activityId: "activity-id-1",
      timeSpentMinutes: 30,
      startedAt: Date.now(),
      completedAt: Date.now(),
    },
    {
      activityId: "activity-id-2",
      timeSpentMinutes: 45,
      startedAt: Date.now(),
      completedAt: Date.now(),
    },
  ],
});
```

#### Get Learning Time Statistics

```typescript
// Get learning time statistics for a student
const stats = await api.learningTime.getLearningTimeStats.query({
  classId: "class-id", // Optional
  startDate: new Date(), // Optional
  endDate: new Date(), // Optional
});
```

## Utility Functions

The application provides utility functions for working with learning time data:

### Calculate Total Learning Time

```typescript
import { calculateTotalLearningTime } from "@/utils/learning-time";

// Calculate total learning time for an activity grade
const totalMinutes = calculateTotalLearningTime(activityGrade);
```

### Calculate Activity Learning Time

```typescript
import { calculateActivityLearningTime } from "@/utils/learning-time";

// Calculate total learning time for an activity from both sources
const totalMinutes = calculateActivityLearningTime(
  activityGrades,
  learningTimeRecords
);
```

### Format Learning Time

```typescript
import { formatLearningTime } from "@/utils/learning-time";

// Format minutes into a human-readable string
const formattedTime = formatLearningTime(totalMinutes);
// Example: "2h 30m" or "45m"
```

### Get Learning Time Color Class

```typescript
import { getLearningTimeColorClass } from "@/utils/learning-time";

// Get a color class based on learning time duration
const colorClass = getLearningTimeColorClass(totalMinutes, expectedMinutes);
// Returns CSS class names like "text-green-600", "text-amber-500", etc.
```

## Best Practices

1. **Use Both Sources**: When displaying learning time, always consider both sources (ActivityGrade and LearningTimeRecord)
2. **Prefer Utility Functions**: Use the provided utility functions to calculate and format learning time
3. **Consider Performance**: For large datasets, use server-side aggregation instead of client-side calculations
4. **Handle Missing Data**: Always handle cases where learning time data might be missing or zero

## Implementation Examples

### Displaying Learning Time in a Component

```tsx
import { formatLearningTime, calculateTotalLearningTime } from "@/utils/learning-time";

function ActivityLearningTime({ activityGrade }) {
  const totalMinutes = calculateTotalLearningTime(activityGrade);
  const formattedTime = formatLearningTime(totalMinutes);
  
  return (
    <div className="learning-time">
      <span className="label">Learning Time:</span>
      <span className="value">{formattedTime}</span>
    </div>
  );
}
```

### Recording Learning Time

```tsx
import { api } from "@/utils/api";

function recordLearningTime(activityId, timeSpentMinutes) {
  // Record time spent on an activity
  api.learningTime.recordTimeSpent.mutate({
    activityId,
    timeSpentMinutes,
    startedAt: new Date(Date.now() - timeSpentMinutes * 60 * 1000),
    completedAt: new Date(),
  });
}
```
