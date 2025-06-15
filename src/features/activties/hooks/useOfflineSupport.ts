'use client';

import { useState, useEffect, useCallback } from 'react';
import { isOnline, syncActivityResults, SyncStatus, addSyncListener, removeSyncListener, registerConnectivityListeners } from '../persistence/syncManager';
import { DEFAULT_OFFLINE_CONFIG, OfflineConfig } from '../persistence/types';
import { saveActivityState, getActivityState } from '../persistence/indexedDB';

interface UseOfflineSupportProps {
  activityId: string;
  userId: string;
  enabled?: boolean;
  config?: Partial<OfflineConfig>;
  onStatusChange?: (isOffline: boolean) => void;
  onSyncStatusChange?: (status: SyncStatus, progress?: number) => void;
}

interface UseOfflineSupportResult {
  isOffline: boolean;
  syncStatus: SyncStatus;
  syncProgress: number | undefined;
  syncResults: () => Promise<void>;
  saveState: <T>(state: T) => Promise<boolean>;
  loadState: <T>() => Promise<T | null>;
}

/**
 * Hook for offline support in activities
 */
export function useOfflineSupport({
  activityId,
  userId,
  enabled = true,
  config = {},
  onStatusChange,
  onSyncStatusChange,
}: UseOfflineSupportProps): UseOfflineSupportResult {
  // Merge config with defaults
  const offlineConfig: OfflineConfig = {
    ...DEFAULT_OFFLINE_CONFIG,
    ...config,
  };

  // State
  const [isOfflineState, setIsOffline] = useState(!isOnline());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.IDLE);
  const [syncProgress, setSyncProgress] = useState<number | undefined>(undefined);

  // Generate state key
  const stateKey = `${activityId}_${userId}`;

  // Handle online/offline status changes
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      setIsOffline(false);
      onStatusChange?.(false);
      
      // Auto-sync if enabled
      if (offlineConfig.autoSync) {
        syncActivityResults();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      onStatusChange?.(true);
    };

    // Initial status
    setIsOffline(!isOnline());

    // Register listeners
    return registerConnectivityListeners(handleOnline, handleOffline);
  }, [enabled, offlineConfig.autoSync, onStatusChange]);

  // Handle sync status changes
  useEffect(() => {
    if (!enabled) return;

    const handleSyncStatusChange = (status: SyncStatus, progress?: number) => {
      setSyncStatus(status);
      setSyncProgress(progress);
      onSyncStatusChange?.(status, progress);
    };

    // Register listener
    addSyncListener(handleSyncStatusChange);

    return () => {
      removeSyncListener(handleSyncStatusChange);
    };
  }, [enabled, onSyncStatusChange]);

  // Sync results
  const syncResults = useCallback(async () => {
    if (!enabled) return;
    await syncActivityResults(true);
  }, [enabled]);

  // Save state to IndexedDB
  const saveState = useCallback(async <T>(state: T): Promise<boolean> => {
    if (!enabled || !offlineConfig.persistenceEnabled) return false;
    
    try {
      await saveActivityState(stateKey, state);
      return true;
    } catch (error) {
      console.error('Failed to save activity state:', error);
      return false;
    }
  }, [enabled, offlineConfig.persistenceEnabled, stateKey]);

  // Load state from IndexedDB
  const loadState = useCallback(async <T>(): Promise<T | null> => {
    if (!enabled || !offlineConfig.persistenceEnabled) return null;
    
    try {
      return await getActivityState(stateKey) as T | null;
    } catch (error) {
      console.error('Failed to load activity state:', error);
      return null;
    }
  }, [enabled, offlineConfig.persistenceEnabled, stateKey]);

  return {
    isOffline: isOfflineState,
    syncStatus,
    syncProgress,
    syncResults,
    saveState,
    loadState,
  };
}
