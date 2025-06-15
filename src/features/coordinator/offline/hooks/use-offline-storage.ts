'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { isOnline, syncCoordinatorData, SyncStatus, addSyncListener, removeSyncListener } from '../sync';
import * as db from '../db';
import { logger } from '@/server/api/utils/logger';

// Define OfflineConfig interface
export interface OfflineConfig {
  enabled: boolean;
  autoSync: boolean;
  persistenceEnabled: boolean;
  maxOfflineDays: number;
}

// Default offline configuration
export const DEFAULT_OFFLINE_CONFIG: OfflineConfig = {
  enabled: true,
  autoSync: true,
  persistenceEnabled: true,
  maxOfflineDays: 30
};

// Props for useOfflineStorage hook
interface UseOfflineStorageProps {
  enabled?: boolean;
  config?: Partial<OfflineConfig>;
  onStatusChange?: (isOffline: boolean) => void;
  onSyncStatusChange?: (status: SyncStatus, progress?: number) => void;
}

// Return type for useOfflineStorage hook
interface UseOfflineStorageResult {
  isOnline: boolean;
  syncStatus: SyncStatus;
  syncProgress?: number;
  getData: (id: string, ...args: any[]) => Promise<any>;
  saveData: (id: string, data: any, ...args: any[]) => Promise<void>;
  queueSync: (operation: 'create' | 'update' | 'delete', data: any) => Promise<void>;
  sync: () => Promise<boolean>;
}

/**
 * Hook for offline storage in coordinator portal
 */
export function useOfflineStorage(
  storeName: string,
  { enabled = true, config = {}, onStatusChange, onSyncStatusChange }: UseOfflineStorageProps = {}
): UseOfflineStorageResult {
  const [online, setOnline] = useState(isOnline());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.IDLE);
  const [syncProgress, setSyncProgress] = useState<number | undefined>(undefined);

  // Merge config with defaults
  const mergedConfig: OfflineConfig = {
    ...DEFAULT_OFFLINE_CONFIG,
    ...config
  };

  // Track when offline mode started
  const offlineStartTimeRef = useRef<number | null>(null);

  // Handle online status changes
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      const newOnlineStatus = isOnline();
      setOnline(newOnlineStatus);

      if (onStatusChange) {
        onStatusChange(!newOnlineStatus);
      }

      // Track offline duration
      if (!newOnlineStatus && offlineStartTimeRef.current === null) {
        offlineStartTimeRef.current = Date.now();
        logger.debug('Entered offline mode');
      } else if (newOnlineStatus && offlineStartTimeRef.current !== null) {
        const offlineDuration = Date.now() - offlineStartTimeRef.current;
        offlineStartTimeRef.current = null;
        logger.debug('Exited offline mode', { durationMs: offlineDuration });

        // Auto-sync when coming back online if enabled
        if (mergedConfig.autoSync) {
          syncCoordinatorData().catch(error => {
            logger.error('Error auto-syncing data', { error });
          });
        }
      }
    };

    // Set up window event listeners
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Initial check
    handleOnlineStatusChange();

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [mergedConfig.autoSync, onStatusChange]);

  // Handle sync status changes
  useEffect(() => {
    const handleSyncStatusChange = (status: SyncStatus, progress?: number) => {
      setSyncStatus(status);
      setSyncProgress(progress);

      if (onSyncStatusChange) {
        onSyncStatusChange(status, progress);
      }
    };

    // Add sync listener
    addSyncListener(handleSyncStatusChange);

    return () => {
      removeSyncListener(handleSyncStatusChange);
    };
  }, [onSyncStatusChange]);

  // Generic data access functions
  const getData = useCallback(async (id: string, ...args: any[]) => {
    if (!mergedConfig.enabled) {
      return null;
    }

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
        logger.warn(`Unknown store: ${storeName}`);
        return null;
    }
  }, [storeName, mergedConfig.enabled]);

  const saveData = useCallback(async (id: string, data: any, ...args: any[]) => {
    if (!mergedConfig.enabled) {
      return;
    }

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
        logger.warn(`Unknown store: ${storeName}`);
    }
  }, [storeName, mergedConfig.enabled]);

  const queueSync = useCallback(async (operation: 'create' | 'update' | 'delete', data: any) => {
    if (!mergedConfig.enabled) {
      return;
    }

    return db.addToSyncQueue(operation, storeName, data);
  }, [storeName, mergedConfig.enabled]);

  const sync = useCallback(async () => {
    if (!mergedConfig.enabled) {
      return false;
    }

    return syncCoordinatorData();
  }, [mergedConfig.enabled]);

  return {
    isOnline: online,
    syncStatus,
    syncProgress,
    getData,
    saveData,
    queueSync,
    sync
  };
}
