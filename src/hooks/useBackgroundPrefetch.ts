'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/utils/api';

/**
 * Hook for prefetching data in the background based on likely next actions
 *
 * @param options Configuration options
 */
export function useBackgroundPrefetch(options: {
  enabled?: boolean;
  prefetchFns?: (() => Promise<any>)[];
  delay?: number;
} = {}) {
  const {
    enabled = true,
    prefetchFns = [],
    delay = 2000, // Wait 2 seconds before prefetching
  } = options;

  const utils = api.useUtils();
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prefetch data in the background
  useEffect(() => {
    if (!enabled || prefetchFns.length === 0) return;

    // Clear any existing timeout
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    // Set a new timeout to prefetch data
    prefetchTimeoutRef.current = setTimeout(async () => {
      try {
        // Execute all prefetch functions in parallel
        await Promise.all(prefetchFns.map(fn => fn()));
      } catch (error) {
        // Silently handle errors in background prefetching
        console.warn('Background prefetch error:', error);
      }
    }, delay);

    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, [enabled, prefetchFns, delay]);

  // Helper function to prefetch a specific query
  const prefetchQuery = <TInput>(
    procedurePath: string,
    input: TInput,
    options: {
      staleTime?: number;
    } = {}
  ) => {
    // Validate inputs before returning the prefetch function
    if (!procedurePath || typeof procedurePath !== 'string' || procedurePath.trim() === '') {
      console.warn('Invalid procedure path for prefetch:', procedurePath);
      return () => Promise.resolve(); // Return a no-op function
    }

    // Split the procedure path to get the router and procedure
    const [router, ...procedureParts] = procedurePath.split('.');
    const procedure = procedureParts.join('.');

    // Validate that we have both router and procedure
    if (!router || !procedure) {
      console.warn('Invalid procedure path format for prefetch:', procedurePath);
      return () => Promise.resolve(); // Return a no-op function
    }

    return async () => {
      try {
        // Use the utils.{router}.{procedure}.prefetch method instead of direct client query
        // This is more reliable and follows the recommended tRPC pattern
        if (utils[router] && utils[router][procedure] && utils[router][procedure].prefetch) {
          await utils[router][procedure].prefetch(input as any, options);
          console.log(`Successfully prefetched ${procedurePath}`);
        } else {
          console.warn(`Unable to prefetch ${procedurePath}: procedure not found`);
        }
      } catch (error) {
        console.warn(`Prefetch query error for ${procedurePath}:`, error);
      }
    };
  };

  return {
    prefetchQuery,
  };
}
