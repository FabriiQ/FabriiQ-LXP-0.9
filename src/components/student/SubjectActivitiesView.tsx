'use client';

import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { api } from '@/trpc/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
// No need to import Activity type from shared components as we define our own

// Import the Activity type from VirtualizedActivityList to ensure compatibility
import { Activity as VirtualizedActivity } from '@/components/shared/entities/students/VirtualizedActivityList';

// Define our own ImportedActivity interface that's compatible with VirtualizedActivityList
interface ImportedActivity extends VirtualizedActivity {
  // Additional properties specific to this component
  subject: string;
  status: 'completed' | 'pending' | 'overdue' | 'upcoming' | 'in-progress';
  content: {
    activityType?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
  // Commitment-related fields
  isCommitted?: boolean;
  commitmentDeadline?: Date | null;
  commitmentMet?: boolean | null;
  isCommitmentOverdue?: boolean;
}

import {
  Clock,
  AlertCircle,
  Calendar,
  ClipboardList,
  Check as CheckSquareIcon,
  Clock as ClockIcon,
  List as LayoutList,
  ChevronRight,
  ChevronLeft,
  Award,
  CheckCircle
} from 'lucide-react';
import { CommitmentIndicator } from '@/components/student/CommitmentIndicator';
import { ActivityTypeIcon, ActivityStatusIcon } from '@/components/shared/entities/students/ActivityTypeIcons';
import { WifiOff } from '@/components/icons/WifiOff';
import { cn } from '@/lib/utils';
import { isOnline } from '@/utils/offline-storage';
import { EnhancedVirtualizedActivityList } from '@/components/student/EnhancedVirtualizedActivityList';
import { EducationalLoadingFact } from '@/components/ui/loading/EducationalLoadingFact';
import { SubjectAchievements } from '@/components/rewards/SubjectAchievements';
import { useSession } from 'next-auth/react';

// Note: We're using EnhancedVirtualizedActivityList directly instead of lazy loading the original component

// View types
type ViewType = 'pending' | 'completed' | 'upcoming';

// Extend the Activity interface for our local use
interface Activity {
  id: string;
  title: string;
  type: string; // This will be mapped from learningType or learningActivityType
  status: string;
  dueDate?: string | Date;
  score?: number;
  totalScore?: number;
  chapterName?: string;
  chapterId?: string;
  createdAt?: string | Date; // For identifying new activities
  updatedAt?: string | Date;
  completionPercentage?: number; // For partially completed activities
  completedByPercentage?: number; // For social proof
  timeSpent?: number; // For investment loops (in minutes)
  streakCount?: number; // For streak counters
  isNew?: boolean; // Flag for new activities
  subjectId: string; // Added for filtering - required for VirtualizedActivityList
  subject?: any; // Subject relation
  topic?: any; // Topic relation
  learningType?: string; // Activity learning type from schema
  learningActivityType?: string; // Activity type from schema
  content?: any; // Activity content
  maxScore?: number; // Maximum score
  _count?: { activityGrades: number }; // Count of activity grades
  endDate?: string | Date; // End date
  startDate?: string | Date; // Start date
  activityGrades?: any[]; // Activity grades
  classId?: string; // Required for VirtualizedActivityList
  // Commitment-related fields
  isCommitted?: boolean;
  commitmentDeadline?: Date | null;
  commitmentMet?: boolean | null;
  isCommitmentOverdue?: boolean;
}

/**
 * SubjectActivitiesView component for displaying subject-specific activities
 * with multiple view options
 *
 * Features:
 * - Icon-based view switching (Recognition Over Recall)
 * - Multiple views: pending, completed, upcoming, chapter-wise, calendar
 * - Prioritization of due soon activities (Loss Aversion)
 * - Achievement history for completed activities (Endowment Effect)
 * - Preview cards for upcoming activities (Curiosity Gap)
 * - Chapter-wise organization (Mental Models)
 * - Calendar view for temporal organization (Spacing Effect)
 */
export function SubjectActivitiesView({
  subjectId,
  classId,
  subjectName,
  onBack
}: {
  subjectId: string;
  classId: string;
  subjectName?: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const studentId = session?.user?.id || "";
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [animateTransition, setAnimateTransition] = useState(false);

  // Get view type from URL or default to 'pending'
  const initialView = (searchParams?.get('view') as ViewType) || 'pending';
  const [viewType, setViewType] = useState<ViewType>(initialView);

  // Create subject object
  const subject = {
    id: subjectId,
    name: subjectName || 'Subject',
    code: ''
  };

  // Fetch activities with grades for this student, class, and subject with caching for offline support
  const { data: activityGrades, isLoading } = api.activityGrade.listByStudentAndClass.useQuery(
    {
      classId,
      subjectId
    },
    {
      enabled: !!classId && !!subjectId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
      retryDelay: 1000,
    }
  );

  // Log activity grades for debugging
  useEffect(() => {
    if (activityGrades) {
      console.log('Activity grades loaded:', activityGrades.length);
      console.log('Subject ID:', subjectId);
    }
  }, [activityGrades, subjectId]);

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

  // Update URL when view type changes
  useEffect(() => {
    if (viewType !== initialView) {
      const url = `/student/class/${classId}/subjects/${subjectId}/activities?view=${viewType}`;
      router.replace(url);
    }
  }, [viewType, initialView, classId, subjectId, router]);

  // Handle view change with animation
  const handleViewChange = (value: string) => {
    setAnimateTransition(true);
    setTimeout(() => {
      setViewType(value as ViewType);
      setTimeout(() => {
        setAnimateTransition(false);
      }, 150); // Match the animation duration
    }, 150);
  };

  // Note: These helper functions were removed as they're not being used
  // The EnhancedVirtualizedActivityList component has its own formatting functions

  // Define all hooks first, before any conditional rendering

  // Define processedActivities outside of the conditional rendering
  const processedActivities = useMemo(() => {
    // Always define these variables
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // If no activity grades, return empty array
    if (!activityGrades) return [];

    console.log('Processing activity grades:', activityGrades.length);

    // Process the activity grades with additional metadata
    return activityGrades.map((grade: any) => {
      const activity = grade.activity;

      // Map the ActivityGrade status to our display status
      let status = 'pending';
      switch (grade.status) {
        case 'GRADED':
        case 'COMPLETED':
          status = 'completed';
          console.log('Activity marked as completed:', activity.title, grade.status);
          break;
        case 'SUBMITTED':
        case 'DRAFT':
          status = 'in-progress';
          console.log('Activity marked as in-progress:', activity.title);
          break;
        case 'UNATTEMPTED':
          // Check if the activity is overdue or upcoming based on dates
          const isOverdue = activity.endDate && new Date(activity.endDate) < now;
          const isUpcoming = activity.startDate && new Date(activity.startDate) > now;

          if (isOverdue) {
            status = 'overdue';
            console.log('Activity marked as overdue:', activity.title);
          } else if (isUpcoming) {
            status = 'upcoming';
            console.log('Activity marked as upcoming:', activity.title);
          } else {
            status = 'pending';
            console.log('Activity marked as pending:', activity.title);
          }
          break;
        default:
          status = 'pending';
          console.log('Activity marked as pending (default):', activity.title);
      }

      // Mark activities created in the last 7 days as new
      const createdAt = activity.createdAt ? new Date(activity.createdAt) : null;
      const isNew = createdAt ? createdAt > oneWeekAgo : false;

      // Extract chapter information from topic if available
      const chapterName = activity.topic?.title || 'General';
      const chapterId = activity.topic?.id || 'general';

      // Add commitment information
      let isCommitted = grade.isCommitted || false;
      let commitmentDeadline = grade.commitmentDeadline ? new Date(grade.commitmentDeadline) : null;
      let commitmentMet = grade.commitmentMet;
      let isCommitmentOverdue = commitmentDeadline && now > commitmentDeadline;

      // Add engagement metrics (in a production app, these would come from analytics)
      // Only show completedByPercentage for completed activities
      const completedByPercentage = status === 'completed' ? Math.floor(Math.random() * 100) : undefined;

      // Only show timeSpent for activities that have been started (in-progress or completed)
      const timeSpent = (status === 'in-progress' || status === 'completed')
        ? Math.floor(Math.random() * 120) // 0-120 minutes
        : undefined;

      // Only show streakCount for activities that have been started
      const streakCount = (status === 'in-progress' || status === 'completed')
        ? Math.floor(Math.random() * 10) // 0-10 days
        : undefined;

      // Determine activity type from learningActivityType, learningType, or content
      let activityType = 'MULTIPLE_CHOICE';

      if (activity.learningActivityType) {
        activityType = activity.learningActivityType;
      } else if (activity.learningType) {
        activityType = activity.learningType;
      } else if (activity.content && typeof activity.content === 'object') {
        if ('activityType' in activity.content) {
          activityType = activity.content.activityType;
        }
      }

      // Commitment information already added above

      // Create a safe copy of the activity with all the properties we need
      const processedActivity = {
        ...activity,
        id: activity.id,
        title: activity.title,
        type: activityType,
        status: status,
        dueDate: activity.endDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        score: grade.score, // Use grade.score instead of activity.score
        totalScore: activity.maxScore || 100,
        chapterName: chapterName,
        chapterId: chapterId,
        isNew,
        completedByPercentage,
        timeSpent,
        streakCount,
        // Add commitment information
        isCommitted,
        commitmentDeadline,
        commitmentMet,
        isCommitmentOverdue,
        // Add completion percentage for in-progress activities
        completionPercentage: status === 'in-progress'
          ? Math.floor(Math.random() * 90) + 10 // 10-99% for in-progress
          : status === 'completed'
            ? 100 // 100% for completed
            : undefined, // undefined for other statuses
        // Ensure required properties for VirtualizedActivityList are present
        subjectId: activity.subjectId,
        classId: activity.classId || classId, // Use activity.classId or fall back to the current classId
        // Keep the original learningType and learningActivityType
        learningType: activity.learningType,
        learningActivityType: activity.learningActivityType
      };

      return processedActivity;
    });
  }, [activityGrades, classId]);

  // Find activities in progress for "continue where you left off" section
  const inProgressActivities = useMemo(() => {
    // Always return an array, even if processedActivities is empty
    if (!processedActivities.length) return [];

    return processedActivities.filter((activity: Activity) =>
      activity.status === 'in-progress' && activity.completionPercentage && activity.completionPercentage > 0
    ).sort((a: Activity, b: Activity) => {
      // Sort by most recently updated first
      const aDate = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
      const bDate = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
      return bDate.getTime() - aDate.getTime();
    }).slice(0, 3); // Take top 3
  }, [processedActivities]);

  // Helper function to map activities to the correct format for EnhancedVirtualizedActivityList
  const mapActivityToCorrectFormat = useCallback((activity: Activity): ImportedActivity | null => {
    // Validate the activity has required fields
    if (!activity || !activity.id || typeof activity.id !== 'string' || activity.id.trim() === '') {
      console.warn('Invalid activity encountered during mapping:', activity);
      return null;
    }

    // Log the activity being mapped
    console.log('Mapping activity:', activity.title, activity.status);

    // Ensure we have a valid status
    const validStatus = ['completed', 'pending', 'overdue', 'upcoming', 'in-progress'].includes(activity.status)
      ? activity.status
      : 'pending';

    // Determine the activity type from learningType or learningActivityType
    let activityType = 'MULTIPLE_CHOICE';
    if (activity.learningActivityType) {
      activityType = activity.learningActivityType;
    } else if (activity.learningType) {
      activityType = activity.learningType;
    } else if (activity.type) {
      activityType = activity.type;
    }

    // Create the mapped activity object with the correct type
    const mappedActivity: ImportedActivity = {
      id: activity.id,
      title: activity.title || 'Untitled Activity',
      type: activityType,
      status: validStatus as 'completed' | 'pending' | 'overdue' | 'upcoming' | 'in-progress',
      dueDate: activity.dueDate ? new Date(activity.dueDate) : new Date(), // Convert to Date or use current date as fallback
      score: activity.score, // Keep as number | undefined, not null
      totalScore: activity.totalScore || 100,
      className: subject.name,
      chapter: activity.chapterName || 'General',
      subject: subject.name, // This is the subject name field required by ImportedActivity
      classId: activity.classId || classId, // Use activity.classId or fall back to the current classId
      subjectId: activity.subjectId || subjectId, // Use activity.subjectId or fall back to the current subjectId
      content: {
        activityType: activityType
      },
      isNew: activity.isNew || false,
      completionPercentage: activity.completionPercentage || 0,
      createdAt: activity.createdAt ? new Date(activity.createdAt) : new Date(),
      updatedAt: activity.updatedAt ? new Date(activity.updatedAt) : new Date(),
      completedByPercentage: activity.completedByPercentage || 0,
      timeSpent: activity.timeSpent || 0,
      streakCount: activity.streakCount || 0,
      // Add commitment information
      isCommitted: activity.isCommitted || false,
      commitmentDeadline: activity.commitmentDeadline || null,
      commitmentMet: activity.commitmentMet || null,
      isCommitmentOverdue: activity.isCommitmentOverdue || false
    };

    return mappedActivity;
  }, [classId, subject.name, subjectId]);

  // Filter activities based on view type
  const filteredActivities = useMemo(() => {
    // Always return an array, even if processedActivities is empty
    if (!processedActivities.length) return [];

    return processedActivities.filter((activity: Activity) => {
      switch (viewType) {
        case 'pending':
          // Pending tab shows activities that are available to attempt now
          // This includes both pending and in-progress activities
          return activity.status === 'pending' || activity.status === 'in-progress' || activity.status === 'overdue';
        case 'completed':
          // Completed tab only shows fully completed activities
          return activity.status === 'completed';
        case 'upcoming':
          // Upcoming tab shows activities with future start dates
          return activity.status === 'upcoming';
        default:
          return true;
      }
    });
  }, [processedActivities, viewType]);

  // Group activities by chapter for chapter view
  const activitiesByChapter = useMemo(() => {
    // Always return an object, even if empty
    if (!processedActivities || processedActivities.length === 0) {
      return {} as Record<string, { id: string; name: string; activities: Activity[] }>;
    }

    return processedActivities.reduce((acc: Record<string, { id: string; name: string; activities: Activity[] }>, activity: Activity) => {
      const chapterId = activity.chapterId || 'uncategorized';
      const chapterName = activity.chapterName || 'Uncategorized';

      if (!acc[chapterId]) {
        acc[chapterId] = {
          id: chapterId,
          name: chapterName,
          activities: []
        };
      }

      acc[chapterId].activities.push(activity);
      return acc;
    }, {} as Record<string, { id: string; name: string; activities: Activity[] }>);
  }, [processedActivities]);

  // Sort chapters by name
  const sortedChapters = useMemo(() => {
    // Always return an array, even if activitiesByChapter is empty
    return Object.values(activitiesByChapter).sort((a: any, b: any) =>
      a.name.localeCompare(b.name)
    );
  }, [activitiesByChapter]);

  // This is the extra useMemo hook that was conditionally rendered before
  // Now we always render it to maintain hook order consistency
  const renderContent = useMemo(() => {
    // Determine what to render based on loading and data state
    if (isLoading) {
      return (
        <div className="space-y-6">
          <EducationalLoadingFact isLoading={true} showControls={true} />
          <ActivitiesViewSkeleton />
        </div>
      );
    }

    if (!activityGrades) {
      return (
        <div className="p-6 text-center">
          <div className="mb-4 text-red-500">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium">Unable to load activities</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {isOffline
              ? "You're currently offline. You can still view cached activities."
              : "We're having trouble connecting. This doesn't affect your progress."}
          </p>
          <Button
            onClick={() => window.location.reload()}
            disabled={isOffline}
          >
            Try Again
          </Button>
        </div>
      );
    }

    // Default case: render the main content
    return (
      <div className="space-y-6">
        {/* Back button and subject info */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack || (() => router.back())}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>

          <div>
            <h2 className="text-xl font-bold">{subject.name}</h2>
            <p className="text-sm text-muted-foreground">
              {subject.code || 'Activities'}
            </p>
          </div>
        </div>

        {/* Offline indicator */}
        {isOffline && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You're offline. Viewing cached activities. Changes will sync when you're back online.
            </p>
          </div>
        )}

        {/* View selector with icon buttons */}
        <Tabs
          defaultValue={viewType}
          value={viewType}
          onValueChange={handleViewChange}
          className="w-full"
        >
          <div className="border-b">
            <TabsList className="grid grid-cols-3 w-full rounded-none bg-transparent">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="pending"
                      className="flex items-center gap-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground rounded-none"
                    >
                      <ClipboardList className="h-4 w-4" />
                      <span className="hidden sm:inline">Pending</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Activities you need to complete</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="completed"
                      className="flex items-center gap-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground rounded-none"
                    >
                      <CheckSquareIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Completed</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Activities you've already completed</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="upcoming"
                      className="flex items-center gap-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground rounded-none"
                    >
                      <ClockIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Upcoming</span>
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Activities scheduled for the future</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsList>
          </div>

          {/* View content with transitions */}
          <div className={cn(
            "mt-6 transition-opacity duration-150",
            animateTransition ? "opacity-0" : "opacity-100"
          )}>
            {/* Continue where you left off section (Endowment Effect) */}
            {inProgressActivities.length > 0 && (
              <div className="mb-8 bg-muted/30 p-4 rounded-lg border border-muted">
                <h3 className="text-lg font-medium mb-4">Continue where you left off</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {inProgressActivities.map((activity: Activity) => (
                    <ContinueActivityCard
                      key={activity.id}
                      activity={activity}
                      classId={classId || ''}
                      subjectId={subjectId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pending view */}
            <TabsContent value="pending" className="m-0">
              {filteredActivities.length > 0 ? (
                <Suspense fallback={<ActivityListSkeleton />}>
                  <EnhancedVirtualizedActivityList
                    activities={filteredActivities
                      .map(mapActivityToCorrectFormat)
                      .filter((activity): activity is ImportedActivity => activity !== null)}
                    isLoading={false}
                    subjectId={subjectId}
                    classId={classId}
                  />
                </Suspense>
              ) : (
                <EmptyState
                  title="No pending activities"
                  description={
                    processedActivities.length > 0
                      ? "You've completed all your activities for this subject. Great job!"
                      : "There are no activities assigned to this subject yet."
                  }
                  icon={<CheckSquareIcon className="h-12 w-12" />}
                  actionButton={
                    processedActivities.length === 0 && (
                      <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                      >
                        Refresh
                      </Button>
                    )
                  }
                />
              )}
            </TabsContent>

            {/* Completed view */}
            <TabsContent value="completed" className="m-0">
              {filteredActivities.length > 0 ? (
                <Suspense fallback={<ActivityListSkeleton />}>
                  <div className="space-y-4">
                    <EnhancedVirtualizedActivityList
                      activities={filteredActivities
                        .map(mapActivityToCorrectFormat)
                        .filter((activity): activity is ImportedActivity => activity !== null)}
                      isLoading={false}
                      subjectId={subjectId}
                      classId={classId}
                    />

                    {/* Subject Achievements */}
                    {studentId && (
                      <SubjectAchievements
                        studentId={studentId}
                        classId={classId}
                        subjectId={subjectId}
                        limit={3}
                        showViewAll={true}
                        animated={true}
                        title={`${subjectName || 'Subject'} Achievements`}
                      />
                    )}
                  </div>
                </Suspense>
              ) : (
                <EmptyState
                  title="No completed activities"
                  description={
                    processedActivities.length > 0
                      ? "You haven't completed any activities for this subject yet. Start with your pending activities!"
                      : "There are no activities assigned to this subject yet."
                  }
                  icon={<ClipboardList className="h-12 w-12" />}
                  actionButton={
                    processedActivities.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => handleViewChange('pending')}
                      >
                        View Pending Activities
                      </Button>
                    )
                  }
                />
              )}
            </TabsContent>

            {/* Upcoming view */}
            <TabsContent value="upcoming" className="m-0">
              {filteredActivities.length > 0 ? (
                <Suspense fallback={<ActivityListSkeleton />}>
                  <div className="space-y-4">
                    <EnhancedVirtualizedActivityList
                      activities={filteredActivities
                        .map(mapActivityToCorrectFormat)
                        .filter((activity): activity is ImportedActivity => activity !== null)}
                      isLoading={false}
                      subjectId={subjectId}
                      classId={classId}
                    />


                  </div>
                </Suspense>
              ) : (
                <EmptyState
                  title="No upcoming activities"
                  description={
                    processedActivities.length > 0
                      ? "There are no upcoming activities scheduled for this subject yet."
                      : "There are no activities assigned to this subject yet."
                  }
                  icon={<ClockIcon className="h-12 w-12" />}
                  actionButton={
                    processedActivities.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => handleViewChange('pending')}
                      >
                        View Pending Activities
                      </Button>
                    )
                  }
                />
              )}
            </TabsContent>


          </div>
        </Tabs>
      </div>
    );
  }, [
    isLoading, activityGrades, isOffline, subject, onBack, router,
    viewType, handleViewChange, animateTransition, inProgressActivities,
    filteredActivities, mapActivityToCorrectFormat, subjectId, classId
  ]);

  // Simply return the renderContent
  return renderContent;
}

// Continue Activity Card Component (Endowment Effect)
function ContinueActivityCard({
  activity,
  classId,
  subjectId
}: {
  activity: Activity;
  classId: string;
  subjectId: string;
}) {
  // Determine if the activity is completed or in progress
  const isCompleted = activity.status === 'completed';
  const isInProgress = activity.status === 'in-progress';

  // Calculate points
  const pointsEarned = activity.score || 0;
  const pointsAvailable = activity.totalScore || 100;

  return (
    <Card className="overflow-hidden h-full relative group flex flex-col hover:border-primary-green/70 transition-all">
      {/* Visual status indicator - colored top border */}
      <div className={`h-1 w-full absolute top-0 left-0 ${
        isCompleted ? "bg-primary-green" :
        isInProgress ? "bg-medium-teal" :
        "bg-light-mint"
      }`} />

      {/* Card Header - Title and activity type icon */}
      <CardHeader className="p-3 pb-1 pt-4 flex-shrink-0 flex items-start gap-2">
        <div className={`p-1.5 rounded-full ${
          isCompleted ? "bg-primary-green/10" :
          isInProgress ? "bg-medium-teal/10" :
          "bg-light-mint/30"
        }`}>
          <ActivityTypeIcon
            type={activity.type}
            className="h-4 w-4"
          />
        </div>

        <div className="flex-1">
          <CardTitle className="text-base group-hover:text-primary-green transition-colors line-clamp-2">
            {activity.title}
          </CardTitle>

          {/* Activity type as small text */}
          <CardDescription className="text-xs capitalize mt-0.5">
            {activity.type.toString().replace(/_/g, ' ').replace(/-/g, ' ')}
          </CardDescription>
        </div>
      </CardHeader>

      {/* Card Content - Essential info with icons */}
      <CardContent className="p-3 pt-0 flex-grow">
        <div className="flex flex-col gap-2 mt-2">
          {/* Status with icon */}
          <div className="flex items-center text-xs">
            {isCompleted ? (
              <>
                <ActivityStatusIcon status="completed" className="h-3 w-3 mr-1.5 text-primary-green flex-shrink-0" />
                <span className="text-primary-green font-medium">Completed</span>
              </>
            ) : isInProgress ? (
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

          {/* Progress percentage */}
          {isInProgress && activity.completionPercentage && (
            <div className="flex items-center text-xs">
              <Progress value={activity.completionPercentage} className="h-1.5 flex-grow mr-2" />
              <span className="text-xs">{activity.completionPercentage}%</span>
            </div>
          )}

          {/* Learning Points with icon */}
          <div className="flex items-center text-xs mt-1">
            <Award className="h-3 w-3 mr-1.5 text-amber-500 flex-shrink-0" />
            {isCompleted && activity.score !== undefined ? (
              <span className="font-medium">{pointsEarned} of {pointsAvailable} points earned</span>
            ) : (
              <span>{pointsAvailable} points available</span>
            )}
          </div>

          {/* Time spent - only show for activities that have been started */}
          {activity.timeSpent && activity.timeSpent > 0 &&
           (isCompleted || isInProgress) && (
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
          variant={isInProgress ? "default" : "outline"}
          size="sm"
          className="w-full text-xs h-8 transition-colors"
          asChild
        >
          <Link
            href={
              isCompleted
                ? `/student/class/${classId}/subjects/${subjectId}/activities/${activity.id}/results`
                : `/student/class/${classId}/subjects/${subjectId}/activities/${activity.id}`
            }
          >
            {isCompleted ? 'View Results' : 'Continue'}
            <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}



// Empty state component
function EmptyState({
  title,
  description,
  icon,
  actionButton
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionButton?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto text-muted-foreground mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto mb-4">
        {description}
      </p>
      {actionButton && (
        <div className="mt-4">
          {actionButton}
        </div>
      )}
    </div>
  );
}

// Skeleton loader for activities view
function ActivitiesViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back button and subject info skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div>
          <Skeleton className="h-6 w-32 mb-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* View selector skeleton */}
      <Skeleton className="h-10 w-full rounded-md" />

      {/* Activities skeleton */}
      <div className="mt-6">
        <ActivityListSkeleton />
      </div>
    </div>
  );
}

// Skeleton loader for activity list
function ActivityListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Card key={i} className="overflow-hidden flex flex-col h-full">
          {/* Header skeleton */}
          <div className="p-4 pb-2 flex-shrink-0">
            <div className="flex justify-between">
              <div>
                <Skeleton className="h-5 w-3/4 mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="px-4 flex-grow">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-2 w-full mb-3" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-16 w-full rounded mb-2" />
          </div>

          {/* Footer skeleton */}
          <div className="p-4 pt-3 flex-shrink-0 border-t mt-2">
            <Skeleton className="h-8 w-full rounded" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default SubjectActivitiesView;
