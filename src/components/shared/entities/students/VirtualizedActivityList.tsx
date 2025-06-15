'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ActivityTypeIcon, ActivityStatusIcon } from './ActivityTypeIcons';
import { Award, ChevronRight, Clock, Loader2, Users } from 'lucide-react';
import { BookMarked } from '@/components/shared/entities/students/icons';
import { CommitmentIndicator } from '@/components/student/CommitmentIndicator';

// Type for badge variants
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success';

// Create a new Activity interface that includes all properties from BaseActivity
// but makes classId and subjectId required
export interface Activity {
  // Include all properties from BaseActivity
  id: string;
  title: string;
  type: string; // This corresponds to learningActivityType or learningType in the schema
  status: string;
  dueDate: Date;
  className: string;
  isNew?: boolean;
  chapter?: string;
  completedByPercentage?: number;
  score?: number; // Note: This is number | undefined, not number | null | undefined
  totalScore?: number;
  completionPercentage?: number;
  streakCount?: number;
  timeSpent?: number;
  content?: any;

  // Add our additional properties
  classId: string;
  subjectId: string;

  // Commitment-related fields
  isCommitted?: boolean;
  commitmentDeadline?: Date | null;
  commitmentMet?: boolean | null;
  isCommitmentOverdue?: boolean;
}

interface VirtualizedActivityListProps {
  activities: Activity[];
  formatDate: (date: Date) => string;
  getStatusVariant: (status: string) => BadgeVariant;
  getStatusIcon: (status: string) => React.ReactNode;
}

