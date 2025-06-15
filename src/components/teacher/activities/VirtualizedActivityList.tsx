'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { format } from 'date-fns';
import { FileText, Edit, BookOpen } from 'lucide-react';
import { ActivityCard } from './ActivityCard';

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

interface VirtualizedActivityListProps {
  activities: Activity[];
  classId: string;
  onEdit?: (activityId: string) => void;
  onDelete?: (activityId: string) => void;
  onDuplicate?: (activityId: string) => void;
}

/**
 * VirtualizedActivityList component for teachers
 *
 * Features:
 * - Virtualized rendering for performance with large datasets
 * - Responsive grid layout
 * - "Load more" functionality instead of pagination
 * - Action buttons for each activity
 */
export function VirtualizedActivityList({
  activities,
  classId,
  onEdit,
  onDelete,
  onDuplicate
}: VirtualizedActivityListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(1);
  const { toast } = useToast();

  // State for lazy loading
  const [visibleActivities, setVisibleActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 30; // Load 30 items at a time

  // Initialize visible activities
  useEffect(() => {
    // Load initial batch of activities
    const initialItems = activities.slice(0, itemsPerPage);
    setVisibleActivities(initialItems);
    setHasMore(activities.length > itemsPerPage);
  }, [activities, itemsPerPage]);

  // Update column count on resize
  useEffect(() => {
    const updateWidth = () => {
      if (parentRef.current) {
        const width = parentRef.current.offsetWidth;

        // Determine column count based on width
        if (width >= 1200) {
          setColumnCount(3); // lg
        } else if (width >= 768) {
          setColumnCount(2); // md
        } else {
          setColumnCount(1); // sm
        }
      }
    };

    // Initial update
    updateWidth();

    // Add resize listener
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Function to load more items when scrolling
  const loadMoreItems = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // Simulate loading delay for better UX
    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = (nextPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      // Get next batch of activities
      const newItems = activities.slice(startIndex, endIndex);

      // Update state
      setVisibleActivities(prev => [...prev, ...newItems]);
      setPage(nextPage);
      setHasMore(endIndex < activities.length);
      setIsLoading(false);
    }, 300);
  }, [activities, hasMore, isLoading, itemsPerPage, page]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    const loadMoreTrigger = document.getElementById('load-more-trigger');
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }

    return () => {
      if (loadMoreTrigger) {
        observer.unobserve(loadMoreTrigger);
      }
    };
  }, [hasMore, loadMoreItems]);

  // Calculate number of rows based on activities and column count
  const rowCount = Math.ceil(visibleActivities.length / columnCount);

  // Check if on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Create virtualizer with responsive row height
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isMobile ? 280 : 320, // Adjusted height to accommodate scrollable content
    overscan: 5, // Number of items to render before/after the visible area
  });

  // Calculate total list height
  const totalHeight = rowVirtualizer.getTotalSize();

  // Get virtualized rows
  const virtualRows = rowVirtualizer.getVirtualItems();

  // Format date function
  const formatActivityDate = (date: Date | string | undefined) => {
    if (!date) return 'No date set';
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Get activity type icon
  const getActivityTypeIcon = (type: string | undefined) => {
    switch (type?.toLowerCase()) {
      case 'quiz':
      case 'assessment':
        return <FileText className="h-4 w-4" />;
      case 'assignment':
        return <Edit className="h-4 w-4" />;
      case 'reading':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  // Handle edit activity
  const handleEdit = (activityId: string) => {
    if (onEdit) {
      onEdit(activityId);
    } else {
      // Navigate to edit page
      window.location.href = `/teacher/classes/${classId}/activities/${activityId}/edit`;
    }
  };

  // Handle delete activity
  const handleDelete = (activityId: string) => {
    if (onDelete) {
      onDelete(activityId);
    } else {
      // Show confirmation toast
      toast({
        title: "Delete activity?",
        description: "This action cannot be undone.",
        action: (
          <Button
            variant="destructive"
            onClick={() => {
              // Call API to delete activity
              // This is a placeholder - implement actual deletion logic
              toast({
                title: "Activity deleted",
                description: "The activity has been deleted.",
                variant: "default",
              });
            }}
          >
            Delete
          </Button>
        ),
      });
    }
  };

  // Handle duplicate activity
  const handleDuplicate = (activityId: string) => {
    if (onDuplicate) {
      onDuplicate(activityId);
    } else {
      // Show loading toast
      toast({
        title: "Duplicating activity...",
        description: "Please wait while we duplicate this activity.",
        variant: "default",
      });

      // This is a placeholder - implement actual duplication logic
      setTimeout(() => {
        toast({
          title: "Activity duplicated",
          description: "A copy of the activity has been created.",
          variant: "default",
        });
      }, 1000);
    }
  };

  return (
    <div
      ref={parentRef}
      className="w-full relative"
      style={{
        height: 'calc(100vh - 300px)',
        minHeight: '300px',
        maxHeight: '800px',
        overflow: 'auto',
        scrollBehavior: 'smooth'
      }}
    >
      <div
        style={{
          height: `${totalHeight}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const rowIndex = virtualRow.index;

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className={`grid grid-cols-1 md:grid-cols-${columnCount} gap-4 h-full`}>
                {Array.from({ length: columnCount }).map((_, colIndex) => {
                  const activityIndex = rowIndex * columnCount + colIndex;
                  const activity = visibleActivities[activityIndex];

                  if (!activity) return null;

                  return (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      classId={classId}
                      onEdit={() => handleEdit(activity.id)}
                      onDelete={() => handleDelete(activity.id)}
                      onDuplicate={() => handleDuplicate(activity.id)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more trigger */}
      {hasMore && (
        <div
          id="load-more-trigger"
          className="h-10 w-full flex items-center justify-center py-4"
        >
          {isLoading ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted/30 dark:bg-muted/10">
              <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm text-muted-foreground">Loading more...</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={loadMoreItems}
              className="transition-all hover:bg-primary hover:text-primary-foreground"
            >
              Load more activities
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Note: ActivityCard component is imported at the top of the file
