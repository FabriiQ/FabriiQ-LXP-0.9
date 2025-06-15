# Coordinator Portal Offline Implementation Plan

## Overview

This document outlines the implementation plan for adding offline functionality to the coordinator portal. The implementation will focus on:

1. IndexedDB storage for critical data
2. Service worker for offline page access
3. Offline-aware components with appropriate loading states
4. Background synchronization for data changes made offline

## IndexedDB Implementation

### Database Schema

```typescript
// src/features/coordinator/offline/db.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { logger } from '@/server/api/utils/logger';

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
  'classes': {
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
  'analytics': {
    key: string;
    value: {
      id: string; // e.g., 'teacher-{teacherId}-{timeframe}'
      type: string; // e.g., 'teacher', 'class', 'subject'
      referenceId: string; // teacherId, classId, or subjectId
      data: any;
      lastUpdated: number;
    };
    indexes: {
      'by-type': string;
      'by-reference': string;
      'by-last-updated': number;
    };
  };
  'syncQueue': {
    key: string;
    value: {
      id: string;
      operation: 'create' | 'update' | 'delete';
      storeName: string;
      data: any;
      attempts: number;
      lastAttempt: number | null;
      createdAt: number;
    };
    indexes: {
      'by-operation': string;
      'by-store': string;
      'by-attempts': number;
      'by-created': number;
    };
  };
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
        
        // Create classes store
        if (!db.objectStoreNames.contains('classes')) {
          const classesStore = db.createObjectStore('classes', { keyPath: 'id' });
          classesStore.createIndex('by-last-updated', 'lastUpdated');
        }
        
        // Create analytics store
        if (!db.objectStoreNames.contains('analytics')) {
          const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id' });
          analyticsStore.createIndex('by-type', 'type');
          analyticsStore.createIndex('by-reference', 'referenceId');
          analyticsStore.createIndex('by-last-updated', 'lastUpdated');
        }
        
        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncQueueStore.createIndex('by-operation', 'operation');
          syncQueueStore.createIndex('by-store', 'storeName');
          syncQueueStore.createIndex('by-attempts', 'attempts');
          syncQueueStore.createIndex('by-created', 'createdAt');
        }
      }
    });
  }
  
  return dbPromise;
}
```

### Data Access Functions

```typescript
// Teacher-related functions

/**
 * Save teacher data to IndexedDB
 */
export async function saveTeacher(teacherId: string, teacherData: any): Promise<void> {
  try {
    const db = await initDB();
    
    await db.put('teachers', {
      id: teacherId,
      data: teacherData,
      lastUpdated: Date.now()
    });
    
    logger.debug('Teacher data saved to IndexedDB', { teacherId });
  } catch (error) {
    logger.error('Error saving teacher data to IndexedDB', { error, teacherId });
    throw error;
  }
}

/**
 * Get teacher data from IndexedDB
 */
export async function getTeacher(teacherId: string): Promise<any | null> {
  try {
    const db = await initDB();
    const teacher = await db.get('teachers', teacherId);
    
    return teacher?.data || null;
  } catch (error) {
    logger.error('Error getting teacher data from IndexedDB', { error, teacherId });
    return null;
  }
}

/**
 * Get all teachers from IndexedDB
 */
export async function getAllTeachers(): Promise<any[]> {
  try {
    const db = await initDB();
    const teachers = await db.getAll('teachers');
    
    return teachers.map(teacher => teacher.data);
  } catch (error) {
    logger.error('Error getting all teachers from IndexedDB', { error });
    return [];
  }
}

// Analytics-related functions

/**
 * Save analytics data to IndexedDB
 */
export async function saveAnalytics(
  type: string,
  referenceId: string,
  data: any,
  timeframe?: string
): Promise<void> {
  try {
    const db = await initDB();
    const id = timeframe 
      ? `${type}-${referenceId}-${timeframe}` 
      : `${type}-${referenceId}`;
    
    await db.put('analytics', {
      id,
      type,
      referenceId,
      data,
      lastUpdated: Date.now()
    });
    
    logger.debug('Analytics data saved to IndexedDB', { type, referenceId });
  } catch (error) {
    logger.error('Error saving analytics data to IndexedDB', { error, type, referenceId });
    throw error;
  }
}

/**
 * Get analytics data from IndexedDB
 */
export async function getAnalytics(
  type: string,
  referenceId: string,
  timeframe?: string
): Promise<any | null> {
  try {
    const db = await initDB();
    const id = timeframe 
      ? `${type}-${referenceId}-${timeframe}` 
      : `${type}-${referenceId}`;
    
    const analytics = await db.get('analytics', id);
    
    return analytics?.data || null;
  } catch (error) {
    logger.error('Error getting analytics data from IndexedDB', { error, type, referenceId });
    return null;
  }
}

// Sync queue functions

/**
 * Add operation to sync queue
 */
export async function addToSyncQueue(
  operation: 'create' | 'update' | 'delete',
  storeName: string,
  data: any
): Promise<void> {
  try {
    const db = await initDB();
    
    await db.put('syncQueue', {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      operation,
      storeName,
      data,
      attempts: 0,
      lastAttempt: null,
      createdAt: Date.now()
    });
    
    logger.debug('Operation added to sync queue', { operation, storeName });
  } catch (error) {
    logger.error('Error adding operation to sync queue', { error, operation, storeName });
    throw error;
  }
}

/**
 * Process sync queue
 */
export async function processSyncQueue(): Promise<void> {
  if (!navigator.onLine) {
    logger.debug('Cannot process sync queue while offline');
    return;
  }
  
  try {
    const db = await initDB();
    const syncItems = await db.getAll('syncQueue');
    
    logger.debug('Processing sync queue', { itemCount: syncItems.length });
    
    for (const item of syncItems) {
      try {
        // Process item based on operation type
        // Implementation will depend on the specific API calls needed
        
        // If successful, remove from queue
        await db.delete('syncQueue', item.id);
        
        logger.debug('Sync item processed successfully', { itemId: item.id });
      } catch (error) {
        // Update attempts count
        await db.put('syncQueue', {
          ...item,
          attempts: item.attempts + 1,
          lastAttempt: Date.now()
        });
        
        logger.error('Error processing sync item', { error, itemId: item.id });
      }
    }
  } catch (error) {
    logger.error('Error processing sync queue', { error });
  }
}
```