export default function VirtualizedActivityList({
  activities,
  formatDate,
  getStatusVariant,
  getStatusIcon
}: VirtualizedActivityListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(1);

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

  // Calculate row count based on visible activities length and column count
  const rowCount = Math.ceil(visibleActivities.length / columnCount);

  // Determine if we're on a mobile device
  const [isMobile, setIsMobile] = useState(false);

  // Update mobile status on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Create virtualizer with responsive row height
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => document.documentElement, // Use document scroll instead of container scroll
    estimateSize: () => isMobile ? 280 : 320, // Adjusted height to accommodate scrollable content
    overscan: 5, // Number of items to render before/after the visible area
  });

  // Handle scroll to load more items using document scroll
  useEffect(() => {
    const handleScroll = () => {
      // Check if user has scrolled near the bottom of the page
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Load more when user scrolls to 80% of the page
      if (scrollTop + windowHeight >= documentHeight * 0.8 && hasMore && !isLoading) {
        loadMoreItems();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, loadMoreItems]);

  // Calculate total list height
  const totalHeight = rowVirtualizer.getTotalSize();

  // Get virtualized rows
  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="w-full"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 h-full">
                {Array.from({ length: columnCount }).map((_, colIndex) => {
                  const activityIndex = rowIndex * columnCount + colIndex;
                  const activity = visibleActivities[activityIndex];

                  // Skip rendering if activity is missing or doesn't have required properties
                  if (!activity || !activity.id || !activity.subjectId || !activity.classId) {
                    console.warn('Skipping invalid activity in VirtualizedActivityList:', activity);
                    return null;
                  }

                  return (
                    <Card key={activity.id} className="overflow-hidden h-full relative group flex flex-col hover:border-primary-green/70 transition-all">
                      {/* Visual status indicator - colored top border */}
                      <div className={`h-1 w-full absolute top-0 left-0 ${
                        activity.status === 'completed' ? "bg-primary-green" :
                        activity.status === 'in-progress' ? "bg-medium-teal" :
                        "bg-light-mint"
                      }`} />

                      {/* New badge and commitment indicator */}
                      <div className="absolute top-1 right-1 z-10 flex gap-1">
                        {activity.isNew && (
                          <Badge variant="default" className="text-xs rounded-sm bg-blue-500 text-white px-1.5 py-0.5">
                            NEW
                          </Badge>
                        )}

                        {/* Commitment indicator */}
                        {activity.isCommitted && (
                          <CommitmentIndicator
                            isCommitted={activity.isCommitted}
                            commitmentDeadline={activity.commitmentDeadline}
                            commitmentMet={activity.commitmentMet}
                          />
                        )}
                      </div>

                      {/* Card Header - Title and activity type icon */}
                      <CardHeader className="p-3 pb-1 pt-4 flex-shrink-0 flex items-start gap-2">
                        <div className={`p-1.5 rounded-full ${
                          activity.status === 'completed' ? "bg-primary-green/10" :
                          activity.status === 'in-progress' ? "bg-medium-teal/10" :
                          "bg-light-mint/30"
                        }`}>
                          <ActivityTypeIcon
                            type={activity.content?.activityType || activity.type}
                            className="h-4 w-4"
                          />
                        </div>

                        <div className="flex-1">
                          <CardTitle className="text-base group-hover:text-primary-green transition-colors line-clamp-2">
                            {activity.title}
                          </CardTitle>

                          {/* Activity type as small text */}
                          <CardDescription className="text-xs capitalize mt-0.5">
                            {(activity.content?.activityType || activity.type).toString().replace(/_/g, ' ').replace(/-/g, ' ')}
                          </CardDescription>
                        </div>
                      </CardHeader>

                      {/* Card Content - Essential info with icons */}
                      <CardContent className="p-3 pt-0 flex-grow">
                        <div className="flex flex-col gap-2 mt-2">
                          {/* Due Date with icon */}
                          <div className="flex items-center text-xs">
                            <Clock className="h-3 w-3 mr-1.5 text-muted-foreground flex-shrink-0" />
                            <span>{formatDate(activity.dueDate)}</span>
                          </div>

                          {/* Status with icon */}
                          <div className="flex items-center text-xs">
                            {activity.status === 'completed' ? (
                              <>
                                <ActivityStatusIcon status="completed" className="h-3 w-3 mr-1.5 text-primary-green flex-shrink-0" />
                                <span className="text-primary-green font-medium">Completed</span>
                              </>
                            ) : activity.status === 'in-progress' ? (
                              <>
                                <ActivityStatusIcon status="in-progress" className="h-3 w-3 mr-1.5 text-medium-teal flex-shrink-0" />
                                <span className="text-medium-teal font-medium">In Progress</span>
                              </>
                            ) : (
                              <>
                                <ActivityStatusIcon status="pending" className="h-3 w-3 mr-1.5 text-muted-foreground flex-shrink-0" />
                                <span>Not Started</span>
                              </>
                            )}
                          </div>

                          {/* Chapter info - Only if available */}
                          {activity.chapter && (
                            <div className="flex items-center text-xs">
                              <BookMarked className="h-3 w-3 mr-1.5 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{activity.chapter}</span>
                            </div>
                          )}

                          {/* Learning Points with icon */}
                          <div className="flex items-center text-xs mt-1">
                            <Award className="h-3 w-3 mr-1.5 text-amber-500 flex-shrink-0" />
                            {activity.status === 'completed' && activity.score !== undefined && activity.totalScore !== undefined ? (
                              <span className="font-medium">{activity.score} of {activity.totalScore} points earned</span>
                            ) : (
                              <span>{activity.totalScore || 100} points available</span>
                            )}
                          </div>

                          {/* Time spent - only show for activities that have been started */}
                          {activity.timeSpent !== undefined && activity.timeSpent > 0 &&
                           (activity.status === 'completed' || activity.status === 'in-progress') && (
                            <div className="flex items-center text-xs">
                              <Clock className="h-3 w-3 mr-1.5 text-muted-foreground flex-shrink-0" />
                              <span>Time invested: {activity.timeSpent} min</span>
                            </div>
                          )}
                        </div>
                      </CardContent>

                      {/* Card Footer - Action button */}
                      <CardFooter className="p-3 pt-2 flex-shrink-0 border-t bg-card">
                        <Button
                          variant={activity.status === 'in-progress' ? "default" : "outline"}
                          size="sm"
                          className="w-full text-xs h-8 transition-colors"
                          asChild
                        >
                          <Link
                            href={
                              activity.status === 'completed'
                                ? `/student/class/${activity.classId}/subjects/${activity.subjectId}/activities/${activity.id}/results`
                                : `/student/class/${activity.classId}/subjects/${activity.subjectId}/activities/${activity.id}`
                            }
                          >
                            {activity.status === 'completed'
                              ? 'View Results'
                              : activity.status === 'in-progress'
                                ? 'Continue'
                                : 'Start Activity'}
                            <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-4 mt-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span>Loading more activities...</span>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && visibleActivities.length > 0 && (
        <div className="text-center py-4 mt-4 text-muted-foreground">
          <span>All activities loaded</span>
        </div>
      )}
    </div>
  );
}
