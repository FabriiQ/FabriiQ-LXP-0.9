'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import VirtualizedActivityList from '@/components/shared/entities/students/VirtualizedActivityList';
import { EducationalLoadingFact } from '@/components/ui/loading/EducationalLoadingFact';
import { LaborIllusionLoader } from '@/components/ui/loading/LaborIllusionLoader';
import { useBackgroundPrefetch } from '@/hooks/useBackgroundPrefetch';
import { api } from '@/utils/api';
import { saveActivity } from '@/features/activties/offline/db';
import { isOnline } from '@/utils/offline-storage';
import { useToast } from '@/components/ui/use-toast';
import { CACHE_KEYS } from '@/utils/query-config';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

// Import the Activity type from VirtualizedActivityList directly to ensure compatibility
import type { Activity as VirtualizedActivity } from '@/components/shared/entities/students/VirtualizedActivityList';

// Define our own Activity type that matches VirtualizedActivityList's requirements
type Activity = VirtualizedActivity;

interface EnhancedVirtualizedActivityListProps {
  activities: Activity[];
  isLoading?: boolean;
  error?: any;
  className?: string;
  onRefresh?: () => void;
  subjectId?: string;
  classId?: string;
}

/**
 * Enhanced version of VirtualizedActivityList with optimizations:
 * - Progressive loading with priority for visible content
 * - Educational facts during loading
 * - Labor illusion loading sequences
 * - Background data prefetching
 * - Offline support integration
 * - Optimistic UI updates
 */
export function EnhancedVirtualizedActivityList({
  activities,
  isLoading = false,
  error,
  className = '',
  onRefresh,
  subjectId,
  classId,
}: EnhancedVirtualizedActivityListProps) {
  const [isOffline, setIsOffline] = useState(!isOnline());
  const { toast } = useToast();
  const utils = api.useUtils();

  // Format date function
  const formatActivityDate = useCallback((date: Date) => {
    return formatDate(date);
  }, []);

  // Get status variant function
  const getStatusVariant = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'warning';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  }, []);

  // Get status icon function
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'in-progress':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <BookOpen className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  }, []);

  // Update offline status when connectivity changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast({
        title: "You're back online",
        description: "Your data will be synced automatically.",
        variant: "default",
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast({
        title: "You're offline",
        description: "You can still view activities. Changes will be synced when you reconnect.",
        variant: "warning",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Cache activities in IndexedDB for offline use
  useEffect(() => {
    if (activities.length > 0) {
      const cacheActivities = async () => {
        try {
          // Store each activity in IndexedDB
          for (const activity of activities) {
            // Ensure activity has all required properties before caching
            if (activity && activity.id && activity.subjectId && activity.classId) {
              await saveActivity(activity.id, activity);
            } else {
              console.warn('Skipping invalid activity during caching:', activity);
            }
          }
        } catch (error) {
          console.error('Error caching activities:', error);
        }
      };

      cacheActivities();
    }
  }, [activities]);

  // Set up background prefetching for likely next actions
  const { prefetchQuery } = useBackgroundPrefetch({
    enabled: !isOffline && !isLoading,
  });

  // Prefetch activity details for the first few activities
  useEffect(() => {
    if (isLoading || isOffline || activities.length === 0) return;

    // Get the first 3 activities to prefetch (reduced from 5 to minimize batch size)
    const activitiesToPrefetch = activities.slice(0, 3);

    // Filter out activities with invalid IDs or missing required properties
    const validActivities = activitiesToPrefetch.filter(
      activity => activity &&
                 activity.id &&
                 typeof activity.id === 'string' &&
                 activity.id.trim() !== '' &&
                 activity.subjectId &&
                 typeof activity.subjectId === 'string' &&
                 activity.classId &&
                 typeof activity.classId === 'string'
    );

    if (validActivities.length === 0) {
      console.warn('No valid activities to prefetch');
      return;
    }

    // Log the activities being prefetched
    console.log('Prefetching activities:', validActivities.map(a => a.id));

    // Prefetch each activity individually with a small delay between requests
    // This avoids creating a batch request that might have issues
    validActivities.forEach((activity, index) => {
      if (activity.id && activity.id.trim() !== '') {
        // Add a small delay between prefetch requests to avoid overwhelming the server
        setTimeout(() => {
          const prefetchFn = prefetchQuery('activity.getById', { id: activity.id }, { staleTime: 5 * 60 * 1000 });
          prefetchFn().catch(error => {
            console.warn(`Error prefetching activity ${activity.id}:`, error);
          });
        }, index * 200); // 200ms delay between each prefetch
      }
    });
  }, [activities, isLoading, isOffline, prefetchQuery]);

  // Invalidate activities cache when component unmounts
  useEffect(() => {
    return () => {
      if (!isOffline) {
        // Only invalidate the specific queries we care about
        // This is more targeted and less likely to cause issues
        try {
          utils.activity.listByClass.invalidate();
          console.log('Successfully invalidated activity.listByClass cache');
        } catch (error) {
          console.warn('Error invalidating cache:', error);
        }
      }
    };
  }, [isOffline, utils]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <EducationalLoadingFact isLoading={true} />
        <LaborIllusionLoader
          isLoading={true}
          steps={[
            { label: 'Loading activity data...', duration: 1, weight: 10 },
            { label: 'Preparing activity list...', duration: 1.5, weight: 20 },
            { label: 'Optimizing for your device...', duration: 1, weight: 15 },
            { label: 'Checking for updates...', duration: 2, weight: 25 },
            { label: 'Finalizing...', duration: 0.5, weight: 10 },
          ]}
        />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10">
        <h3 className="font-medium text-destructive mb-2">Error loading activities</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show offline badge if offline
  const offlineBadge = isOffline ? (
    <div className="mb-4">
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
        Offline Mode
      </Badge>
    </div>
  ) : null;

  return (
    <div className={className}>
      {offlineBadge}
      <VirtualizedActivityList
        activities={activities}
        formatDate={formatActivityDate}
        getStatusVariant={getStatusVariant}
        getStatusIcon={getStatusIcon}
      />
    </div>
  );
}
