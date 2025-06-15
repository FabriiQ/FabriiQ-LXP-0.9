/**
 * useLeaderboardSync Hook
 * 
 * This hook provides access to leaderboard synchronization features,
 * including conflict resolution and background sync.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  LeaderboardEntityType, 
  TimeGranularity, 
  StandardLeaderboardResponse 
} from '../types/standard-leaderboard';
import { 
  leaderboardSyncManager, 
  SyncEventType, 
  SyncEvent,
  cacheLeaderboardData,
  getCachedLeaderboardData,
  applyOptimisticUpdate
} from '../utils/offline-sync';

interface UseLeaderboardSyncOptions {
  entityType: LeaderboardEntityType | string;
  entityId: string;
  timeGranularity: TimeGranularity;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
  onConflict?: (localData: any, serverData: any) => void;
}

/**
 * Hook for managing leaderboard synchronization
 */
export function useLeaderboardSync({
  entityType,
  entityId,
  timeGranularity,
  onSyncComplete,
  onSyncError,
  onConflict
}: UseLeaderboardSyncOptions) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | undefined>(undefined);
  const [syncError, setSyncError] = useState<Error | undefined>(undefined);
  const [hasConflict, setHasConflict] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  
  // Update sync status
  const updateSyncStatus = useCallback(() => {
    const status = leaderboardSyncManager.getSyncStatus();
    setIsSyncing(status.isSyncing);
    setQueueLength(status.queueLength);
    if (status.lastSyncAttempt) {
      setLastSyncTime(status.lastSyncAttempt);
    }
  }, []);
  
  // Handle sync events
  const handleSyncEvent = useCallback((event: SyncEvent) => {
    switch (event.type) {
      case SyncEventType.SYNC_STARTED:
        setIsSyncing(true);
        setSyncError(undefined);
        break;
        
      case SyncEventType.SYNC_COMPLETED:
        setIsSyncing(false);
        setLastSyncTime(event.timestamp);
        updateSyncStatus();
        onSyncComplete?.();
        break;
        
      case SyncEventType.SYNC_FAILED:
        setIsSyncing(false);
        if (event.error) {
          setSyncError(event.error);
          onSyncError?.(event.error);
        }
        updateSyncStatus();
        break;
        
      case SyncEventType.CONFLICT_DETECTED:
        setHasConflict(true);
        if (event.conflictDetails && onConflict) {
          onConflict(event.conflictDetails.localData, event.conflictDetails.serverData);
        }
        break;
        
      case SyncEventType.CONFLICT_RESOLVED:
        setHasConflict(false);
        updateSyncStatus();
        break;
    }
  }, [onSyncComplete, onSyncError, onConflict, updateSyncStatus]);
  
  // Set up event listener
  useEffect(() => {
    leaderboardSyncManager.addEventListener(handleSyncEvent);
    updateSyncStatus();
    
    return () => {
      leaderboardSyncManager.removeEventListener(handleSyncEvent);
    };
  }, [handleSyncEvent, updateSyncStatus]);
  
  // Cache leaderboard data
  const cacheData = useCallback(async (data: StandardLeaderboardResponse) => {
    await cacheLeaderboardData(entityType, entityId, timeGranularity, data);
  }, [entityType, entityId, timeGranularity]);
  
  // Get cached data
  const getCachedData = useCallback(async (maxAge?: number) => {
    return getCachedLeaderboardData(entityType, entityId, timeGranularity, maxAge);
  }, [entityType, entityId, timeGranularity]);
  
  // Apply optimistic update
  const applyUpdate = useCallback(async (
    updateFn: (data: StandardLeaderboardResponse) => StandardLeaderboardResponse
  ) => {
    await applyOptimisticUpdate(entityType, entityId, timeGranularity, updateFn);
  }, [entityType, entityId, timeGranularity]);
  
  // Trigger manual sync
  const sync = useCallback(() => {
    leaderboardSyncManager.syncAll();
  }, []);
  
  // Resolve conflict
  const resolveConflict = useCallback((
    resolution: 'local' | 'server' | 'merged',
    mergedData?: any
  ) => {
    leaderboardSyncManager.resolveConflict(
      entityType,
      entityId,
      timeGranularity,
      resolution,
      mergedData
    );
  }, [entityType, entityId, timeGranularity]);
  
  return {
    isSyncing,
    lastSyncTime,
    syncError,
    hasConflict,
    queueLength,
    cacheData,
    getCachedData,
    applyUpdate,
    sync,
    resolveConflict
  };
}
