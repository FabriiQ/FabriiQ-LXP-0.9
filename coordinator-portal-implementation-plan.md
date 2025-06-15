# Coordinator Portal Implementation Plan

## Core Components to Update

### 1. Coordinator Layout and Navigation

**File:** `src/app/admin/coordinator/layout.tsx`
**Updates:**
- Enhance mobile responsiveness
- Implement offline indicator
- Add connection status management

**File:** `src/components/coordinator/CoordinatorBottomNav.tsx`
**Updates:**
- Update with improved mobile navigation patterns
- Add badge indicators for notifications
- Implement active state indicators

### 2. Dashboard Components

**File:** `src/components/dashboard/CoordinatorDashboardContent.tsx`
**Updates:**
- Implement skeleton loaders for all sections
- Add offline support with cached data
- Enhance mobile view with progressive disclosure
- Implement teacher performance metrics

**New File:** `src/components/coordinator/TeacherPerformanceDashboard.tsx`
**Purpose:**
- Create dedicated teacher performance analytics
- Implement visualization of teaching metrics
- Add rewards and points tracking

### 3. Teacher Management Components

**File:** `src/components/coordinator/CoordinatorTeachersClient.tsx`
**Updates:**
- Enhance mobile-first design
- Add offline data caching
- Implement improved loading states

**File:** `src/components/coordinator/TeacherGrid.tsx` and `MobileTeacherGrid.tsx`
**Updates:**
- Unify design patterns between desktop and mobile
- Add offline support
- Implement skeleton loaders
- Add points and rewards integration

**File:** `src/components/coordinator/TeacherProfileView.tsx`
**Updates:**
- Enhance with performance metrics
- Add rewards history
- Implement mobile-optimized view

### 4. Student Management Components

**File:** `src/components/coordinator/CoordinatorStudentsClient.tsx`
**Updates:**
- Add offline support
- Enhance mobile view
- Implement improved loading states

**File:** `src/components/coordinator/StudentGrid.tsx` and `MobileStudentGrid.tsx`
**Updates:**
- Unify design patterns
- Add offline support
- Implement skeleton loaders
- Add rewards integration

### 5. Rewards and Points Integration

**New File:** `src/components/coordinator/rewards/CoordinatorAwardPointsDialog.tsx`
**Purpose:**
- Create UI for coordinators to award points to students and teachers
- Integrate with existing points service
- Implement offline support

**New File:** `src/components/coordinator/rewards/CoordinatorRewardsDashboard.tsx`
**Purpose:**
- Create dashboard for tracking rewards and points
- Implement leaderboard visualization
- Add filtering and sorting options

### 6. Offline Support Implementation

**New File:** `src/features/coordinator/offline/db.ts`
**Purpose:**
- Implement IndexedDB schema for coordinator data
- Create data access functions
- Add synchronization utilities

**New File:** `public/coordinator-sw.js`
**Purpose:**
- Implement service worker for coordinator portal
- Add caching strategies
- Implement offline fallbacks

## Implementation Steps

### Phase 1: Core Infrastructure (Week 1)

1. **Set up IndexedDB for Coordinator Portal**
   - Create database schema
   - Implement data access functions
   - Add synchronization utilities

2. **Implement Service Worker**
   - Configure caching strategies
   - Add offline page support
   - Implement background sync

3. **Create Base Components**
   - Develop skeleton loaders for coordinator components
   - Implement offline-aware base components
   - Create connection status indicators

### Phase 2: Dashboard and Navigation (Week 2)

1. **Update Coordinator Layout**
   - Enhance mobile responsiveness
   - Add offline indicator
   - Implement improved navigation

2. **Enhance Dashboard**
   - Implement skeleton loaders
   - Add offline support
   - Create teacher performance metrics
   - Implement mobile-optimized views

### Phase 3: Teacher and Student Management (Week 3)

1. **Update Teacher Management**
   - Enhance grid components
   - Add offline support
   - Implement improved profile view
   - Add performance metrics

2. **Update Student Management**
   - Enhance grid components
   - Add offline support
   - Implement improved profile view
   - Add rewards tracking

### Phase 4: Rewards and Points Integration (Week 4)

1. **Implement Rewards UI**
   - Create award points dialog
   - Implement rewards dashboard
   - Add leaderboard visualization

2. **Integrate with Backend**
   - Connect to existing points service
   - Implement offline synchronization
   - Add analytics for rewards

## Technical Implementation Details

### IndexedDB Implementation

```typescript
// src/features/coordinator/offline/db.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database name and version
const DB_NAME = 'coordinator-portal-db';
const DB_VERSION = 1;

// Database schema
interface CoordinatorDB extends DBSchema {
  'teachers': {
    key: string;
    value: {
      id: string;
      data: any;
      lastUpdated: number;
    };
    indexes: {
      'by-last-updated': number;
    };
  };
  'students': {
    key: string;
    value: {
      id: string;
      classId: string;
      data: any;
      lastUpdated: number;
    };
    indexes: {
      'by-class': string;
      'by-last-updated': number;
    };
  };
  // Additional stores...
}

// Database promise
let dbPromise: Promise<IDBPDatabase<CoordinatorDB>> | null = null;

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<IDBPDatabase<CoordinatorDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CoordinatorDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create teachers store
        if (!db.objectStoreNames.contains('teachers')) {
          const teachersStore = db.createObjectStore('teachers', { keyPath: 'id' });
          teachersStore.createIndex('by-last-updated', 'lastUpdated');
        }
        
        // Create students store
        if (!db.objectStoreNames.contains('students')) {
          const studentsStore = db.createObjectStore('students', { keyPath: 'id' });
          studentsStore.createIndex('by-class', 'classId');
          studentsStore.createIndex('by-last-updated', 'lastUpdated');
        }
        
        // Additional stores...
      }
    });
  }
  
  return dbPromise;
}

// Data access functions...
```

### Service Worker Implementation

```javascript
// public/coordinator-sw.js

// Service Worker for Coordinator Portal
const CACHE_NAME = 'coordinator-portal-cache-v1';
const RUNTIME_CACHE = 'runtime-cache';

// Resources to cache on install
const PRECACHE_URLS = [
  '/admin/coordinator',
  '/admin/coordinator/dashboard',
  '/offline.html'
];

// Install event - precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Implementation details...
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  // Implementation details...
});

// Sync event - handle background sync
self.addEventListener('sync', event => {
  // Implementation details...
});
```

### Skeleton Loader Implementation

```tsx
// src/components/coordinator/skeletons/TeacherGridSkeleton.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/atoms/skeleton';

export function TeacherGridSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <div className="flex justify-between mt-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```
