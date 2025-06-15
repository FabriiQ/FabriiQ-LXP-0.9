'use client';

import React from 'react';

/**
 * Performance monitoring utilities for activity components
 * Used to measure and track performance improvements from code splitting
 */

// Store performance metrics
interface PerformanceMetric {
  activityType: string;
  component: 'editor' | 'viewer' | 'grading';
  loadTime: number;
  renderTime: number;
  timestamp: number;
  route: string;
}

const METRICS_STORAGE_KEY = 'activity-performance-metrics';
const MAX_STORED_METRICS = 100;

// In-memory cache of recent metrics
let recentMetrics: PerformanceMetric[] = [];

/**
 * Record a performance metric for an activity component
 */
export function recordActivityPerformance(
  activityType: string,
  component: 'editor' | 'viewer' | 'grading',
  loadTime: number,
  renderTime: number
): void {
  const metric: PerformanceMetric = {
    activityType,
    component,
    loadTime,
    renderTime,
    timestamp: Date.now(),
    route: typeof window !== 'undefined' ? window.location.pathname : '',
  };

  // Add to recent metrics
  recentMetrics.push(metric);
  if (recentMetrics.length > MAX_STORED_METRICS) {
    recentMetrics.shift();
  }

  // Store in localStorage if available
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Get existing metrics
      const storedMetricsJson = localStorage.getItem(METRICS_STORAGE_KEY);
      const storedMetrics: PerformanceMetric[] = storedMetricsJson
        ? JSON.parse(storedMetricsJson)
        : [];

      // Add new metric
      storedMetrics.push(metric);

      // Keep only the most recent metrics
      if (storedMetrics.length > MAX_STORED_METRICS) {
        storedMetrics.splice(0, storedMetrics.length - MAX_STORED_METRICS);
      }

      // Save back to localStorage
      localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(storedMetrics));
    } catch (error) {
      console.error('Failed to store performance metric:', error);
    }
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${activityType} ${component}: Load=${loadTime}ms, Render=${renderTime}ms`);
  }
}

/**
 * Get performance metrics for analysis
 */
export function getActivityPerformanceMetrics(): PerformanceMetric[] {
  // Combine in-memory metrics with stored metrics
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const storedMetricsJson = localStorage.getItem(METRICS_STORAGE_KEY);
      if (storedMetricsJson) {
        const storedMetrics: PerformanceMetric[] = JSON.parse(storedMetricsJson);

        // Merge with recent metrics, removing duplicates
        const allMetrics = [...recentMetrics];

        for (const metric of storedMetrics) {
          // Check if this metric is already in recentMetrics
          const isDuplicate = allMetrics.some(m =>
            m.activityType === metric.activityType &&
            m.component === metric.component &&
            m.timestamp === metric.timestamp
          );

          if (!isDuplicate) {
            allMetrics.push(metric);
          }
        }

        // Sort by timestamp (newest first)
        return allMetrics.sort((a, b) => b.timestamp - a.timestamp);
      }
    } catch (error) {
      console.error('Failed to retrieve performance metrics:', error);
    }
  }

  return recentMetrics;
}

/**
 * Calculate average performance metrics by activity type and component
 */
export function getAveragePerformanceMetrics(): Record<string, Record<string, { avgLoad: number; avgRender: number; count: number }>> {
  const metrics = getActivityPerformanceMetrics();
  const result: Record<string, Record<string, { avgLoad: number; avgRender: number; count: number }>> = {};

  // Group metrics by activity type and component
  for (const metric of metrics) {
    if (!result[metric.activityType]) {
      result[metric.activityType] = {};
    }

    if (!result[metric.activityType][metric.component]) {
      result[metric.activityType][metric.component] = {
        avgLoad: 0,
        avgRender: 0,
        count: 0,
      };
    }

    const stats = result[metric.activityType][metric.component];
    stats.avgLoad = (stats.avgLoad * stats.count + metric.loadTime) / (stats.count + 1);
    stats.avgRender = (stats.avgRender * stats.count + metric.renderTime) / (stats.count + 1);
    stats.count++;
  }

  return result;
}

/**
 * Hook to measure component render time
 * Usage: const measureRender = useMeasureRender('multiple-choice', 'viewer');
 * Then call measureRender() at the start of your component and measureRender(true) when done
 */
export function useMeasureRender(
  activityType: string,
  component: 'editor' | 'viewer' | 'grading'
): (done?: boolean) => void {
  let startTime = 0;
  let loadTime = 0;

  // Record the load time when the component is first created
  if (typeof performance !== 'undefined') {
    // Get the most recent navigation entry
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      loadTime = navigationEntry.domContentLoadedEventEnd - navigationEntry.startTime;
    }
  }

  return (done = false) => {
    if (!done) {
      // Start timing
      startTime = performance.now();
    } else if (startTime > 0) {
      // End timing and record
      const renderTime = performance.now() - startTime;
      recordActivityPerformance(activityType, component, loadTime, renderTime);
    }
  };
}

/**
 * Higher-order component to measure performance
 * Usage: export default withPerformanceTracking('multiple-choice', 'viewer')(MyComponent);
 */
export function withPerformanceTracking(
  activityType: string,
  component: 'editor' | 'viewer' | 'grading'
) {
  return function<P extends object>(WrappedComponent: React.ComponentType<P>): React.FC<P> {
    return function PerformanceTrackedComponent(props: P) {
      const measureRender = useMeasureRender(activityType, component);

      // Start measuring
      measureRender();

      // Use useEffect to mark render as complete
      React.useEffect(() => {
        // Mark render as complete on next tick to ensure component has fully rendered
        const timer = setTimeout(() => {
          measureRender(true);
        }, 0);

        return () => clearTimeout(timer);
      }, []);

      return React.createElement(WrappedComponent, props);
    };
  };
}