## Service Worker Implementation

```javascript
// public/coordinator-sw.js

// Service Worker for Coordinator Portal
const CACHE_NAME = 'coordinator-portal-cache-v1';
const RUNTIME_CACHE = 'runtime-cache';
const API_CACHE = 'api-cache';

// Resources to cache on install
const PRECACHE_URLS = [
  '/admin/coordinator',
  '/admin/coordinator/dashboard',
  '/offline.html'
];

// API routes to cache
const API_ROUTES = [
  '/api/trpc/analytics.getTeacherPerformance',
  '/api/trpc/teacher.getAllTeachers',
  '/api/trpc/student.getAllStudents'
];

// Install event - precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then(cache => {
        console.log('Precaching static assets');
        return cache.addAll(PRECACHE_URLS);
      }),
      
      // Cache API routes
      caches.open(API_CACHE).then(cache => {
        console.log('Precaching API routes');
        return Promise.all(
          API_ROUTES.map(url => 
            fetch(url)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(error => console.error(`Failed to cache ${url}:`, error))
          )
        );
      })
    ])
    .then(() => self.skipWaiting())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Handle static asset requests
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request)
        .then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();
          
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(error => {
          console.error('Fetch failed:', error);
          
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          
          return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});

// Handle API requests
async function handleApiRequest(request) {
  // Try to get from cache first
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached response and update cache in background
    fetch(request)
      .then(response => {
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(API_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
        }
      })
      .catch(error => console.error('Background fetch failed:', error));
    
    return cachedResponse;
  }
  
  // If not in cache, try network
  try {
    const networkResponse = await fetch(request);
    
    // Clone and cache successful responses
    if (networkResponse && networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(API_CACHE);
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch API data:', error);
    
    // Return error response
    return new Response(JSON.stringify({ error: 'Failed to load data', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, API_CACHE];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Sync event - handle background sync
self.addEventListener('sync', event => {
  if (event.tag === 'coordinator-sync') {
    event.waitUntil(processSyncQueue());
  }
});

// Process sync queue
async function processSyncQueue() {
  // This would be implemented to work with the IndexedDB sync queue
  // For now, just log that sync was triggered
  console.log('Background sync triggered');
}
```

## React Hook for Offline Storage

```typescript
// src/features/coordinator/offline/hooks/use-offline-storage.ts

import { useState, useEffect } from 'react';
import * as db from '../db';

interface UseOfflineStorageOptions {
  syncOnReconnect?: boolean;
}

export function useOfflineStorage(storeName: string, options: UseOfflineStorageOptions = {}) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      // Trigger sync if option is enabled
      if (options.syncOnReconnect) {
        db.processSyncQueue().catch(error => {
          console.error('Error processing sync queue:', error);
        });
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [options.syncOnReconnect]);
  
  // Generic data access functions
  const getData = async (id: string, ...args: any[]) => {
    switch (storeName) {
      case 'teachers':
        return db.getTeacher(id);
      case 'students':
        return db.getStudent(id);
      case 'classes':
        return db.getClass(id);
      case 'analytics':
        return db.getAnalytics(id, args[0], args[1]);
      default:
        throw new Error(`Unknown store: ${storeName}`);
    }
  };
  
  const saveData = async (id: string, data: any, ...args: any[]) => {
    switch (storeName) {
      case 'teachers':
        return db.saveTeacher(id, data);
      case 'students':
        return db.saveStudent(id, args[0], data);
      case 'classes':
        return db.saveClass(id, data);
      case 'analytics':
        return db.saveAnalytics(id, args[0], data, args[1]);
      default:
        throw new Error(`Unknown store: ${storeName}`);
    }
  };
  
  const queueSync = async (operation: 'create' | 'update' | 'delete', data: any) => {
    return db.addToSyncQueue(operation, storeName, data);
  };
  
  return {
    isOnline,
    getData,
    saveData,
    queueSync
  };
}
```
