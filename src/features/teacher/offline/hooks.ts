'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { isOnline, syncTeacherData, SyncStatus, addSyncListener, removeSyncListener } from './sync';
import { trackOfflineModeEnter, trackOfflineModeExit } from './analytics';

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
}

interface UseOfflineSupportResult {
  isOffline: boolean;
  syncStatus: SyncStatus;
  syncProgress: number | undefined;
  syncTeacher: () => Promise<void>;
}

/**
 * Hook for offline support in teacher portal
 */
export function useOfflineSupport({
  teacherId,
  enabled = true,
  config = {},
  onStatusChange,
  onSyncStatusChange
}: UseOfflineSupportProps): UseOfflineSupportResult {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.IDLE);
  const [syncProgress, setSyncProgress] = useState<number | undefined>(undefined);

  // Merge config with defaults
  const mergedConfig: OfflineConfig = {
    ...DEFAULT_OFFLINE_CONFIG,
    ...config
  };

  // Track when offline mode started
  const offlineStartTimeRef = useRef<number | null>(null);

  // Handle online/offline status changes
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      setIsOffline(false);

      // Calculate offline duration
      if (offlineStartTimeRef.current) {
        const offlineDuration = Date.now() - offlineStartTimeRef.current;
        trackOfflineModeExit(teacherId, 'teacher', offlineDuration);
        offlineStartTimeRef.current = null;
      }

      // Notify status change
      if (onStatusChange) {
        onStatusChange(false);
      }

      // Auto sync if enabled
      if (mergedConfig.autoSync) {
        syncTeacherData();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);

      // Track offline mode enter
      trackOfflineModeEnter(teacherId, 'teacher');
      offlineStartTimeRef.current = Date.now();

      // Notify status change
      if (onStatusChange) {
        onStatusChange(true);
      }
    };

    // Set initial state
    setIsOffline(!isOnline());
    if (!isOnline() && !offlineStartTimeRef.current) {
      trackOfflineModeEnter(teacherId, 'teacher');
      offlineStartTimeRef.current = Date.now();
    }

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      // Track offline exit if still offline
      if (offlineStartTimeRef.current) {
        const offlineDuration = Date.now() - offlineStartTimeRef.current;
        trackOfflineModeExit(teacherId, 'teacher', offlineDuration);
      }
    };
  }, [enabled, teacherId, mergedConfig.autoSync, onStatusChange]);

  // Listen for sync status changes
  useEffect(() => {
    if (!enabled) return;

    const handleSyncStatusChange = (status: SyncStatus, progress?: number) => {
      setSyncStatus(status);
      setSyncProgress(progress);

      // Notify sync status change
      if (onSyncStatusChange) {
        onSyncStatusChange(status, progress);
      }
    };

    // Add sync listener
    addSyncListener(handleSyncStatusChange);

    return () => {
      // Remove sync listener
      removeSyncListener(handleSyncStatusChange);
    };
  }, [enabled, onSyncStatusChange]);

  // Sync teacher data
  const syncTeacher = useCallback(async () => {
    if (!enabled) return;

    try {
      await syncTeacherData(true);
    } catch (error) {
      console.error('Failed to sync teacher data:', error);
    }
  }, [enabled]);

  return {
    isOffline,
    syncStatus,
    syncProgress,
    syncTeacher
  };
}
