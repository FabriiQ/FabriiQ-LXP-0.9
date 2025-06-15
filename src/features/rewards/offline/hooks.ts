'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { isOnline, syncRewardsData, SyncStatus, addSyncListener, removeSyncListener } from './sync';
import { trackOfflineModeEnter, trackOfflineModeExit } from '../analytics/offline-analytics';

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
  studentId: string;
  enabled?: boolean;
  config?: Partial<OfflineConfig>;
  onStatusChange?: (isOffline: boolean) => void;
  onSyncStatusChange?: (status: SyncStatus, progress?: number) => void;
}

interface UseOfflineSupportResult {
  isOffline: boolean;
  syncStatus: SyncStatus;
  syncProgress: number | undefined;
  syncRewards: () => Promise<void>;
}

/**
 * Hook for offline support in rewards
 */
export function useOfflineSupport({
  studentId,
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
        trackOfflineModeExit(studentId, 'rewards', offlineDuration);
        offlineStartTimeRef.current = null;
      }

      // Notify status change
      if (onStatusChange) {
        onStatusChange(false);
      }

      // Auto sync if enabled
      if (mergedConfig.autoSync) {
        syncRewardsData();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);

      // Track offline mode enter
      trackOfflineModeEnter(studentId, 'rewards');
      offlineStartTimeRef.current = Date.now();

      // Notify status change
      if (onStatusChange) {
        onStatusChange(true);
      }
    };

    // Set initial state
    setIsOffline(!isOnline());
    if (!isOnline() && !offlineStartTimeRef.current) {
      trackOfflineModeEnter(studentId, 'rewards');
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
        trackOfflineModeExit(studentId, 'rewards', offlineDuration);
      }
    };
  }, [enabled, studentId, mergedConfig.autoSync, onStatusChange]);

  // Handle sync status changes
  useEffect(() => {
    if (!enabled) return;

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
  }, [enabled, onSyncStatusChange]);

  // Sync rewards function
  const syncRewards = useCallback(async () => {
    if (!enabled || !isOnline()) return;

    await syncRewardsData(true);
  }, [enabled]);

  return {
    isOffline,
    syncStatus,
    syncProgress,
    syncRewards
  };
}

interface UseOfflineAnalyticsProps {
  studentId: string;
  enabled?: boolean;
}

interface UseOfflineAnalyticsResult {
  isOffline: boolean;
  offlineDuration: number;
}

/**
 * Hook for tracking offline analytics in rewards
 */
export function useOfflineAnalytics({
  studentId,
  enabled = true
}: UseOfflineAnalyticsProps): UseOfflineAnalyticsResult {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [offlineDuration, setOfflineDuration] = useState(0);

  // Track when offline mode started
  const offlineStartTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle online/offline status changes
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      setIsOffline(false);

      // Calculate offline duration
      if (offlineStartTimeRef.current) {
        const duration = Date.now() - offlineStartTimeRef.current;
        setOfflineDuration(duration);
        trackOfflineModeExit(studentId, 'rewards', duration);
        offlineStartTimeRef.current = null;
      }

      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleOffline = () => {
      setIsOffline(true);

      // Track offline mode enter
      trackOfflineModeEnter(studentId, 'rewards');
      offlineStartTimeRef.current = Date.now();

      // Start interval to update duration
      intervalRef.current = setInterval(() => {
        if (offlineStartTimeRef.current) {
          setOfflineDuration(Date.now() - offlineStartTimeRef.current);
        }
      }, 1000);
    };

    // Set initial state
    setIsOffline(!isOnline());
    if (!isOnline() && !offlineStartTimeRef.current) {
      trackOfflineModeEnter(studentId, 'rewards');
      offlineStartTimeRef.current = Date.now();

      // Start interval to update duration
      intervalRef.current = setInterval(() => {
        if (offlineStartTimeRef.current) {
          setOfflineDuration(Date.now() - offlineStartTimeRef.current);
        }
      }, 1000);
    }

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      // Track offline exit if still offline
      if (offlineStartTimeRef.current) {
        const duration = Date.now() - offlineStartTimeRef.current;
        trackOfflineModeExit(studentId, 'rewards', duration);
      }

      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, studentId]);

  return {
    isOffline,
    offlineDuration
  };
}
