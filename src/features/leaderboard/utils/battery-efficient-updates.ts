/**
 * Battery-Efficient Update Mechanisms
 * 
 * This module provides utilities for implementing battery-efficient update
 * mechanisms for mobile devices, including intelligent polling, push notifications,
 * and optimized background processing.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNetworkInfo, ConnectionType } from './data-efficient-api';

/**
 * Update strategy
 */
export enum UpdateStrategy {
  REAL_TIME = 'real_time',     // Real-time updates (WebSocket or SSE)
  FREQUENT = 'frequent',       // Frequent polling (every 10-30 seconds)
  NORMAL = 'normal',           // Normal polling (every 1-5 minutes)
  INFREQUENT = 'infrequent',   // Infrequent polling (every 5-15 minutes)
  MANUAL = 'manual',           // Manual updates only
}

/**
 * Update strategy configuration
 */
export interface UpdateStrategyConfig {
  strategy: UpdateStrategy;
  pollingInterval: number;     // Polling interval in milliseconds
  useWebSockets: boolean;      // Whether to use WebSockets for real-time updates
  useSSE: boolean;             // Whether to use Server-Sent Events for real-time updates
  usePushNotifications: boolean; // Whether to use push notifications
  backgroundFetchEnabled: boolean; // Whether to enable background fetch
  adaptivePolling: boolean;    // Whether to adapt polling interval based on user activity
}

/**
 * Default update strategy configurations
 */
export const DEFAULT_UPDATE_STRATEGIES: Record<UpdateStrategy, UpdateStrategyConfig> = {
  [UpdateStrategy.REAL_TIME]: {
    strategy: UpdateStrategy.REAL_TIME,
    pollingInterval: 0,        // No polling, use WebSockets or SSE
    useWebSockets: true,
    useSSE: false,
    usePushNotifications: true,
    backgroundFetchEnabled: false,
    adaptivePolling: false,
  },
  [UpdateStrategy.FREQUENT]: {
    strategy: UpdateStrategy.FREQUENT,
    pollingInterval: 15000,    // 15 seconds
    useWebSockets: false,
    useSSE: false,
    usePushNotifications: true,
    backgroundFetchEnabled: false,
    adaptivePolling: true,
  },
  [UpdateStrategy.NORMAL]: {
    strategy: UpdateStrategy.NORMAL,
    pollingInterval: 180000,   // 3 minutes
    useWebSockets: false,
    useSSE: false,
    usePushNotifications: true,
    backgroundFetchEnabled: true,
    adaptivePolling: true,
  },
  [UpdateStrategy.INFREQUENT]: {
    strategy: UpdateStrategy.INFREQUENT,
    pollingInterval: 600000,   // 10 minutes
    useWebSockets: false,
    useSSE: false,
    usePushNotifications: true,
    backgroundFetchEnabled: true,
    adaptivePolling: true,
  },
  [UpdateStrategy.MANUAL]: {
    strategy: UpdateStrategy.MANUAL,
    pollingInterval: 0,        // No polling
    useWebSockets: false,
    useSSE: false,
    usePushNotifications: true,
    backgroundFetchEnabled: false,
    adaptivePolling: false,
  },
};

/**
 * Get optimal update strategy based on device and network conditions
 * 
 * @param connectionType Network connection type
 * @param batteryLevel Battery level (0-1)
 * @param isCharging Whether the device is charging
 * @param isDataSaverEnabled Whether data saver is enabled
 * @param isBackgroundMode Whether the app is in background mode
 * @returns Optimal update strategy
 */
export function getOptimalUpdateStrategy(
  connectionType: ConnectionType,
  batteryLevel: number,
  isCharging: boolean,
  isDataSaverEnabled: boolean,
  isBackgroundMode: boolean
): UpdateStrategy {
  // In background mode, use infrequent updates or manual updates
  if (isBackgroundMode) {
    return batteryLevel > 0.2 ? UpdateStrategy.INFREQUENT : UpdateStrategy.MANUAL;
  }
  
  // If charging, we can be more aggressive with updates
  if (isCharging) {
    if (connectionType === ConnectionType.WIFI || connectionType === ConnectionType.ETHERNET) {
      return UpdateStrategy.REAL_TIME;
    }
    
    if (connectionType === ConnectionType.CELLULAR_5G || connectionType === ConnectionType.CELLULAR_4G) {
      return isDataSaverEnabled ? UpdateStrategy.NORMAL : UpdateStrategy.FREQUENT;
    }
    
    return UpdateStrategy.NORMAL;
  }
  
  // Not charging, be more conservative
  if (batteryLevel < 0.2) {
    // Low battery, use manual updates
    return UpdateStrategy.MANUAL;
  }
  
  if (batteryLevel < 0.5) {
    // Medium battery, use infrequent updates
    return UpdateStrategy.INFREQUENT;
  }
  
  // Good battery level
  if (connectionType === ConnectionType.WIFI || connectionType === ConnectionType.ETHERNET) {
    return UpdateStrategy.FREQUENT;
  }
  
  if (connectionType === ConnectionType.CELLULAR_5G || connectionType === ConnectionType.CELLULAR_4G) {
    return isDataSaverEnabled ? UpdateStrategy.INFREQUENT : UpdateStrategy.NORMAL;
  }
  
  return UpdateStrategy.INFREQUENT;
}

