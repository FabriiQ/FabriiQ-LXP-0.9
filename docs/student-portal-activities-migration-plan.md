# Student Portal Activities Migration Plan

This document outlines the plan to update the student portal activities to use the new activities architecture, replacing the older activities code with the new implementation.

## Current Implementation Analysis

The current student portal activities implementation has the following components:

1. **Server-Side Data Fetching**:
   - Activities are fetched in `src/app/student/activities/page.tsx` using Prisma queries
   - Activity data includes basic metadata and content

2. **Activity Grid**:
   - `StudentActivityGridClient` component renders a list of activities
   - `StudentActivityGrid` component provides filtering and view options (grid/list)
   - Activities are displayed as cards with status indicators

3. **Activity Viewer**:
   - `StudentActivityViewerClient` component in `src/components/shared/entities/students/StudentActivityViewerClient.tsx`
   - Conditionally renders either:
     - Legacy `StudentActivityViewer` for activities without `activityType`
     - New `ActivityViewer` for activities with `activityType`

4. **Offline Support**:
   - `ActivitySyncService` handles syncing of offline activities
   - Pending activities are tracked and synced when online

5. **Activity Registry**:
   - The old implementation uses a simpler registry in `src/components/shared/entities/activities/ActivityRegistry.ts`
   - The new architecture uses a more robust registry in `src/features/activities/registry/ActivityRegistry.ts`

## New Architecture Overview

The new activities architecture provides:

1. **Modular Component-Based Design**:
   - Clear separation between activity types
   - Standardized interfaces for editors and viewers
   - Consistent state management

2. **Enhanced Registry System**:
   - Type-safe registration of activity types
   - Capability-based activity type discovery
   - Lazy loading for better performance

3. **Improved State Management**:
   - Consistent state handling across activity types
   - Progress tracking
   - Submission handling

4. **Offline Support**:
   - IndexedDB for local storage
   - Background sync for offline submissions
   - Service worker integration

5. **Analytics and Monitoring**:
   - Performance tracking
   - Usage analytics
   - Error monitoring

## Migration Plan

### Phase 1: Preparation and Infrastructure

1. **Implement Direct Integration with New Architecture**:
   - Implement student portal components using the new activity architecture directly
   - No need for backward compatibility since the database is empty

2. **Update Activity Fetching**:
   - Modify server-side data fetching to use the new activity format
   - Ensure proper metadata is included for all activity types

3. **Implement Registry Integration**:
   - Update `ActivityRegistryProvider` to use the new registry
   - Ensure all activity types are properly registered

### Phase 2: Student Activity Grid Updates

1. **Update StudentActivityGridClient**:
   - Modify to handle new activity format
   - Update activity card rendering to use new activity type information

2. **Update Filtering and Sorting**:
   - Enhance filtering to use new activity type capabilities
   - Add sorting options based on new metadata

3. **Add Activity Type Icons**:
   - Implement activity type icons based on registered activity types
   - Ensure consistent visual representation

### Phase 3: Student Activity Viewer Updates

1. **Create New StudentActivityViewer**:
   - Implement a new viewer component that uses the new architecture
   - Support all activity types from the registry

2. **Update Activity Submission Logic**:
   - Implement standardized submission handling
   - Integrate with the grading system
   - Support offline submissions

3. **Add Progress Tracking**:
   - Implement progress tracking for all activity types
   - Support resuming activities

### Phase 4: Offline Support Enhancements

1. **Update Offline Storage**:
   - Enhance offline storage to use IndexedDB
   - Implement versioning for offline data

2. **Improve Sync Service**:
   - Update sync service to handle new activity formats
   - Add conflict resolution for offline submissions

3. **Add Background Sync**:
   - Implement background sync using service workers
   - Add retry logic for failed syncs

### Phase 5: Testing and Rollout

1. **Create Test Activities**:
   - Create test activities for each activity type
   - Ensure all activity types work correctly

2. **Implement Feature Flags**:
   - Add feature flags to control rollout
   - Allow gradual migration of activities

3. **Monitor Performance**:
   - Track performance metrics
   - Identify and fix bottlenecks

## Implementation Details

### 1. Update Activity Registry Provider

```tsx
// src/app/activity-registry-provider.tsx
'use client';

import { useEffect } from 'react';

// Import the new activity registry
import ActivityRegistry from '@/features/activities/registry';
// Import activity types
import '@/features/activities/types/multiple-choice';
import '@/features/activities/types/true-false';
// ... other activity types

export function ActivityRegistryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('ActivityRegistryProvider: Initializing activity registry');
    // Log all registered activity types
    console.log('Registered activity types:', ActivityRegistry.getAllInfo());
  }, []);

  return <>{children}</>;
}
```

