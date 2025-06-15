'use client';

import { useEffect, useRef, useCallback } from 'react';
import { isOnline } from '../persistence/syncManager';
import {
  trackOfflineModeEnter,
  trackOfflineModeExit
} from '../analytics/offline-analytics';

interface UseOfflineAnalyticsProps {
  activityId: string;
  activityType: string;
  enabled?: boolean;
}

interface UseOfflineAnalyticsResult {
  isOffline: boolean;
  offlineDuration: number;
  trackOfflineEnter: () => void;
  trackOfflineExit: () => void;
}

/**
 * Hook for tracking offline analytics
 */
export function useOfflineAnalytics({
  activityId,
  activityType,
  enabled = true
}: UseOfflineAnalyticsProps): UseOfflineAnalyticsResult {
  // State
  const [isOfflineState, setIsOffline] = useState(!isOnline());
  
  // Refs for tracking offline duration
  const offlineStartTimeRef = useRef<number | null>(null);
  const offlineDurationRef = useRef<number>(0);
  
  // Track when user goes offline
  const trackOfflineEnter = useCallback(() => {
    if (!enabled) return;
    
    offlineStartTimeRef.current = Date.now();
    trackOfflineModeEnter(activityId, activityType);
  }, [enabled, activityId, activityType]);
  
  // Track when user comes back online
  const trackOfflineExit = useCallback(() => {
    if (!enabled || offlineStartTimeRef.current === null) return;
    
    const duration = Date.now() - offlineStartTimeRef.current;
    offlineDurationRef.current += duration;
    trackOfflineModeExit(activityId, activityType, duration);
    offlineStartTimeRef.current = null;
  }, [enabled, activityId, activityType]);
  
  // Set up online/offline listeners
  useEffect(() => {
    if (!enabled) return;
    
    const handleOnline = () => {
      setIsOffline(false);
      trackOfflineExit();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      trackOfflineEnter();
    };
    
    // Initial state
    const initialOffline = !isOnline();
    setIsOffline(initialOffline);
    
    if (initialOffline) {
      trackOfflineEnter();
    }
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // If still offline when unmounting, track the exit
      if (offlineStartTimeRef.current !== null) {
        trackOfflineExit();
      }
    };
  }, [enabled, trackOfflineEnter, trackOfflineExit]);
  
  return {
    isOffline: isOfflineState,
    offlineDuration: offlineDurationRef.current,
    trackOfflineEnter,
    trackOfflineExit
  };
}

// Import useState at the top
import { useState } from 'react';
