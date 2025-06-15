# Learning Time Tracking System

This document describes the learning time tracking system implemented in the Aivy LXP platform.

## Overview

The learning time tracking system records the time students spend on learning activities. This data is used for:

1. Analytics and reporting
2. Personalized learning recommendations
3. Compliance with educational requirements
4. Student progress tracking

## Architecture

### Database Model

The system uses a dedicated `LearningTimeRecord` model with the following structure:

```prisma
model LearningTimeRecord {
  id               String       @id @default(cuid())
  studentId        String
  activityId       String
  classId          String
  timeSpentMinutes Int
  startedAt        DateTime
  completedAt      DateTime
  partitionKey     String       // Format: class_{classId}_{year}_{month}
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  student          StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  activity         Activity     @relation(fields: [activityId], references: [id], onDelete: Cascade)
  class            Class        @relation(fields: [classId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@index([activityId])
  @@index([classId])
  @@index([partitionKey])
  @@index([completedAt])
  @@index([studentId, completedAt])
  @@index([studentId, classId])
  @@map("learning_time_records")
}
```

### Client-Side Components

1. **TimeTrackingProvider**: Context provider that manages time tracking state
2. **TimeTrackingDisplay**: Component to display the current tracking status
3. **withTimeTracking**: HOC to add time tracking to any activity component

### Server-Side Components

1. **LearningTimeService**: Service for recording and retrieving time data
2. **LearningTimeRouter**: tRPC router for time tracking API endpoints

## Partitioning Strategy

To handle large volumes of time tracking data, we use a partitioning strategy:

- Each record includes a `partitionKey` in the format `class_{classId}_{year}_{month}`
- This allows efficient querying by class and time period
- Database indexes are optimized for common query patterns

## Offline Support

The system includes offline support:

1. Time records are batched client-side
2. Records are stored in localStorage when offline
3. Records are synced when the user comes back online
4. Batch processing reduces API calls

## Usage

### Adding Time Tracking to an Activity

```tsx
// Option 1: Use the HOC
import { withTimeTracking } from '@/components/student/withTimeTracking';

function MyActivity({ activityId, ...props }) {
  return <div>Activity content</div>;
}

export const TrackedActivity = withTimeTracking(MyActivity);

// Option 2: Use the hook directly
import { useTimeTracking } from '@/components/providers/TimeTrackingProvider';

function MyActivity({ activityId }) {
  const { startTracking, stopTracking } = useTimeTracking();
  
  useEffect(() => {
    startTracking(activityId);
    return () => stopTracking(activityId);
  }, [activityId]);
  
  return <div>Activity content</div>;
}
```

### Displaying Time Tracking Status

```tsx
import { TimeTrackingDisplay } from '@/components/student/TimeTrackingDisplay';

function MyComponent({ activityId }) {
  return (
    <div>
      <h1>Activity Title</h1>
      <TimeTrackingDisplay activityId={activityId} />
    </div>
  );
}
```

### Getting Time Statistics

```tsx
import { api } from '@/trpc/react';

function LearningStats({ classId }) {
  const { data } = api.learningTime.getLearningTimeStats.useQuery({ 
    classId,
    startDate: new Date('2023-01-01'),
    endDate: new Date()
  });
  
  if (!data) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>Learning Time Statistics</h2>
      <p>Total time: {data.totalTimeSpentMinutes} minutes</p>
      <p>Activities completed: {data.totalActivitiesCompleted}</p>
      
      <h3>Time by Subject</h3>
      <ul>
        {data.timeSpentBySubject.map(subject => (
          <li key={subject.subjectId}>
            {subject.subjectName}: {subject.timeSpentMinutes} minutes
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Migration

The system includes backward compatibility with the previous time tracking approach, which stored time data in the `ActivityGrade` model's content field. The `getLearningTimeStats` method combines data from both sources.

## Performance Considerations

- Time records are batched to reduce API calls
- SQL queries use optimized indexes
- Partitioning strategy supports scaling to billions of records
- Raw SQL queries are used for aggregation operations
