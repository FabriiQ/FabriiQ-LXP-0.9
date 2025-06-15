/**
 * Progressive Loading Utilities
 *
 * This module provides utilities for implementing progressive loading patterns
 * to improve initial page load performance.
 */

import { useEffect, useState } from 'react';

/**
 * Priority levels for content loading
 */
export enum LoadPriority {
  CRITICAL = 0,   // Load immediately (e.g., main content)
  HIGH = 1,       // Load soon after critical content (e.g., user-specific data)
  MEDIUM = 2,     // Load after high priority content (e.g., secondary UI elements)
  LOW = 3,        // Load after medium priority content (e.g., non-essential features)
  IDLE = 4        // Load only during idle time (e.g., analytics, prefetching)
}

/**
 * Configuration for progressive loading
 */
export interface ProgressiveLoadingConfig {
  // Delay in milliseconds before loading content at each priority level
  delays: {
    [LoadPriority.CRITICAL]: number;
    [LoadPriority.HIGH]: number;
    [LoadPriority.MEDIUM]: number;
    [LoadPriority.LOW]: number;
    [LoadPriority.IDLE]: number;
  };
  // Whether to use requestIdleCallback for IDLE priority
  useIdleCallback: boolean;
}

/**
 * Default configuration for progressive loading
 */
export const DEFAULT_LOADING_CONFIG: ProgressiveLoadingConfig = {
  delays: {
    [LoadPriority.CRITICAL]: 0,      // Load immediately
    [LoadPriority.HIGH]: 100,        // Load after 100ms
    [LoadPriority.MEDIUM]: 500,      // Load after 500ms
    [LoadPriority.LOW]: 1000,        // Load after 1s
    [LoadPriority.IDLE]: 2000,       // Load after 2s if requestIdleCallback not available
  },
  useIdleCallback: true,
};

/**
 * Hook for implementing progressive loading based on priority
 *
 * @param priority The loading priority
 * @param config Configuration options
 * @returns Whether the content should be loaded
 */
export function useProgressiveLoading(
  priority: LoadPriority,
  config: Partial<ProgressiveLoadingConfig> = {}
): boolean {
  const [shouldLoad, setShouldLoad] = useState(priority === LoadPriority.CRITICAL);

  // Merge with default config
  const mergedConfig: ProgressiveLoadingConfig = {
    ...DEFAULT_LOADING_CONFIG,
    ...config,
    delays: {
      ...DEFAULT_LOADING_CONFIG.delays,
      ...(config.delays || {}),
    },
  };

  useEffect(() => {
    if (shouldLoad) return;

    let timeoutId: number | null = null;

    // For IDLE priority, use requestIdleCallback if available and enabled
    if (priority === LoadPriority.IDLE && mergedConfig.useIdleCallback && typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleCallbackId = requestIdleCallback(() => {
        setShouldLoad(true);
      }, { timeout: 5000 }); // 5s timeout as a fallback

      return () => {
        if (idleCallbackId) {
          cancelIdleCallback(idleCallbackId);
        }
      };
    }

    // For other priorities or if requestIdleCallback is not available, use setTimeout
    timeoutId = window.setTimeout(() => {
      setShouldLoad(true);
    }, mergedConfig.delays[priority]);

    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [priority, shouldLoad, mergedConfig]);

  return shouldLoad;
}

/**
 * Component wrapper for progressive loading
 */
export interface ProgressiveLoadingProps {
  priority: LoadPriority;
  placeholder?: React.ReactNode;
  children: React.ReactNode;
  config?: Partial<ProgressiveLoadingConfig>;
}

/**
 * ProgressiveLoading component that renders content based on priority
 *
 * Note: This component is meant to be used with JSX, but since this file
 * is a .ts file and not .tsx, we're returning any to avoid type errors.
 * In practice, this will be used in a React component context.
 */
export function ProgressiveLoading({
  priority,
  placeholder,
  children,
  config,
}: ProgressiveLoadingProps): any {
  const shouldLoad = useProgressiveLoading(priority, config);

  // In a real JSX context, this would be:
  // return shouldLoad ? <>{children}</> : <>{placeholder || null}</>;
  return shouldLoad ? children : (placeholder || null);
}

/**
 * Utility to batch DOM updates for better performance
 *
 * @param callback Function to execute in the next animation frame
 * @returns Function to cancel the scheduled callback
 */
export function scheduleDOMUpdate(callback: () => void): () => void {
  let rafId: number | null = null;

  // Schedule the update for the next animation frame
  rafId = requestAnimationFrame(() => {
    callback();
    rafId = null;
  });

  // Return a function to cancel the scheduled update
  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}

/**
 * Utility to batch multiple DOM updates together
 */
export class DOMUpdateBatcher {
  private updates: Map<string, () => void> = new Map();
  private rafId: number | null = null;

  /**
   * Add an update to the batch
   *
   * @param key Unique identifier for the update
   * @param update Function to execute
   */
  public addUpdate(key: string, update: () => void): void {
    this.updates.set(key, update);
    this.scheduleFlush();
  }

  /**
   * Remove an update from the batch
   *
   * @param key Unique identifier for the update
   */
  public removeUpdate(key: string): void {
    this.updates.delete(key);
  }

  /**
   * Schedule a flush of all updates
   */
  private scheduleFlush(): void {
    if (this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      this.flush();
      this.rafId = null;
    });
  }

  /**
   * Execute all updates in the batch
   */
  private flush(): void {
    // Execute all updates
    for (const update of this.updates.values()) {
      update();
    }

    // Clear the batch
    this.updates.clear();
  }

  /**
   * Cancel all scheduled updates
   */
  public cancel(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.updates.clear();
  }
}

// Create a singleton instance for global use
export const globalDOMUpdateBatcher = new DOMUpdateBatcher();