/**
 * Hook for getting battery information
 * 
 * @returns Battery information
 */
export function useBatteryInfo() {
  const [batteryInfo, setBatteryInfo] = useState({
    level: 1,
    charging: true,
    chargingTime: 0,
    dischargingTime: Infinity,
  });
  
  useEffect(() => {
    // Check if the Battery API is available
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
      return;
    }
    
    let battery: any = null;
    
    // Get battery information
    (navigator as any).getBattery().then((b: any) => {
      battery = b;
      
      // Update battery info
      const updateBatteryInfo = () => {
        setBatteryInfo({
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
        });
      };
      
      // Initial update
      updateBatteryInfo();
      
      // Listen for changes
      battery.addEventListener('levelchange', updateBatteryInfo);
      battery.addEventListener('chargingchange', updateBatteryInfo);
      battery.addEventListener('chargingtimechange', updateBatteryInfo);
      battery.addEventListener('dischargingtimechange', updateBatteryInfo);
      
      // Clean up
      return () => {
        if (battery) {
          battery.removeEventListener('levelchange', updateBatteryInfo);
          battery.removeEventListener('chargingchange', updateBatteryInfo);
          battery.removeEventListener('chargingtimechange', updateBatteryInfo);
          battery.removeEventListener('dischargingtimechange', updateBatteryInfo);
        }
      };
    }).catch(() => {
      // Battery API not available or permission denied
    });
  }, []);
  
  return batteryInfo;
}

/**
 * Hook for implementing battery-efficient updates
 * 
 * @param fetchFunction Function to fetch updates
 * @param initialStrategy Initial update strategy
 * @param options Additional options
 * @returns Update utilities and state
 */
export function useBatteryEfficientUpdates<T>(
  fetchFunction: () => Promise<T>,
  initialStrategy: UpdateStrategy = UpdateStrategy.NORMAL,
  options: {
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    manualStrategyOverride?: boolean;
  } = {}
) {
  const { enabled = true, onSuccess, onError, manualStrategyOverride = false } = options;
  
  // Get network and battery information
  const networkInfo = useNetworkInfo();
  const batteryInfo = useBatteryInfo();
  
  // State for data and loading status
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Determine optimal update strategy
  const [updateStrategy, setUpdateStrategy] = useState<UpdateStrategyConfig>(
    DEFAULT_UPDATE_STRATEGIES[initialStrategy]
  );
  
  // Refs for cleanup
  const timeoutRef = useRef<number | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // Update the strategy based on current conditions
  useEffect(() => {
    if (manualStrategyOverride) {
      return;
    }
    
    const optimalStrategy = getOptimalUpdateStrategy(
      networkInfo.connectionType,
      batteryInfo.level,
      batteryInfo.charging,
      networkInfo.saveData,
      document.visibilityState === 'hidden'
    );
    
    setUpdateStrategy(DEFAULT_UPDATE_STRATEGIES[optimalStrategy]);
  }, [
    networkInfo.connectionType,
    batteryInfo.level,
    batteryInfo.charging,
    networkInfo.saveData,
    manualStrategyOverride
  ]);
  
  // Function to fetch data
  const fetchData = useCallback(async () => {
    if (!enabled) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchFunction();
      setData(result);
      setLastUpdated(new Date());
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, enabled, onSuccess, onError]);
  
  // Set up update mechanism based on strategy
  useEffect(() => {
    if (!enabled) {
      return;
    }
    
    // Clean up existing connections
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Initial fetch
    fetchData();
    
    // Set up update mechanism based on strategy
    if (updateStrategy.strategy === UpdateStrategy.MANUAL) {
      // No automatic updates
      return;
    }
    
    if (updateStrategy.strategy === UpdateStrategy.REAL_TIME) {
      if (updateStrategy.useWebSockets) {
        // WebSocket implementation would go here
        // This is a placeholder for actual WebSocket implementation
      } else if (updateStrategy.useSSE) {
        // Server-Sent Events implementation would go here
        // This is a placeholder for actual SSE implementation
      } else {
        // Fall back to frequent polling
        const poll = () => {
          fetchData();
          timeoutRef.current = window.setTimeout(poll, 5000);
        };
        
        timeoutRef.current = window.setTimeout(poll, 5000);
      }
    } else {
      // Polling strategy
      const poll = () => {
        fetchData();
        timeoutRef.current = window.setTimeout(poll, updateStrategy.pollingInterval);
      };
      
      timeoutRef.current = window.setTimeout(poll, updateStrategy.pollingInterval);
    }
    
    // Clean up
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [fetchData, updateStrategy, enabled]);
  
  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);
  
  // Function to change update strategy
  const setStrategy = useCallback((strategy: UpdateStrategy) => {
    setUpdateStrategy(DEFAULT_UPDATE_STRATEGIES[strategy]);
  }, []);
  
  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh,
    updateStrategy: updateStrategy.strategy,
    setStrategy,
  };
}