### 2. Create Activity Data Model

```tsx
// src/features/activities/types/activity-schema.ts
import { SystemStatus } from '@prisma/client';
import { ActivitySchema } from '@/features/activities/types';

/**
 * Creates a properly formatted activity from database data
 */
export function createActivityFromData(activityData: any): ActivitySchema<any> {
  return {
    id: activityData.id,
    title: activityData.title,
    instructions: activityData.instructions || '',
    type: activityData.activityType,
    data: activityData.content || {},
    timeLimit: activityData.timeLimit,
    passingScore: activityData.passingScore,
    showFeedbackImmediately: activityData.showFeedbackImmediately || false,
    metadata: {
      subjectId: activityData.subjectId,
      classId: activityData.classId,
      topicId: activityData.topicId,
      status: activityData.status || SystemStatus.ACTIVE,
      dueDate: activityData.dueDate,
    }
  };
}
```

### 3. Update Student Activity Grid

```tsx
// src/components/shared/entities/students/StudentActivityGrid.tsx
import { ActivityCard } from '@/features/activities/components/ActivityCard';
import { createActivityFromData } from '@/features/activities/types/activity-schema';
import ActivityRegistry from '@/features/activities/registry';

// Inside the component
const renderActivityCard = (activity: any) => {
  // Create properly formatted activity
  const formattedActivity = createActivityFromData(activity);

  // Get activity type info
  const activityTypeInfo = ActivityRegistry.get(formattedActivity.type);

  if (!activityTypeInfo) {
    // Handle unknown activity type
    return (
      <Card key={activity.id} className="overflow-hidden">
        <CardHeader>
          <CardTitle>{activity.title}</CardTitle>
          <CardDescription>Unknown activity type</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Use new ActivityCard component
  return (
    <ActivityCard
      key={activity.id}
      activity={formattedActivity}
      activityTypeInfo={activityTypeInfo}
      onClick={() => router.push(`/student/activities/${activity.id}`)}
    />
  );
};
```

### 4. Update Student Activity Viewer

```tsx
// src/components/shared/entities/students/StudentActivityViewerClient.tsx
import { ActivityContainer } from '@/features/activities/components/ActivityContainer';
import { ActivityStateProvider } from '@/features/activities/state/ActivityStateProvider';
import { createActivityFromData } from '@/features/activities/types/activity-schema';
import ActivityRegistry from '@/features/activities/registry';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';

export default function StudentActivityViewerClient({ activity }: StudentActivityViewerClientProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id || '';

  // Create properly formatted activity
  const formattedActivity = createActivityFromData(activity);

  // Get activity type
  const activityType = ActivityRegistry.get(formattedActivity.type);

  if (!activityType) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold text-red-600">Unsupported Activity Type</h2>
        <p className="text-gray-600">This activity type ({formattedActivity.type}) is not supported.</p>
      </div>
    );
  }

  // Generate a unique attempt ID
  const generateAttemptId = () => {
    return `${activity.id}-${userId}-${uuidv4()}`;
  };

  // Handle activity submission
  const handleSubmit = async (answers: any, score: number) => {
    try {
      const response = await fetch(`/api/activities/${activity.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          attemptId: generateAttemptId(),
          answers,
          score,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit activity');
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting activity:', error);
      // Store for offline sync
      return { success: false, error: 'Stored for offline sync' };
    }
  };

  // Use new activity components
  return (
    <ActivityStateProvider
      activity={formattedActivity}
      userId={userId}
      attemptId={generateAttemptId()}
      onComplete={handleSubmit}
      persistenceKey={`activity-${activity.id}`}
      autoSave={true}
      offlineSupport={true}
    >
      <ActivityContainer />
    </ActivityStateProvider>
  );
}
```

### 5. Update Server-Side Data Fetching

```tsx
// src/app/student/activities/page.tsx
// Inside the getCachedStudentActivities function

