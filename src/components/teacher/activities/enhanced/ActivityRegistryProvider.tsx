'use client';

import React, { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/atoms/spinner';

/**
 * ActivityRegistryProvider
 *
 * This component ensures that all activity types are properly registered and available
 * for use in the application. It uses the new simplified activity system.
 *
 * Note: This is a temporary implementation until we fully migrate to the new architecture.
 */
export function ActivityRegistryProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeRegistry = async () => {
      try {
        console.log('ActivityRegistryProvider: Starting initialization');

        // Import the activity types directly from features/activities
        // This will register all activity types
        await import('@/features/activities');

        console.log('ActivityRegistryProvider: Initialized activity registry');

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize activity registry:', error);
        setError('Failed to initialize activity registry');
        setIsLoading(false);
      }
    };

    initializeRegistry();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Spinner className="h-8 w-8 mb-4" />
        <p className="text-muted-foreground">Initializing activity registry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <h3 className="text-lg font-medium mb-2">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return <>{children}</>;
}
