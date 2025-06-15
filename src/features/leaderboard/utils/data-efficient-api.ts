/**
 * Data-Efficient API Utilities
 * 
 * This module provides utilities for implementing data-efficient API calls
 * for mobile networks, including compression, batching, and delta updates.
 */

import { useEffect, useState, useCallback } from 'react';

/**
 * Network connection type
 */
export enum ConnectionType {
  UNKNOWN = 'unknown',
  ETHERNET = 'ethernet',
  WIFI = 'wifi',
  CELLULAR_5G = '5g',
  CELLULAR_4G = '4g',
  CELLULAR_3G = '3g',
  CELLULAR_2G = '2g',
  SLOW_2G = 'slow-2g',
  OFFLINE = 'offline',
}

/**
 * Network information
 */
export interface NetworkInfo {
  connectionType: ConnectionType;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

/**
 * Get current network information
 * 
 * @returns Network information
 */
export function getNetworkInfo(): NetworkInfo {
  // Default values
  const defaultInfo: NetworkInfo = {
    connectionType: ConnectionType.UNKNOWN,
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
  };
  
  // Check if the Network Information API is available
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return defaultInfo;
  }
  
  const connection = (navigator as any).connection;
  
  if (!connection) {
    return defaultInfo;
  }
  
  // Map connection type
  let connectionType = ConnectionType.UNKNOWN;
  
  switch (connection.type) {
    case 'ethernet':
      connectionType = ConnectionType.ETHERNET;
      break;
    case 'wifi':
      connectionType = ConnectionType.WIFI;
      break;
    case 'cellular':
      // Map effective type for cellular connections
      switch (connection.effectiveType) {
        case '5g':
          connectionType = ConnectionType.CELLULAR_5G;
          break;
        case '4g':
          connectionType = ConnectionType.CELLULAR_4G;
          break;
        case '3g':
          connectionType = ConnectionType.CELLULAR_3G;
          break;
        case '2g':
          connectionType = ConnectionType.CELLULAR_2G;
          break;
        case 'slow-2g':
          connectionType = ConnectionType.SLOW_2G;
          break;
        default:
          connectionType = ConnectionType.CELLULAR_4G;
          break;
      }
      break;
    case 'none':
      connectionType = ConnectionType.OFFLINE;
      break;
  }
  
  return {
    connectionType,
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: connection.saveData || false,
  };
}

/**
 * Hook for monitoring network information
 * 
 * @returns Current network information
 */
export function useNetworkInfo(): NetworkInfo {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(getNetworkInfo());
  
  useEffect(() => {
    // Update network info initially
    setNetworkInfo(getNetworkInfo());
    
    // Check if the Network Information API is available
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return;
    }
    
    const connection = (navigator as any).connection;
    
    if (!connection) {
      return;
    }
    
    // Listen for changes
    const handleChange = () => {
      setNetworkInfo(getNetworkInfo());
    };
    
    connection.addEventListener('change', handleChange);
    
    // Clean up
    return () => {
      connection.removeEventListener('change', handleChange);
    };
  }, []);
  
  return networkInfo;
}

/**
 * API optimization options based on network conditions
 */
export interface ApiOptimizationOptions {
  // Whether to enable data compression
  enableCompression: boolean;
  // Whether to enable request batching
  enableBatching: boolean;
  // Whether to enable delta updates
  enableDeltaUpdates: boolean;
  // Maximum batch size (in number of requests)
  maxBatchSize: number;
  // Batch delay (in milliseconds)
  batchDelay: number;
  // Whether to prioritize critical requests
  prioritizeCriticalRequests: boolean;
  // Whether to use low-resolution images
  useLowResImages: boolean;
  // Whether to reduce payload size
  reducePayloadSize: boolean;
}

/**
 * Get API optimization options based on network conditions
 * 
 * @param networkInfo Network information
 * @returns API optimization options
 */
export function getApiOptimizationOptions(networkInfo: NetworkInfo): ApiOptimizationOptions {
  // Default options for unknown connection
  const defaultOptions: ApiOptimizationOptions = {
    enableCompression: true,
    enableBatching: true,
    enableDeltaUpdates: true,
    maxBatchSize: 10,
    batchDelay: 100,
    prioritizeCriticalRequests: true,
    useLowResImages: false,
    reducePayloadSize: true,
  };
  
  // Adjust options based on connection type
  switch (networkInfo.connectionType) {
    case ConnectionType.ETHERNET:
    case ConnectionType.WIFI:
      // High-bandwidth, low-latency connection
      return {
        ...defaultOptions,
        enableCompression: false,
        enableBatching: false,
        useLowResImages: false,
        reducePayloadSize: false,
      };
    
    case ConnectionType.CELLULAR_5G:
      // High-bandwidth, medium-latency connection
      return {
        ...defaultOptions,
        enableCompression: true,
        enableBatching: false,
        useLowResImages: false,
        reducePayloadSize: false,
      };
    
    case ConnectionType.CELLULAR_4G:
      // Medium-bandwidth, medium-latency connection
      return {
        ...defaultOptions,
        enableCompression: true,
        enableBatching: true,
        useLowResImages: false,
        reducePayloadSize: true,
      };
    
    case ConnectionType.CELLULAR_3G:
    case ConnectionType.CELLULAR_2G:
      // Low-bandwidth, high-latency connection
      return {
        ...defaultOptions,
        enableCompression: true,
        enableBatching: true,
        maxBatchSize: 5,
        batchDelay: 200,
        useLowResImages: true,
        reducePayloadSize: true,
      };
    
    case ConnectionType.SLOW_2G:
      // Very low-bandwidth, very high-latency connection
      return {
        ...defaultOptions,
        enableCompression: true,
        enableBatching: true,
        maxBatchSize: 3,
        batchDelay: 500,
        useLowResImages: true,
        reducePayloadSize: true,
      };
    
    case ConnectionType.OFFLINE:
      // Offline connection
      return {
        ...defaultOptions,
        enableCompression: false,
        enableBatching: false,
        enableDeltaUpdates: false,
        useLowResImages: true,
        reducePayloadSize: true,
      };
    
    default:
      return defaultOptions;
  }
}

/**
 * Hook for implementing data-efficient API calls
 * 
 * @returns API optimization options and utilities
 */
export function useDataEfficientApi() {
  const networkInfo = useNetworkInfo();
  const [optimizationOptions, setOptimizationOptions] = useState<ApiOptimizationOptions>(
    getApiOptimizationOptions(networkInfo)
  );
  
  // Update optimization options when network info changes
  useEffect(() => {
    setOptimizationOptions(getApiOptimizationOptions(networkInfo));
  }, [networkInfo]);
  
  // Get optimized query parameters
  const getOptimizedQueryParams = useCallback((baseParams: Record<string, any>) => {
    const params = { ...baseParams };
    
    // Apply optimizations based on options
    if (optimizationOptions.reducePayloadSize) {
      // Add fields parameter to limit returned fields
      params.fields = params.fields || 'minimal';
    }
    
    if (optimizationOptions.useLowResImages) {
      // Add image quality parameter
      params.imageQuality = 'low';
    }
    
    // Add compression parameter
    if (optimizationOptions.enableCompression) {
      params.compress = true;
    }
    
    return params;
  }, [optimizationOptions]);
  
  return {
    networkInfo,
    optimizationOptions,
    getOptimizedQueryParams,
  };
}
