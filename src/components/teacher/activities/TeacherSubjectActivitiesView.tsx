'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ChevronLeft,
  ClipboardList,
  Clock,
  Calendar,
  Plus,
  AlertCircle,
  RotateCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isOnline } from '@/utils/offline-storage';
import { ActivityCard } from './ActivityCard';
import { VirtualizedActivityList } from './VirtualizedActivityList';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';

// Activity type definition
interface Activity {
  id: string;
  title: string;
  description?: string;
  status: string;
  type?: string;
  activityType?: string;
  dueDate?: Date | string;
  startDate?: Date | string;
  endDate?: Date | string;
  subject?: {
    id: string;
    name: string;
    code?: string;
  };
  subjectId?: string;
  classId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Subject type definition
interface Subject {
  id: string;
  name: string;
  code?: string;
}

interface TeacherSubjectActivitiesViewProps {
  classId: string;
  subjects: Subject[];
  onBack?: () => void;
  className?: string;
}

/**
 * TeacherSubjectActivitiesView component for displaying subject-specific activities
 * with multiple view options for teachers
 *
 * Features:
 * - Subject-based tabs for organizing activities
 * - Multiple view options: upcoming, past, all
 * - Virtualized lists for performance with large datasets
 * - Offline support
 * - Background data prefetching
 */
export function TeacherSubjectActivitiesView({
  classId,
  subjects,
  onBack,
  className
}: TeacherSubjectActivitiesViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Get URL parameters for initial state
  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();

  const initialSubject = searchParams.get('subject') || 'all';
  const initialView = searchParams.get('view') || 'upcoming';

  // State
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [viewType, setViewType] = useState(initialView);
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [animateTransition, setAnimateTransition] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get activities for the class with cursor-based pagination
  const {
    data: activitiesData,
    isLoading: isLoadingActivities,
    refetch: refetchActivities,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = api.teacher.getClassActivities.useInfiniteQuery(
    {
      classId,
      subjectId: selectedSubject !== 'all' ? selectedSubject : undefined,
      limit: 30 // Fetch 30 items at a time
    },
    {
      enabled: !!classId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
      retryDelay: 1000,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    }
  );

  // Update offline status when connectivity changes
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update URL when view type or subject changes
  useEffect(() => {
    if (viewType !== initialView || selectedSubject !== initialSubject) {
      const url = `/teacher/classes/${classId}/activities?subject=${selectedSubject}&view=${viewType}`;
      router.replace(url);
    }
  }, [viewType, initialView, selectedSubject, initialSubject, classId, router]);

  // Handle view change with animation
  const handleViewChange = (value: string) => {
    setAnimateTransition(true);
    setTimeout(() => {
      setViewType(value);
      setTimeout(() => {
        setAnimateTransition(false);
      }, 150); // Match the animation duration
    }, 150);
  };

  // Handle subject change with animation
  const handleSubjectChange = (value: string) => {
    setAnimateTransition(true);
    setTimeout(() => {
      setSelectedSubject(value);
      setTimeout(() => {
        setAnimateTransition(false);
      }, 150); // Match the animation duration
    }, 150);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchActivities();
      toast({
        title: "Activities refreshed",
        description: "The latest activities have been loaded.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not refresh activities. Please try again.",
        variant: "error",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Process activities from infinite query
  const processedActivities = useMemo(() => {
    if (!activitiesData?.pages) return [];

    const now = new Date();

    // Flatten all pages of activities
    const allActivities = activitiesData.pages.flatMap(page => page.items || []);

    return allActivities.map((activity: any) => {
      // Determine activity status
      let status = activity.status?.toLowerCase() || 'active';

      // Convert to our Activity interface
      return {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        status: status,
        type: activity.activityType || activity.type || 'unknown',
        dueDate: activity.endDate || activity.dueDate,
        startDate: activity.startDate,
        endDate: activity.endDate,
        subject: activity.subject || {
          id: activity.subjectId || 'unknown',
          name: activity.subjectName || 'Unknown Subject'
        },
        subjectId: activity.subjectId || activity.subject?.id,
        classId: activity.classId || classId,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt
      };
    });
  }, [activitiesData, classId]);

  // Filter activities by subject and view type
  const filteredActivities = useMemo(() => {
    if (!processedActivities.length) return [];

    const now = new Date();

    // First filter by subject
    const subjectFiltered = selectedSubject === 'all'
      ? processedActivities
      : processedActivities.filter(activity =>
          activity.subjectId === selectedSubject ||
          activity.subject?.id === selectedSubject
        );

    // Then filter by view type
    return subjectFiltered.filter(activity => {
      const endDate = activity.endDate ? new Date(activity.endDate) : null;
      const startDate = activity.startDate ? new Date(activity.startDate) : null;

      switch (viewType) {
        case 'upcoming':
          // Activities that haven't ended yet
          return !endDate || endDate > now;
        case 'past':
          // Activities that have ended
          return endDate && endDate <= now;
        case 'all':
        default:
          return true;
      }
    });
  }, [processedActivities, selectedSubject, viewType]);

  // Render the component
  if (isLoadingActivities) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with back button and refresh */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8 flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          )}

          <h2 className="text-xl font-bold line-clamp-1">Class Activities</h2>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isOffline}
          className="flex-shrink-0"
        >
          <RotateCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          <span className="hidden sm:inline">Refresh</span>
          <span className="sm:hidden">Sync</span>
        </Button>
      </div>

      {/* Offline indicator */}
      {isOffline && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">You're offline. Some features may be limited.</p>
        </div>
      )}

      {/* Subject tabs */}
      <Tabs
        defaultValue={selectedSubject}
        value={selectedSubject}
        onValueChange={handleSubjectChange}
        className="w-full"
      >
        {/* Mobile dropdown for subjects (visible only on small screens) */}
        <div className="md:hidden mb-4 relative">
          <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Subject
          </label>
          <select
            id="subject-select"
            value={selectedSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full p-2 pl-3 pr-10 border rounded-md bg-background text-foreground dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors appearance-none"
            aria-label="Select subject"
          >
            <option value="all">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {/* Custom dropdown indicator */}
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Horizontal tabs with scroll (hidden on small screens) */}
        <div className="hidden md:block relative border-b overflow-hidden">
          <div className="relative">
            <TabsList className="flex overflow-x-auto pb-px bg-transparent scrollbar-hide scroll-smooth">
              <TabsTrigger
                value="all"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground rounded-none min-w-max"
              >
                All Subjects
              </TabsTrigger>

              {subjects.map(subject => (
                <TabsTrigger
                  key={subject.id}
                  value={subject.id}
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground rounded-none whitespace-nowrap min-w-max px-4"
                >
                  {subject.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Scroll indicators */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* View type tabs */}
        <div className="mt-4">
          <Tabs
            defaultValue={viewType}
            value={viewType}
            onValueChange={handleViewChange}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-3 md:w-auto md:flex">
              <TooltipProvider delayDuration={700}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="upcoming" className="flex items-center justify-center gap-1 px-2 md:px-4">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Upcoming</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Activities that haven't ended yet</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={700}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="past" className="flex items-center justify-center gap-1 px-2 md:px-4">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Past</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Activities that have ended</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={700}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="all" className="flex items-center justify-center gap-1 px-2 md:px-4">
                      <ClipboardList className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">All</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>All activities</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsList>

            {/* View content with transitions */}
            <div className={cn(
              "mt-6 transition-opacity duration-150",
              animateTransition ? "opacity-0" : "opacity-100"
            )}>
              <TabsContent value="upcoming" className="m-0">
                {renderActivityList(filteredActivities, "upcoming")}
              </TabsContent>

              <TabsContent value="past" className="m-0">
                {renderActivityList(filteredActivities, "past")}
              </TabsContent>

              <TabsContent value="all" className="m-0">
                {renderActivityList(filteredActivities, "all")}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Tabs>
    </div>
  );

  // Helper function to render activity list
  function renderActivityList(activities: Activity[], viewType: string) {
    if (activities.length === 0) {
      return (
        <EmptyState
          title={`No ${viewType} activities`}
          description={
            selectedSubject === 'all'
              ? `There are no ${viewType} activities for any subject.`
              : `There are no ${viewType} activities for this subject.`
          }
          icon={viewType === 'upcoming' ? <Calendar className="h-12 w-12" /> :
                viewType === 'past' ? <Clock className="h-12 w-12" /> :
                <ClipboardList className="h-12 w-12" />}
          action={
            <Button
              variant="outline"
              asChild
            >
              <Link href={`/teacher/classes/${classId}/activities/create`}>
                <Plus className="h-4 w-4 mr-2" />
                Create Activity
              </Link>
            </Button>
          }
        />
      );
    }

    return (
      <Suspense fallback={<div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>}>
        <div className="space-y-4">
          <VirtualizedActivityList
            activities={activities}
            classId={classId}
          />

          {/* Load more button */}
          {hasNextPage && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Loading...
                  </>
                ) : (
                  'Load More Activities'
                )}
              </Button>
            </div>
          )}
        </div>
      </Suspense>
    );
  }
}
