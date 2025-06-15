# Coordinator Portal Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Structure](#component-structure)
3. [Offline Storage Implementation](#offline-storage-implementation)
4. [Data Synchronization](#data-synchronization)
5. [Mobile-First Design](#mobile-first-design)
6. [Performance Optimizations](#performance-optimizations)
7. [UX Psychology Principles](#ux-psychology-principles)
8. [Testing](#testing)

## Architecture Overview

The Coordinator Portal is built using a modern React-based stack:

- **Frontend Framework**: Next.js 14 with App Router
- **API Layer**: tRPC for type-safe API calls
- **Database Access**: Prisma ORM
- **Offline Storage**: IndexedDB (via idb library)
- **State Management**: React Context and Hooks
- **Styling**: Tailwind CSS with shadcn/ui components
- **Authentication**: NextAuth.js

### Key Technical Decisions

1. **Server Components vs. Client Components**:
   - Server components for data-fetching and initial rendering
   - Client components for interactive elements and offline functionality

2. **Offline-First Approach**:
   - All data is cached locally for offline access
   - Synchronization queue for offline changes
   - Optimistic UI updates

3. **Mobile-First Design**:
   - Responsive layouts built for mobile first
   - Separate components for mobile and desktop when necessary
   - Touch-friendly UI elements

## Component Structure

The Coordinator Portal follows a modular component structure:

```
src/
├── components/
│   ├── coordinator/
│   │   ├── CoordinatorTeachersClient.tsx
│   │   ├── TeacherGrid.tsx
│   │   ├── MobileTeacherGrid.tsx
│   │   ├── TeacherProfileView.tsx
│   │   ├── CoordinatorStudentsClient.tsx
│   │   ├── StudentGrid.tsx
│   │   ├── MobileStudentGrid.tsx
│   │   ├── ProgramAnalyticsDashboard.tsx
│   │   └── ...
│   ├── ui/
│   │   ├── data-display/
│   │   ├── navigation/
│   │   ├── form/
│   │   └── ...
├── features/
│   ├── coordinator/
│   │   ├── offline/
│   │   │   ├── db.ts
│   │   │   ├── sync.ts
│   │   │   ├── hooks/
│   │   │   │   └── use-offline-storage.ts
│   │   │   └── index.ts
│   │   └── ...
├── app/
│   ├── admin/
│   │   ├── coordinator/
│   │   │   ├── teachers/
│   │   │   ├── students/
│   │   │   ├── programs/
│   │   │   └── ...
```

### Key Components

1. **CoordinatorTeachersClient**: Main client component for teacher management
2. **TeacherGrid**: Desktop view for teacher listing
3. **MobileTeacherGrid**: Mobile-optimized view for teacher listing
4. **TeacherProfileView**: Detailed teacher profile view
5. **CoordinatorStudentsClient**: Main client component for student management
6. **StudentGrid**: Desktop view for student listing
7. **MobileStudentGrid**: Mobile-optimized view for student listing
8. **ProgramAnalyticsDashboard**: Analytics dashboard for program data

## Offline Storage Implementation

### IndexedDB Structure

The offline storage is implemented using IndexedDB with the following object stores:

1. **teachers**:
   - Key: Teacher ID
   - Indexes: by-last-updated
   - Structure:
     ```typescript
     {
       id: string;
       data: TeacherData;
       lastUpdated: number;
     }
     ```

2. **students**:
   - Key: Student ID
   - Indexes: by-class, by-last-updated
   - Structure:
     ```typescript
     {
       id: string;
       classId: string;
       data: StudentData;
       lastUpdated: number;
     }
     ```

3. **classes**:
   - Key: Class ID
   - Indexes: by-last-updated
   - Structure:
     ```typescript
     {
       id: string;
       data: ClassData;
       lastUpdated: number;
     }
     ```

4. **analytics**:
   - Key: Generated ID (type-referenceId-timeframe)
   - Indexes: by-type, by-reference, by-last-updated
   - Structure:
     ```typescript
     {
       id: string;
       type: string;
       referenceId: string;
       data: AnalyticsData;
       lastUpdated: number;
     }
     ```

5. **syncQueue**:
   - Key: Generated ID
   - Indexes: by-operation, by-store, by-attempts, by-created
   - Structure:
     ```typescript
     {
       id: string;
       operation: 'create' | 'update' | 'delete';
       storeName: string;
       data: any;
       attempts: number;
       lastAttempt: number | null;
       createdAt: number;
     }
     ```

### Offline Storage Hook

The `useOfflineStorage` hook provides a unified interface for offline data access:

```typescript
const {
  isOnline,
  syncStatus,
  syncProgress,
  getData,
  saveData,
  queueSync,
  sync
} = useOfflineStorage(OfflineStorageType.TEACHERS);
```

This hook handles:
- Online/offline detection
- Data caching
- Synchronization status
- Error handling

## Data Synchronization

### Synchronization Process

1. **Automatic Sync**:
   - Triggered when the application comes back online
   - Configurable via `autoSync` option

2. **Manual Sync**:
   - Triggered by user action (refresh button)
   - Returns a promise that resolves when sync is complete

3. **Sync Queue Processing**:
   - Operations are processed in order of creation
   - Failed operations are retried with exponential backoff
   - Maximum retry attempts configurable

4. **Conflict Resolution**:
   - "Server wins" strategy by default
   - Timestamp-based conflict detection
   - Option for custom conflict resolution

### Implementation Details

The synchronization is implemented in `sync.ts` with the following key functions:

1. **syncCoordinatorData**: Main synchronization function
2. **processSyncQueue**: Processes the sync queue
3. **syncTeachers**: Synchronizes teacher data
4. **syncStudents**: Synchronizes student data
5. **syncAnalytics**: Synchronizes analytics data

## Mobile-First Design

### Responsive Design Strategy

1. **Mobile-First CSS**:
   - All styles are built mobile-first using Tailwind's responsive prefixes
   - Example: `className="flex-col md:flex-row"`

2. **Responsive Component Selection**:
   - The `useResponsive` hook determines which component to render
   - Example:
     ```tsx
     {isMobile ? <MobileTeacherGrid /> : <TeacherGrid />}
     ```

3. **Touch-Friendly UI**:
   - Larger touch targets for mobile (min 44px)
   - Swipe gestures for common actions
   - Bottom navigation for mobile

### Mobile-Specific Optimizations

1. **Reduced Data Loading**:
   - Pagination with smaller page sizes on mobile
   - Lazy loading of images and heavy content

2. **Simplified Views**:
   - Reduced information density on mobile
   - Progressive disclosure of complex features

3. **Performance Optimizations**:
   - Reduced animations on low-end devices
   - Optimized rendering for mobile CPUs

## Performance Optimizations

### Data Fetching

1. **Caching Strategy**:
   - Server-side caching with staleTime configuration
   - Client-side caching in IndexedDB
   - Optimistic updates for better perceived performance

2. **Query Optimization**:
   - Selective field fetching
   - Pagination for large datasets
   - Debounced search inputs

### Rendering Optimization

1. **Component Memoization**:
   - React.memo for expensive components
   - useMemo for complex calculations
   - useCallback for event handlers

2. **Code Splitting**:
   - Dynamic imports for route-based code splitting
   - Lazy loading of heavy components

## UX Psychology Principles

The Coordinator Portal implements several UX psychology principles:

1. **Visibility of System Status**:
   - Loading indicators for all async operations
   - Offline mode indicators
   - Synchronization status feedback

2. **Recognition Rather Than Recall**:
   - Consistent UI patterns across the portal
   - Visual cues for important actions
   - Contextual help and tooltips

3. **Aesthetic and Minimalist Design**:
   - Clean, uncluttered interfaces
   - Visual hierarchy to emphasize important information
   - Consistent color scheme and typography

4. **Error Prevention and Recovery**:
   - Validation before submission
   - Clear error messages
   - Automatic retry for failed operations

## Testing

### Testing Strategy

1. **Unit Tests**:
   - Jest for utility functions
   - React Testing Library for component testing

2. **Integration Tests**:
   - Testing component interactions
   - API integration testing

3. **End-to-End Tests**:
   - Cypress for critical user flows
   - Offline functionality testing

### Offline Testing

Testing offline functionality requires special consideration:

1. **Service Worker Mocking**:
   - Mock navigator.onLine property
   - Simulate online/offline events

2. **IndexedDB Testing**:
   - Use fake-indexeddb for unit tests
   - Test synchronization edge cases

3. **Network Condition Simulation**:
   - Test with throttled connections
   - Test with intermittent connectivity