// Get all activities for these classes using standard Prisma queries
const activities = await prisma.activity.findMany({
  where: {
    classId: { in: classIds },
    status: SystemStatus.ACTIVE,
  },
  select: {
    id: true,
    title: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    classId: true,
    subjectId: true,
    topicId: true,
    learningType: true,
    maxScore: true,
    content: true,
    // Add additional fields needed for new architecture
    activityType: true,
    isGradable: true,
    class: {
      select: {
        id: true,
        name: true,
      },
    },
    subject: {
      select: {
        id: true,
        name: true,
      },
    },
    topic: {
      select: {
        id: true,
        title: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
});
```

### 6. Implement Offline Support

```tsx
// src/features/activities/persistence/offline-storage.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ActivityDBSchema extends DBSchema {
  activities: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
  };
  submissions: {
    key: string;
    value: {
      activityId: string;
      userId: string;
      attemptId: string;
      answers: any;
      timestamp: number;
      synced: boolean;
    };
  };
}

let db: IDBPDatabase<ActivityDBSchema> | null = null;

export async function getDB() {
  if (!db) {
    db = await openDB<ActivityDBSchema>('activities-db', 1, {
      upgrade(database) {
        // Create stores
        database.createObjectStore('activities', { keyPath: 'id' });
        database.createObjectStore('submissions', { keyPath: 'attemptId' });
      },
    });
  }
  return db;
}

export async function saveActivityData(activityId: string, data: any) {
  const db = await getDB();
  await db.put('activities', {
    id: activityId,
    data,
    timestamp: Date.now(),
  });
}

export async function loadActivityData(activityId: string) {
  const db = await getDB();
  return await db.get('activities', activityId);
}

export async function saveSubmission(
  activityId: string,
  userId: string,
  attemptId: string,
  answers: any
) {
  const db = await getDB();
  await db.put('submissions', {
    activityId,
    userId,
    attemptId,
    answers,
    timestamp: Date.now(),
    synced: false,
  });
}

export async function getUnsyncedSubmissions() {
  const db = await getDB();
  const submissions = await db.getAll('submissions');
  return submissions.filter(submission => !submission.synced);
}

export async function markSubmissionAsSynced(attemptId: string) {
  const db = await getDB();
  const submission = await db.get('submissions', attemptId);
  if (submission) {
    submission.synced = true;
    await db.put('submissions', submission);
  }
}
```

### 7. Update Activity Sync Service

```tsx
// src/services/activity-sync.service.ts
import { getUnsyncedSubmissions, markSubmissionAsSynced } from '@/features/activities/persistence/offline-storage';

export class ActivitySyncService {
  private static instance: ActivitySyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  private constructor() {}

  public static getInstance(): ActivitySyncService {
    if (!ActivitySyncService.instance) {
      ActivitySyncService.instance = new ActivitySyncService();
    }
    return ActivitySyncService.instance;
  }

  public start(intervalMs: number = 60000): void {
    if (this.syncInterval) {
      this.stop();
    }
    this.syncInterval = setInterval(() => this.syncIfOnline(), intervalMs);
  }

  public stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }

  private async syncIfOnline(): Promise<void> {
    if (this.isOnline() && !this.isSyncing) {
      await this.syncNow();
    }
  }

  public async syncNow(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let success = 0;
    let failed = 0;

    try {
      const unsyncedSubmissions = await getUnsyncedSubmissions();

      for (const submission of unsyncedSubmissions) {
        try {
          // Submit to server
          const response = await fetch(`/api/activities/${submission.activityId}/submit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: submission.userId,
              attemptId: submission.attemptId,
              answers: submission.answers,
            }),
          });

          if (response.ok) {
            // Mark as synced
            await markSubmissionAsSynced(submission.attemptId);
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error('Error syncing submission:', error);
          failed++;
        }
      }
    } catch (error) {
      console.error('Error in sync process:', error);
    } finally {
      this.isSyncing = false;
    }

    return { success, failed };
  }
}
```

## Migration Strategy

### Direct Implementation Approach

1. **Clean Implementation**:
   - Implement the new architecture directly without backward compatibility
   - Create all activities using the new format from the start
   - Ensure consistent data structure across all activity types

2. **Activity Type Implementation**:
   - Implement all activity types in parallel
   - Ensure consistent user experience across all types
   - Focus on mobile-first design and performance

3. **Testing Strategy**:
   - Create test activities for each type
   - Test on different devices and network conditions
   - Verify offline functionality

### Rollout Plan

1. **Phase 1 (Week 1-2)**:
   - Implement activity data model
   - Update activity registry provider
   - Create basic activity components

2. **Phase 2 (Week 3-4)**:
   - Implement student activity grid
   - Create activity cards for all types
   - Implement activity viewer components

3. **Phase 3 (Week 5-6)**:
   - Implement offline storage
   - Create submission handling
   - Test activity completion and grading

4. **Phase 4 (Week 7-8)**:
   - Implement sync service
   - Add background sync capabilities
   - Final testing and optimization

## Conclusion

This implementation plan provides a comprehensive approach to creating student portal activities using the new activities architecture. By following this plan, we can ensure a clean implementation with optimal performance and user experience.

The new architecture will provide significant benefits:
- Better performance through code splitting and lazy loading
- Enhanced offline support
- Improved analytics and monitoring
- Consistent user experience across activity types
- Easier maintenance and extension

After completing this migration, all student activities will use the new architecture, providing a more robust and maintainable solution for the future.
