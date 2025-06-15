'use client';

/**
 * Activity Registry Provider
 *
 * This component initializes the activities and makes them available to the application.
 * It uses the new activities architecture from features/activties.
 */

import { useEffect, useState } from 'react';

export function ActivityRegistryProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only import and initialize in the browser environment
    const initializeActivities = async () => {
      try {
        // Import the activity types directly from the new activities architecture
        await import('@/features/activties');

        // Mark as initialized
        setIsInitialized(true);

        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('ActivityRegistryProvider: Initialized activities');
        }
      } catch (error) {
        console.error('Failed to initialize activities:', error);
        setError('Failed to initialize activities');
      }
    };

    initializeActivities();
  }, []);

  // Show error if initialization failed
  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Error: {error}</p>
        <p>Some features may not work correctly.</p>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
