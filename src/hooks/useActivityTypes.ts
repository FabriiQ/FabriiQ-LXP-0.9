import { useMemo } from 'react';
import { ActivityPurpose } from '@/server/api/constants';

/**
 * Hook to get activity types filtered by purpose
 *
 * This is a temporary implementation that returns an empty array
 * until we implement a proper activity registry in the new architecture.
 */
export function useActivityTypes(purpose?: ActivityPurpose) {
  return useMemo(() => {
    // Temporary implementation - return empty array
    console.warn('useActivityTypes: This hook is using a temporary implementation that returns an empty array.');
    return [];

    // TODO: Implement proper activity type retrieval using the new architecture
    // Example implementation once we have a new registry:
    // if (!purpose) {
    //   return newActivityRegistry.getAll();
    // }
    // return newActivityRegistry.getByPurpose(purpose);
  }, [purpose]);
}
