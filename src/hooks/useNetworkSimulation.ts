'use client';

import { useState, useEffect } from 'react';

// Network condition presets
export const NETWORK_CONDITIONS = {
  FAST: { latency: 0, downloadSpeed: Infinity, uploadSpeed: Infinity, name: 'Fast' },
  GOOD: { latency: 100, downloadSpeed: 5 * 1024 * 1024, uploadSpeed: 1 * 1024 * 1024, name: 'Good' },
  AVERAGE: { latency: 200, downloadSpeed: 1 * 1024 * 1024, uploadSpeed: 512 * 1024, name: 'Average' },
  SLOW: { latency: 500, downloadSpeed: 512 * 1024, uploadSpeed: 256 * 1024, name: 'Slow' },
  VERY_SLOW: { latency: 1000, downloadSpeed: 256 * 1024, uploadSpeed: 128 * 1024, name: 'Very Slow' },
  OFFLINE: { latency: Infinity, downloadSpeed: 0, uploadSpeed: 0, name: 'Offline' },
};

// Network condition type
export type NetworkCondition = typeof NETWORK_CONDITIONS[keyof typeof NETWORK_CONDITIONS];

/**
 * Hook for simulating different network conditions for testing
 * 
 * @param options Configuration options
 * @returns Object with simulation controls
 */
export function useNetworkSimulation(options: {
  enabled?: boolean;
  initialCondition?: NetworkCondition;
  affectFetch?: boolean;
  affectXHR?: boolean;
} = {}) {
  const {
    enabled = false,
    initialCondition = NETWORK_CONDITIONS.FAST,
    affectFetch = true,
    affectXHR = true,
  } = options;

  const [isEnabled, setIsEnabled] = useState(enabled);
  const [currentCondition, setCurrentCondition] = useState<NetworkCondition>(initialCondition);
  const [originalFetch, setOriginalFetch] = useState<typeof window.fetch | null>(null);
  const [originalXHR, setOriginalXHR] = useState<typeof window.XMLHttpRequest | null>(null);

  // Enable or disable network simulation
  const setEnabled = (value: boolean) => {
    setIsEnabled(value);
  };

  // Set network condition
  const setCondition = (condition: NetworkCondition) => {
    setCurrentCondition(condition);
  };

  // Apply network simulation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Save original implementations
    if (!originalFetch) setOriginalFetch(window.fetch);
    if (!originalXHR) setOriginalXHR(window.XMLHttpRequest);

    if (isEnabled) {
      // Simulate network conditions for fetch
      if (affectFetch && originalFetch) {
        window.fetch = async (...args) => {
          // Simulate latency
          if (currentCondition.latency > 0 && currentCondition.latency !== Infinity) {
            await new Promise(resolve => setTimeout(resolve, currentCondition.latency));
          }

          // Simulate offline
          if (currentCondition.downloadSpeed === 0) {
            throw new Error('Network error');
          }

          // Perform the actual fetch
          const response = await originalFetch.apply(window, args);

          // Simulate download speed if not infinite
          if (currentCondition.downloadSpeed !== Infinity) {
            const clone = response.clone();
            const blob = await clone.blob();
            const size = blob.size;
            
            // Calculate delay based on size and download speed
            const delay = (size / currentCondition.downloadSpeed) * 1000;
            
            // Wait for the calculated delay
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          return response;
        };
      }

      // Simulate network conditions for XMLHttpRequest
      if (affectXHR && originalXHR) {
        // This is a simplified implementation
        // A full implementation would need to override more methods
        window.XMLHttpRequest = function() {
          const xhr = new originalXHR();
          const originalOpen = xhr.open;
          const originalSend = xhr.send;

          xhr.open = function(...args) {
            originalOpen.apply(xhr, args);
          };

          xhr.send = function(...args) {
            // Simulate latency
            if (currentCondition.latency > 0 && currentCondition.latency !== Infinity) {
              setTimeout(() => {
                originalSend.apply(xhr, args);
              }, currentCondition.latency);
            } else {
              originalSend.apply(xhr, args);
            }
          };

          return xhr;
        } as any;
      }
    } else {
      // Restore original implementations
      if (originalFetch) window.fetch = originalFetch;
      if (originalXHR) window.XMLHttpRequest = originalXHR;
    }

    // Cleanup
    return () => {
      if (originalFetch) window.fetch = originalFetch;
      if (originalXHR) window.XMLHttpRequest = originalXHR;
    };
  }, [isEnabled, currentCondition, affectFetch, affectXHR, originalFetch, originalXHR]);

  return {
    isEnabled,
    currentCondition,
    setEnabled,
    setCondition,
    conditions: NETWORK_CONDITIONS,
  };
}
