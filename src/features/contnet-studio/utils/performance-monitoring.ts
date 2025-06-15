/**
 * Performance monitoring utility for AI Content Studio
 * Records and analyzes performance metrics for various components
 */

// Define the performance metric interface
interface PerformanceMetric {
  component: string;
  action: string;
  duration: number;
  timestamp: number;
}

// Store recent performance metrics for analysis
const recentMetrics: PerformanceMetric[] = [];
const MAX_METRICS = 100; // Maximum number of metrics to store

/**
 * Record a performance metric for an AI Studio component
 * @param component The component name
 * @param action The action being performed
 * @param startTime The start time in milliseconds
 * @param endTime The end time in milliseconds
 */
export function recordAIStudioPerformance(
  component: string,
  action: string,
  startTime: number,
  endTime: number
) {
  const duration = endTime - startTime;

  // Log performance metrics in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`AI Studio Performance: ${component} - ${action} - ${duration.toFixed(2)}ms`);
  }

  // Store the metric for analysis
  const metric: PerformanceMetric = {
    component,
    action,
    duration,
    timestamp: Date.now(),
  };

  recentMetrics.push(metric);

  // Keep only the most recent metrics
  if (recentMetrics.length > MAX_METRICS) {
    recentMetrics.shift();
  }

  // Send metrics to analytics service if available
  if (typeof window !== 'undefined' && typeof (window as any).analytics !== 'undefined') {
    (window as any).analytics.track('AI Studio Performance', {
      component,
      action,
      duration,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get performance metrics for a specific component
 * @param component The component name
 * @returns Array of performance metrics
 */
export function getComponentPerformance(component: string): PerformanceMetric[] {
  return recentMetrics.filter(metric => metric.component === component);
}

/**
 * Get average performance for a specific component and action
 * @param component The component name
 * @param action The action name
 * @returns Average duration in milliseconds
 */
export function getAveragePerformance(component: string, action: string): number {
  const metrics = recentMetrics.filter(
    metric => metric.component === component && metric.action === action
  );

  if (metrics.length === 0) return 0;

  const total = metrics.reduce((sum, metric) => sum + metric.duration, 0);
  return total / metrics.length;
}

/**
 * Clear all stored performance metrics
 */
export function clearPerformanceMetrics(): void {
  recentMetrics.length = 0;
}
