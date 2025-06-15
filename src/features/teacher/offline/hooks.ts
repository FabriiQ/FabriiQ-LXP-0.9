'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { isOnline, syncTeacherData, SyncStatus, SyncResult, addSyncListener, removeSyncListener } from './sync'; // Added SyncResult
import { trackOfflineModeEnter, trackOfflineModeExit } from './analytics';
import { api } from '@/trpc/react'; // Added for tRPC context

// Define OfflineConfig here to avoid circular dependency
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

interface UseOfflineSupportProps {
  teacherId: string;
  enabled?: boolean;
  config?: Partial<OfflineConfig>;
  onStatusChange?: (isOffline: boolean) => void;
  onSyncStatusChange?: (status: SyncStatus, progress?: number) => void;
  currentClassId?: string; // Optional: for more targeted invalidations
}

interface UseOfflineSupportResult {
  isOffline: boolean;
  syncStatus: SyncStatus;
  syncProgress: number | undefined;
  syncTeacher: () => Promise<SyncResult | undefined>; // Return SyncResult
}

/**
 * Hook for offline support in teacher portal
 */
export function useOfflineSupport({
  teacherId,
  enabled = true,
  config = {},
  onStatusChange,
  onSyncStatusChange,
  currentClassId, // Destructure, though not used in this specific invalidation logic yet
}: UseOfflineSupportProps): UseOfflineSupportResult {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.IDLE);
  const [syncProgress, setSyncProgress] = useState<number | undefined>(undefined);
  const utils = api.useContext(); // Get tRPC utils for invalidation

  // Merge config with defaults
  const mergedConfig: OfflineConfig = {
    ...DEFAULT_OFFLINE_CONFIG,
    ...config
  };

  // Track when offline mode started
  const offlineStartTimeRef = useRef<number | null>(null);

  // Function to perform invalidations
  const invalidateSyncedData = useCallback(() => {
    console.log('[Sync] Invalidating relevant queries after successful sync.');
    // Broad invalidation for simplicity, adjust if currentClassId or more specific needs arise.
    utils.teacher.invalidate().catch(err => console.error("Error invalidating teacher queries:", err));
    utils.assessment.invalidate().catch(err => console.error("Error invalidating assessment queries:", err));
    utils.attendance.invalidate().catch(err => console.error("Error invalidating attendance queries:", err));
    // Consider other routers if they exist and are affected by sync, e.g., utils.activity.invalidate();
  }, [utils]);


  // Handle online/offline status changes
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = async () => { // Make async to await syncTeacherData
      setIsOffline(false);

      if (offlineStartTimeRef.current) {
        const offlineDuration = Date.now() - offlineStartTimeRef.current;
        trackOfflineModeExit(teacherId, 'teacher', offlineDuration);
        offlineStartTimeRef.current = null;
      }
      if (onStatusChange) onStatusChange(false);

      if (mergedConfig.autoSync) {
        console.log('[Sync] Auto-sync triggered on going online.');
        const syncResult = await syncTeacherData(); // Await the result
        if (syncResult.status === SyncStatus.SUCCESS && syncResult.syncedCount > 0) {
          invalidateSyncedData();
        }
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      trackOfflineModeEnter(teacherId, 'teacher');
      offlineStartTimeRef.current = Date.now();
      if (onStatusChange) onStatusChange(true);
    };

    // Initial status check & potential initial sync
    const online = isOnline();
    setIsOffline(!online);
    if (!online && !offlineStartTimeRef.current) {
        trackOfflineModeEnter(teacherId, 'teacher');
        offlineStartTimeRef.current = Date.now();
    } else if (online && mergedConfig.autoSync && syncStatus !== SyncStatus.SYNCING) {
        // Attempt initial sync if online and not already syncing
        (async () => {
            console.log('[Sync] Initial auto-sync attempt on load (if online).');
            const syncResult = await syncTeacherData();
            if (syncResult.status === SyncStatus.SUCCESS && syncResult.syncedCount > 0) {
                invalidateSyncedData();
            }
        })();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (offlineStartTimeRef.current) { // Ensure cleanup if component unmounts while offline
        const offlineDuration = Date.now() - offlineStartTimeRef.current;
        trackOfflineModeExit(teacherId, 'teacher', offlineDuration);
      }
    };
  }, [enabled, teacherId, mergedConfig.autoSync, onStatusChange, invalidateSyncedData, syncStatus]); // Added invalidateSyncedData and syncStatus

  // Listen for sync status changes
  useEffect(() => {
    if (!enabled) return;
    const handleSyncStatusChange = (status: SyncStatus, progress?: number) => {
      setSyncStatus(status);
      setSyncProgress(progress);
      if (onSyncStatusChange) onSyncStatusChange(status, progress);
    };
    addSyncListener(handleSyncStatusChange);
    return () => removeSyncListener(handleSyncStatusChange);
  }, [enabled, onSyncStatusChange]);

  // Sync teacher data manually
  const syncTeacher = useCallback(async () => {
    if (!enabled) {
        console.warn('[Sync] Sync triggered but offline support is not enabled.');
        return { status: SyncStatus.IDLE, syncedCount: 0, failedCount: 0, errors: [new Error("Offline support not enabled.")] };
    }
    console.log('[Sync] Manual sync triggered.');
    const syncResult = await syncTeacherData(true); // forceSync = true
    if (syncResult.status === SyncStatus.SUCCESS && syncResult.syncedCount > 0) {
      invalidateSyncedData();
    }
    return syncResult; // Return the sync result
  }, [enabled, invalidateSyncedData]);

  return {
    isOffline,
    syncStatus,
    syncProgress,
    syncTeacher
  };
}
