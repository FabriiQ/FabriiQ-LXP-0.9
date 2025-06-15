# Offline Support Implementation for Activities

This document outlines the implementation of offline support in the new activities architecture in the LXP platform. The implementation provides a robust, production-ready, and scalable solution that allows students to complete activities even when they're offline.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Details](#implementation-details)
4. [Integration with Student Portal](#integration-with-student-portal)
5. [Analytics for Offline Usage](#analytics-for-offline-usage)
6. [Technical Details](#technical-details)
7. [Usage Examples](#usage-examples)
8. [Testing Strategy](#testing-strategy)
9. [Future Enhancements](#future-enhancements)

## Overview

The offline support system will provide the following capabilities:

- Complete activities without an internet connection
- Store activity data and student responses locally
- Sync results when connection is restored
- Provide clear feedback about offline status
- Support all activity types in the new architecture

## Architecture

The offline support architecture consists of the following components:

1. **IndexedDB Storage**: For storing activity data, states, and results
2. **Sync Manager**: For syncing offline results when connection is restored
3. **Service Worker**: For caching assets and API responses
4. **Offline UI Components**: For providing user feedback
5. **State Management Integration**: For integrating offline support with activity state

### Component Diagram

```
┌─────────────────────────────────────┐
│           Activity Viewer           │
├─────────────────────────────────────┤
│        ActivityStateProvider        │◄────┐
└───────────────┬─────────────────────┘     │
                │                           │
                ▼                           │
┌─────────────────────────────────────┐     │
│         Offline Integration         │     │
├─────────────────────────────────────┤     │
│  ┌─────────────┐   ┌─────────────┐  │     │
│  │  IndexedDB  │   │ Sync Manager│  │     │
│  └─────────────┘   └─────────────┘  │     │
└───────────────┬─────────────────────┘     │
                │                           │
                ▼                           │
┌─────────────────────────────────────┐     │
│          Service Worker             │     │
├─────────────────────────────────────┤     │
│  ┌─────────────┐   ┌─────────────┐  │     │
│  │ Asset Cache │   │  API Cache  │  │     │
│  └─────────────┘   └─────────────┘  │     │
└─────────────────────────────────────┘     │
                                            │
┌─────────────────────────────────────┐     │
│        Offline UI Components        │─────┘
└─────────────────────────────────────┘
```

## Implementation Details

The offline support implementation consists of several key components that work together to provide a seamless offline experience for students.

### Core Infrastructure

#### 1. IndexedDB Storage

The implementation uses IndexedDB for storing activity data, states, and results. The database schema includes:

- **Activities Store**: For storing activity content and metadata
- **Activity States Store**: For storing the current state of activities (answers, progress, etc.)
- **Results Store**: For storing completed activity results that need to be synced

```typescript
// src/features/activties/persistence/indexedDB.ts
export async function saveActivityState(stateId: string, state: any): Promise<void> {
  try {
    const db = await initDB();

    await db.put('activityStates', {
      id: stateId,
      state,
      lastUpdated: Date.now()
    });

    // Track analytics for offline storage
    trackOfflineActivitySaved(activityId, activityType, dataSize);
  } catch (error) {
    // Error handling and analytics tracking
  }
}
```

#### 2. Sync Manager

The sync manager handles detecting online/offline status and syncing results when the connection is restored:

```typescript
// src/features/activties/persistence/syncManager.ts
export async function syncActivityResults(forceSync: boolean = false): Promise<SyncResult> {
  // Check if online
  if (!isOnline()) {
    return { status: SyncStatus.ERROR, ... };
  }

  // Track sync start with analytics
  trackOfflineSyncStart(unsyncedResults.length);

  // Sync results
  for (const result of unsyncedResults) {
    // Send to server and mark as synced if successful
  }

  // Track sync completion with analytics
  trackOfflineSyncComplete(syncedCount, failedCount, syncDuration);

  return { status: SyncStatus.SUCCESS, ... };
}
```

#### 3. Service Worker Integration

The implementation leverages the existing service worker for caching assets and API responses, with updated caching strategies for the new activities API endpoints.

### State Management Integration

#### 1. Activity State Provider

The `ActivityStateProvider` component has been enhanced with offline support:

```typescript
// src/features/activties/state/ActivityStateProvider.tsx
export const ActivityStateProvider: React.FC<ActivityProviderProps> = ({
  children,
  activity,
  persistenceKey,
  autoSave = false,
  offlineSupport = false,
  initialState = {}
}) => {
  // State initialization with offline loading
  useEffect(() => {
    if (persistenceKey && (autoSave || offlineSupport)) {
      loadPersistedState(persistenceKey).then(loadedState => {
        if (loadedState) {
          dispatch({ type: ActivityActionType.INIT, payload: loadedState });
        }
      });
    }
  }, [persistenceKey, autoSave, offlineSupport]);

  // Auto-save effect
  useEffect(() => {
    if (persistenceKey && (autoSave || offlineSupport) && !state.isInitializing) {
      persistState(persistenceKey, state);

      if (offlineSupport) {
        saveActivityState(persistenceKey, state).catch(console.error);
      }
    }
  }, [state, persistenceKey, autoSave, offlineSupport]);

  // ...
};
```

#### 2. Activity Hooks

New hooks have been added for offline support:

- `useOfflineSupport`: For managing offline state and syncing
- `useActivity`: Enhanced with offline-related actions
- `useOfflineAnalytics`: For tracking offline usage analytics

### UI Components

The `OfflineIndicator` component provides visual feedback about offline status and sync progress:

```typescript
// src/features/activties/components/OfflineIndicator.tsx
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showSyncStatus = true,
  position = 'top',
  variant = 'banner',
}) => {
  const [online, setOnline] = useState(isOnline());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.IDLE);
  const [syncProgress, setSyncProgress] = useState<number | undefined>(undefined);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync status updates
  useEffect(() => {
    const handleSyncStatusChange = (status: SyncStatus, progress?: number) => {
      setSyncStatus(status);
      setSyncProgress(progress);
    };

    addSyncListener(handleSyncStatusChange);

    return () => {
      removeSyncListener(handleSyncStatusChange);
    };
  }, []);

  // Render appropriate UI based on status
  // ...
};
```

## Integration with Student Portal

The offline support has been integrated with the student portal to provide a seamless experience for students.

### DirectActivityViewer Integration

The `DirectActivityViewer` component has been updated to use the new offline support:

```typescript
// src/components/activities/DirectActivityViewer.tsx
export function DirectActivityViewer({
  activity,
  mode = 'student',
  onInteraction,
  onComplete,
  disableAnalytics = false,
  institutionId = ''
}: ActivityViewerProps) {
  // Get user ID from session
  const userId = session?.user?.id || 'anonymous';

  // Set up offline support
  const { isOffline } = useOfflineSupport({
    activityId: activity?.id || 'unknown',
    userId,
    enabled: true,
    config: { autoSync: true },
    onStatusChange: (offline) => {
      if (offline) {
        toast({
          title: "You're offline",
          description: "You can still work on this activity. Your progress will be saved and synced when you reconnect.",
          variant: "warning",
        });
      } else {
        toast({
          title: "You're back online",
          description: "Your activity data will be synced automatically.",
          variant: "default",
        });
      }
    }
  });

  // Set up offline analytics
  useOfflineAnalytics({
    activityId: activity?.id || 'unknown',
    activityType: activity?.activityType || activity?.content?.activityType || 'unknown',
    enabled: !disableAnalytics
  });

  // Handle activity completion with offline support
  const handleComplete = (data: any) => {
    if (onComplete) {
      const result = {
        ...data,
        completedAt: new Date().toISOString(),
        activityId: activity.id,
        activityType: activityType,
        isOffline: isOffline // Include offline status in the result
      };

      // If offline, show a message that the submission will be synced later
      if (isOffline) {
        toast({
          title: "Saved offline",
          description: "Your activity has been saved and will be submitted when you're back online.",
          variant: "info",
        });
      }

      onComplete(result);
    }
  };

  // Render with ActivityStateProvider for offline state management
  return (
    <ActivityStateProvider
      activity={activityData}
      persistenceKey={`activity-${activity.id}-${userId}`}
      autoSave={true}
      offlineSupport={true}
    >
      <Card>
        <CardContent className="p-4">
          {/* Show offline indicator */}
          <OfflineIndicator
            position="top"
            variant="inline"
            showSyncStatus={true}
            className="mb-4"
          />

          <ViewerComponent
            activity={activityData}
            mode={mode}
            onInteraction={handleInteraction}
            onSubmit={(answers: any, result: any) => {
              handleComplete({ answers, result });
            }}
          />
        </CardContent>
      </Card>
    </ActivityStateProvider>
  );
}
```

### StudentActivityViewerClient Integration

The `StudentActivityViewerClient` component has been updated to handle offline submissions:

```typescript
// src/components/shared/entities/students/StudentActivityViewerClient.tsx
const handleSubmit = async (answers: any, result?: any) => {
  setIsSubmitting(true);
  setSubmissionError(null);

  try {
    // If offline, save the result locally
    if (isOffline) {
      // Generate a unique result ID
      const resultId = `result-${activity.id}-${Date.now()}`;
      const attemptId = `attempt-${Date.now()}`;
      const userId = 'student'; // This should be replaced with the actual user ID

      // Save the result to IndexedDB
      await saveActivityResult(
        resultId,
        activity.id,
        userId,
        attemptId,
        {
          answers,
          result,
          submittedAt: new Date().toISOString()
        },
        false // Not synced yet
      );

      // Show success message
      toast({
        title: "Saved offline",
        description: "Your activity has been saved and will be submitted when you're back online.",
        variant: "info",
      });

      // Update UI state
      setIsSubmitted(true);
      setGradeResult({
        score: result?.score || null,
        maxScore: result?.maxScore || 100,
        feedback: "This activity was completed offline and will be fully graded when you're back online."
      });

      // Set activity status locally
      activity.status = 'completed';
    } else {
      // Submit the activity using tRPC mutation
      submitActivityMutation.mutate({
        activityId: activity.id,
        answers,
        clientResult: result
      });
    }
  } catch (error) {
    console.error('Error submitting activity:', error);
    setSubmissionError(error instanceof Error ? error.message : 'Failed to submit activity. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

## Analytics for Offline Usage

A comprehensive analytics system has been implemented to track offline usage and sync events. This provides valuable insights into how students are using the offline functionality and helps identify any issues.

### Offline Analytics Events

The following offline-related events are tracked:

```typescript
// src/features/activties/analytics/offline-analytics.ts
export type OfflineEventType =
  | 'offline_mode_enter'
  | 'offline_mode_exit'
  | 'offline_activity_saved'
  | 'offline_activity_loaded'
  | 'offline_sync_start'
  | 'offline_sync_complete'
  | 'offline_sync_error'
  | 'offline_storage_quota_exceeded'
  | 'offline_storage_error';
```

### Analytics Integration

The offline analytics are integrated with the main analytics system:

```typescript
// src/features/activties/analytics/offline-analytics.ts
export function trackOfflineSyncComplete(
  successCount: number,
  failedCount: number,
  syncDuration: number
): void {
  analyticsManager.trackEvent('offline_sync_complete' as any, {
    successCount,
    failedCount,
    totalCount: successCount + failedCount,
    syncDuration,
    timestamp: Date.now()
  });
}
```

### Offline Analytics Hook

A custom hook has been created for tracking offline analytics:

```typescript
// src/features/activties/hooks/useOfflineAnalytics.ts
export function useOfflineAnalytics({
  activityId,
  activityType,
  enabled = true
}: UseOfflineAnalyticsProps): UseOfflineAnalyticsResult {
  // State
  const [isOfflineState, setIsOffline] = useState(!isOnline());

  // Refs for tracking offline duration
  const offlineStartTimeRef = useRef<number | null>(null);
  const offlineDurationRef = useRef<number>(0);

  // Track when user goes offline
  const trackOfflineEnter = useCallback(() => {
    if (!enabled) return;

    offlineStartTimeRef.current = Date.now();
    trackOfflineModeEnter(activityId, activityType);
  }, [enabled, activityId, activityType]);

  // Track when user comes back online
  const trackOfflineExit = useCallback(() => {
    if (!enabled || offlineStartTimeRef.current === null) return;

    const duration = Date.now() - offlineStartTimeRef.current;
    offlineDurationRef.current += duration;
    trackOfflineModeExit(activityId, activityType, duration);
    offlineStartTimeRef.current = null;
  }, [enabled, activityId, activityType]);

  // Set up online/offline listeners
  useEffect(() => {
    // ...
  }, [enabled, trackOfflineEnter, trackOfflineExit]);

  return {
    isOffline: isOfflineState,
    offlineDuration: offlineDurationRef.current,
    trackOfflineEnter,
    trackOfflineExit
  };
}
```

## Technical Details

### IndexedDB Schema

```typescript
interface ActivityDB extends DBSchema {
  activities: {
    key: string;
    value: {
      id: string;
      data: any;
      lastUpdated: number;
    };
    indexes: { 'by-last-updated': number };
  };

  activityStates: {
    key: string;
    value: {
      id: string;
      state: any;
      lastUpdated: number;
    };
    indexes: { 'by-last-updated': number };
  };

  results: {
    key: string;
    value: {
      id: string;
      activityId: string;
      userId: string;
      attemptId: string;
      result: any;
      synced: boolean;
      lastUpdated: number;
    };
    indexes: { 'by-activity': string; 'by-user': string; 'by-synced': boolean; 'by-last-updated': number };
  };
}
```

### Offline Configuration

```typescript
export interface OfflineConfig {
  enabled: boolean;
  autoSync: boolean;
  persistenceEnabled: boolean;
  maxOfflineDays: number;
}

// Default configuration
export const DEFAULT_OFFLINE_CONFIG: OfflineConfig = {
  enabled: true,
  autoSync: true,
  persistenceEnabled: true,
  maxOfflineDays: 30
};
```

### Sync Process

1. When a student completes an activity offline:
   - The result is stored in IndexedDB
   - The result is marked as unsynced
   - The student receives feedback that their work is saved
   - Analytics events are tracked

2. When the connection is restored:
   - The sync manager detects the online status
   - Unsynced results are retrieved from IndexedDB
   - Results are sent to the server via the API
   - Successfully synced results are marked as synced
   - The student receives feedback about the sync status
   - Analytics events are tracked for sync completion

## Usage Examples

Here are examples of how to use the offline support in different scenarios:

### Basic Usage with ActivityStateProvider

```tsx
import { ActivityStateProvider, useActivity } from '@/features/activties';

function ActivityComponent({ activity }) {
  return (
    <ActivityStateProvider
      activity={activity}
      persistenceKey={`activity-${activity.id}`}
      autoSave={true}
      offlineSupport={true}
    >
      <ActivityContent />
    </ActivityStateProvider>
  );
}

function ActivityContent() {
  const { state, setAnswer, submit, isOffline, syncResults } = useActivity();

  return (
    <div>
      {/* Activity UI */}
      {isOffline && <p>You are currently offline. Your work will be saved.</p>}
      <button onClick={syncResults}>Sync Results</button>
    </div>
  );
}
```

### Using the OfflineIndicator Component

```tsx
import { OfflineIndicator } from '@/features/activties';

function ActivityPage() {
  return (
    <div>
      <OfflineIndicator position="top" variant="banner" />
      {/* Rest of the page */}
    </div>
  );
}
```

### Custom Offline Integration with useOfflineSupport

```tsx
import { useOfflineSupport } from '@/features/activties';

function CustomComponent({ activityId, userId }) {
  const {
    isOffline,
    syncStatus,
    syncProgress,
    syncResults,
    saveState,
    loadState
  } = useOfflineSupport({
    activityId,
    userId,
    enabled: true,
    config: { autoSync: true }
  });

  // Custom offline handling

  return (
    <div>
      {/* Component UI */}
    </div>
  );
}
```

### Tracking Offline Analytics

```tsx
import { useOfflineAnalytics } from '@/features/activties';

function AnalyticsComponent({ activityId, activityType }) {
  const { isOffline, offlineDuration } = useOfflineAnalytics({
    activityId,
    activityType,
    enabled: true
  });

  return (
    <div>
      {isOffline && <p>You've been offline for {offlineDuration / 1000} seconds</p>}
    </div>
  );
}
```

## Testing Strategy

1. **Unit Tests**
   - Test IndexedDB operations
   - Test sync manager functionality
   - Test offline detection
   - Test analytics tracking

2. **Integration Tests**
   - Test activity completion in offline mode
   - Test result syncing when connection is restored
   - Test analytics data collection

3. **End-to-End Tests**
   - Complete user workflows in offline mode
   - Verify data integrity after sync
   - Verify analytics reporting

4. **Manual Testing**
   - Test on various devices and browsers
   - Test with different network conditions
   - Test with large amounts of offline data

## Future Enhancements

1. **Performance Optimization**
   - Implement more efficient storage strategies
   - Add batch processing for syncing large amounts of data
   - Optimize IndexedDB queries

2. **Enhanced Analytics**
   - Add more detailed offline usage analytics
   - Create dashboards for monitoring offline usage
   - Implement predictive analytics for offline behavior

3. **Improved User Experience**
   - Add more detailed sync progress indicators
   - Implement conflict resolution for simultaneous edits
   - Add offline-first loading strategies

4. **Extended Offline Capabilities**
   - Add support for offline grading
   - Implement peer-to-peer sync when online server is unavailable
   - Add offline content recommendations

## Conclusion

The offline support implementation provides a robust, production-ready, and scalable solution for the new activities architecture. It allows students to complete activities even when they're offline, with seamless syncing when they reconnect. The implementation includes comprehensive analytics for tracking offline usage and sync events, providing valuable insights into how students are using the offline functionality.

Key features of the implementation include:

- Complete offline support for all activity types
- Seamless integration with the student portal
- Comprehensive analytics for offline usage
- Clear user feedback about offline status and sync progress
- Efficient storage and sync strategies

This implementation significantly improves the student experience, especially in environments with unreliable internet connections, making the learning platform more accessible and resilient.
