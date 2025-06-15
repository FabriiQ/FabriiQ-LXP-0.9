'use client';

import { useState, useEffect, useCallback } from 'react';
import * as rewardsDb from '../rewards-db';
import { isOnline } from '@/utils/offline-storage';

interface UseRewardsOfflineOptions {
  enabled?: boolean;
  autoSync?: boolean;
  onStatusChange?: (isOffline: boolean) => void;
}

interface UseRewardsOfflineReturn {
  isOffline: boolean;
  isSyncing: boolean;
  syncProgress: number;
  getClassRewards: (classId: string) => Promise<any | null>;
  saveClassRewards: (classId: string, data: any) => Promise<void>;
  getLeaderboard: (classId: string, period: string) => Promise<any | null>;
  saveLeaderboard: (classId: string, period: string, data: any) => Promise<void>;
  getStudentPoints: (id: string) => Promise<any | null>;
  saveStudentPoints: (id: string, classId: string, studentId: string, data: any) => Promise<void>;
  getAllStudentPointsByClass: (classId: string) => Promise<any[]>;
  getPointsHistory: (studentId: string, classId: string) => Promise<any | null>;
  savePointsHistory: (id: string, studentId: string, classId: string, data: any) => Promise<void>;
  sync: () => Promise<void>;
}

/**
 * Hook for managing offline rewards data
 */
export function useRewardsOffline(options: UseRewardsOfflineOptions = {}): UseRewardsOfflineReturn {
  const { enabled = true, autoSync = true, onStatusChange } = options;
  
  const [isOfflineState, setIsOfflineState] = useState(!isOnline());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  
  // Initialize database
  useEffect(() => {
    if (enabled) {
      rewardsDb.initDB().catch(console.error);
    }
  }, [enabled]);
  
  // Monitor online/offline status
  useEffect(() => {
    if (!enabled) return;
    
    const handleOnline = () => {
      setIsOfflineState(false);
      if (onStatusChange) onStatusChange(false);
      
      // Auto sync when coming back online
      if (autoSync) {
        sync().catch(console.error);
      }
    };
    
    const handleOffline = () => {
      setIsOfflineState(true);
      if (onStatusChange) onStatusChange(true);
    };
    
    // Set initial state
    setIsOfflineState(!isOnline());
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, autoSync, onStatusChange]);
  
  // Sync function
  const sync = useCallback(async () => {
    if (!enabled || isSyncing || !isOnline()) return;
    
    setIsSyncing(true);
    setSyncProgress(0);
    
    try {
      // Get pending operations
      const pendingOps = await rewardsDb.getPendingSyncOperations();
      
      if (pendingOps.length === 0) {
        setIsSyncing(false);
        setSyncProgress(100);
        return;
      }
      
      // Process each operation
      let processed = 0;
      
      for (const op of pendingOps) {
        try {
          // TODO: Implement actual sync logic with API calls
          // For now, just remove the operation from the queue
          await rewardsDb.removeSyncOperation(op.id);
          
          processed++;
          setSyncProgress(Math.round((processed / pendingOps.length) * 100));
        } catch (error) {
          console.error('Error syncing operation:', error);
          await rewardsDb.updateSyncOperationAttempts(op.id, op.attempts + 1);
        }
      }
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      setIsSyncing(false);
      setSyncProgress(100);
    }
  }, [enabled, isSyncing]);
  
  // Wrapper functions for database operations
  const getClassRewards = useCallback(async (classId: string) => {
    if (!enabled) return null;
    return rewardsDb.getClassRewards(classId);
  }, [enabled]);
  
  const saveClassRewards = useCallback(async (classId: string, data: any) => {
    if (!enabled) return;
    
    await rewardsDb.saveClassRewards(classId, data);
    
    // Add to sync queue if offline
    if (!isOnline()) {
      await rewardsDb.addToSyncQueue('update', 'classRewards', { classId, data });
    }
  }, [enabled]);
  
  const getLeaderboard = useCallback(async (classId: string, period: string) => {
    if (!enabled) return null;
    return rewardsDb.getLeaderboard(classId, period);
  }, [enabled]);
  
  const saveLeaderboard = useCallback(async (classId: string, period: string, data: any) => {
    if (!enabled) return;
    
    await rewardsDb.saveLeaderboard(classId, period, data);
    
    // Add to sync queue if offline
    if (!isOnline()) {
      await rewardsDb.addToSyncQueue('update', 'leaderboard', { classId, period, data });
    }
  }, [enabled]);
  
  const getStudentPoints = useCallback(async (id: string) => {
    if (!enabled) return null;
    return rewardsDb.getStudentPoints(id);
  }, [enabled]);
  
  const saveStudentPoints = useCallback(async (id: string, classId: string, studentId: string, data: any) => {
    if (!enabled) return;
    
    await rewardsDb.saveStudentPoints(id, classId, studentId, data);
    
    // Add to sync queue if offline
    if (!isOnline()) {
      await rewardsDb.addToSyncQueue('update', 'studentPoints', { id, classId, studentId, data });
    }
  }, [enabled]);
  
  const getAllStudentPointsByClass = useCallback(async (classId: string) => {
    if (!enabled) return [];
    return rewardsDb.getAllStudentPointsByClass(classId);
  }, [enabled]);
  
  const getPointsHistory = useCallback(async (studentId: string, classId: string) => {
    if (!enabled) return null;
    return rewardsDb.getPointsHistory(studentId, classId);
  }, [enabled]);
  
  const savePointsHistory = useCallback(async (id: string, studentId: string, classId: string, data: any) => {
    if (!enabled) return;
    
    await rewardsDb.savePointsHistory(id, studentId, classId, data);
    
    // Add to sync queue if offline
    if (!isOnline()) {
      await rewardsDb.addToSyncQueue('update', 'pointsHistory', { id, studentId, classId, data });
    }
  }, [enabled]);
  
  return {
    isOffline: isOfflineState,
    isSyncing,
    syncProgress,
    getClassRewards,
    saveClassRewards,
    getLeaderboard,
    saveLeaderboard,
    getStudentPoints,
    saveStudentPoints,
    getAllStudentPointsByClass,
    getPointsHistory,
    savePointsHistory,
    sync
  };
}
