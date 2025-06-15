'use client';

import React, { useEffect } from 'react';
import { useTimeTracking } from '@/components/providers/TimeTrackingProvider';

/**
 * Higher-order component that adds time tracking to any activity component
 *
 * @param Component The component to wrap with time tracking
 * @returns A new component with time tracking functionality
 */
export function withTimeTracking<P extends { activityId: string }>(
  Component: React.ComponentType<P>
) {
  const WithTimeTracking = (props: P) => {
    // Use the time tracking context
    const { startTracking, stopTracking } = useTimeTracking();

    // Start tracking when the component mounts
    useEffect(() => {
      // Start tracking this activity
      startTracking(props.activityId);

      // Stop tracking when the component unmounts
      return () => {
        stopTracking(props.activityId);
      };
    }, [props.activityId, startTracking, stopTracking]);

    // Render the original component with all props
    return <Component {...props} />;
  };

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithTimeTracking.displayName = `WithTimeTracking(${displayName})`;

  return WithTimeTracking;
}
