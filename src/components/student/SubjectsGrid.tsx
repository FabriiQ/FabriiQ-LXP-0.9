'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useClass } from '@/contexts/class-context';
import { api } from '@/trpc/react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewTransitionLink } from '@/components/ui/view-transition-link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  BookMarked,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isOnline } from '@/utils/offline-storage';

/**
 * SubjectsGrid component for displaying subject cards with progress stats
 *
 * Features:
 * - Visual progress indicators for each subject (Goal Gradient Effect)
 * - Pending/completed activity counts (Chunking)
 * - Visual differentiation between subjects (Recognition Over Recall)
 * - Micro-interactions on hover/focus (Sensory Appeal)
 * - "Continue learning" prompts for in-progress subjects (Zeigarnik Effect)
 * - Urgency indicators for approaching deadlines (Scarcity)
 */
export function SubjectsGrid() {
  const { classId, data, loading, error } = useClass();
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);

  // Fetch activities for the class to calculate subject stats
  const { data: classActivities, isLoading } = api.activity.listByClass.useQuery(
    { classId: classId || '' },
    {
      enabled: !!classId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
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

  // Calculate subject stats from activities
  const subjectStats = React.useMemo(() => {
    if (!classActivities) return [];

    // Group activities by subject
    const subjectMap = new Map();

    classActivities.forEach(activity => {
      if (!activity.subject) return;

      const subjectId = activity.subject.id;
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subjectId,
          subjectName: activity.subject.name,
          subjectCode: activity.subject.code,
          totalActivities: 0,
          completedActivities: 0,
          pendingActivities: 0,
          inProgressActivities: 0,
          upcomingActivities: 0,
          completionPercentage: 0,
          hasUrgentDeadlines: false,
          nextDeadline: null
        });
      }

      const stats = subjectMap.get(subjectId);
      stats.totalActivities++;

      // Count by status
      if (activity.status === 'completed') {
        stats.completedActivities++;
      } else if (activity.status === 'in-progress') {
        stats.inProgressActivities++;
      } else if (activity.status === 'upcoming' || activity.status === 'scheduled') {
        stats.upcomingActivities++;
      } else {
        stats.pendingActivities++;
      }

      // Check for urgent deadlines
      if (activity.dueDate) {
        const dueDate = new Date(activity.dueDate);
        const now = new Date();
        const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 3 && daysDiff >= 0) {
          stats.hasUrgentDeadlines = true;
        }

        // Track next deadline
        if (!stats.nextDeadline || dueDate < new Date(stats.nextDeadline)) {
          stats.nextDeadline = activity.dueDate;
        }
      }
    });

    // Calculate completion percentage for each subject
    subjectMap.forEach(stats => {
      if (stats.totalActivities > 0) {
        stats.completionPercentage = Math.round((stats.completedActivities / stats.totalActivities) * 100);
      }
    });

    return Array.from(subjectMap.values());
  }, [classActivities]);

  // Render loading state
  if (loading || isLoading) {
    return <SubjectsGridSkeleton />;
  }

  // Render error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="mb-4 text-red-500">
          <AlertCircle className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium">Unable to load subjects</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          We're having trouble connecting. This doesn't affect your progress.
        </p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  // Get subjects from class data or subject stats
  const subjects = data?.subjects || [];

  // If no subjects are available in class data, extract from subject stats
  const subjectsFromStats = subjectStats?.map(stat => ({
    id: stat.subjectId,
    name: stat.subjectName,
    code: stat.subjectCode
  })) || [];

  // Use subjects from class data or extracted from subject stats
  const availableSubjects = subjects.length > 0 ? subjects : subjectsFromStats;

  // If no subjects are available, show empty state
  if (availableSubjects.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No subjects available</h3>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Your class doesn't have any subjects assigned yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {availableSubjects.map(subject => {
        // Find stats for this subject
        const stats = subjectStats?.find(s => s.subjectId === subject.id) || {
          totalActivities: 0,
          completedActivities: 0,
          pendingActivities: 0,
          inProgressActivities: 0,
          upcomingActivities: 0,
          completionPercentage: 0,
          hasUrgentDeadlines: false,
          nextDeadline: null
        };

        // Calculate completion percentage
        const completionPercentage = stats.completionPercentage || 0;

        // Determine card accent color based on subject
        // This creates visual differentiation between subjects
        const subjectColors = [
          'from-blue-500 to-cyan-400',
          'from-green-500 to-emerald-400',
          'from-purple-500 to-violet-400',
          'from-orange-500 to-amber-400',
          'from-pink-500 to-rose-400',
          'from-indigo-500 to-blue-400'
        ];

        // Use subject color if available, otherwise generate one
        let gradientColor;
        if (subject.color) {
          // Convert hex color to tailwind gradient
          const hexColor = subject.color.replace('#', '');
          const r = parseInt(hexColor.substring(0, 2), 16);
          const g = parseInt(hexColor.substring(2, 4), 16);
          const b = parseInt(hexColor.substring(4, 6), 16);

          // Create a lighter version for gradient
          const lighterR = Math.min(255, r + 40);
          const lighterG = Math.min(255, g + 40);
          const lighterB = Math.min(255, b + 40);

          gradientColor = `from-[${subject.color}] to-[rgb(${lighterR},${lighterG},${lighterB})]`;
        } else {
          // Use subject id to consistently assign the same color to the same subject
          const colorIndex = parseInt(subject.id.slice(-2), 16) % subjectColors.length;
          gradientColor = subjectColors[colorIndex];
        }

        return (
          <TooltipProvider key={subject.id}>
            <Card
              className={cn(
                "overflow-hidden transition-all duration-300 group relative",
                hoveredSubject === subject.id ? "shadow-lg scale-[1.02]" : "hover:shadow-md",
                stats.inProgressActivities > 0 && "ring-1 ring-yellow-400/30"
              )}
              onMouseEnter={() => setHoveredSubject(subject.id)}
              onMouseLeave={() => setHoveredSubject(null)}
            >
              {/* Subject color accent */}
              <div className={`h-2 bg-gradient-to-r ${gradientColor}`} />

              {/* Offline indicator */}
              {isOffline && (
                <div className="absolute top-2 right-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-1 rounded-full bg-muted">
                        <WifiOff className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Available offline</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}

              <div className="p-5">
                {/* Subject header with name and status indicators */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-lg group-hover:text-primary transition-colors">
                      {subject.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {subject.code || 'No code'}
                    </p>
                  </div>

                  {/* Status indicators */}
                  <div className="flex gap-1 flex-wrap justify-end">
                    {stats.hasUrgentDeadlines && (
                      <Badge
                        variant="destructive"
                        className="flex items-center gap-1 animate-pulse"
                      >
                        <Clock className="h-3 w-3" />
                        <span>Due Soon</span>
                      </Badge>
                    )}

                    {stats.inProgressActivities > 0 && (
                      <Badge
                        variant="warning"
                        className="flex items-center gap-1"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>In Progress</span>
                      </Badge>
                    )}

                    {completionPercentage === 100 && (
                      <Badge
                        variant="success"
                        className="flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Complete</span>
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Progress section */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {completionPercentage}%
                    </span>
                  </div>
                  <Progress
                    value={completionPercentage}
                    className={cn(
                      "h-2 transition-all duration-500",
                      hoveredSubject === subject.id && "h-3"
                    )}
                  />
                </div>

                {/* Activity stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "bg-muted/50 rounded p-2 transition-colors",
                        hoveredSubject === subject.id && stats.completedActivities > 0 && "bg-green-100 dark:bg-green-900/20"
                      )}>
                        <div className="text-lg font-medium">{stats.completedActivities}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{stats.completedActivities} completed activities</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "bg-muted/50 rounded p-2 transition-colors",
                        hoveredSubject === subject.id && stats.pendingActivities > 0 && "bg-yellow-100 dark:bg-yellow-900/20"
                      )}>
                        <div className="text-lg font-medium">{stats.pendingActivities}</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{stats.pendingActivities} pending activities</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "bg-muted/50 rounded p-2 transition-colors",
                        hoveredSubject === subject.id && stats.upcomingActivities > 0 && "bg-blue-100 dark:bg-blue-900/20"
                      )}>
                        <div className="text-lg font-medium">{stats.upcomingActivities}</div>
                        <div className="text-xs text-muted-foreground">Upcoming</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{stats.upcomingActivities} upcoming activities</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Continue learning prompt for in-progress subjects (Zeigarnik Effect) */}
                {stats.inProgressActivities > 0 && (
                  <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-2">
                      <BookMarked className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          Continue your learning
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400">
                          You have {stats.inProgressActivities} in-progress {stats.inProgressActivities === 1 ? 'activity' : 'activities'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next deadline if available */}
                {stats.nextDeadline && (
                  <div className={cn(
                    "flex items-center text-xs mb-4 p-2 rounded-md",
                    stats.hasUrgentDeadlines
                      ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                      : "text-muted-foreground"
                  )}>
                    <Clock className={cn(
                      "h-3 w-3 mr-1",
                      stats.hasUrgentDeadlines && "text-red-600 dark:text-red-400"
                    )} />
                    <span>
                      Next deadline: {new Date(stats.nextDeadline).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Action button */}
                <Button
                  className={cn(
                    "w-full transition-all duration-300",
                    hoveredSubject === subject.id
                      ? "bg-primary text-primary-foreground"
                      : "group-hover:bg-primary/90 group-hover:text-primary-foreground"
                  )}
                  variant={hoveredSubject === subject.id ? "default" : "outline"}
                  asChild
                >
                  <ViewTransitionLink
                    href={`/student/class/${classId}/subjects/${subject.id}/activities`}
                    hapticFeedback={true}
                  >
                    {stats.inProgressActivities > 0 ? 'Continue Learning' : 'View Activities'}
                    <ChevronRight className={cn(
                      "h-4 w-4 ml-1 transition-transform",
                      hoveredSubject === subject.id ? "translate-x-0.5" : "group-hover:translate-x-0.5"
                    )} />
                  </ViewTransitionLink>
                </Button>
              </div>
            </Card>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

// Skeleton loader for subjects grid
function SubjectsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-2 w-full" />
          <div className="p-5 space-y-4">
            <div className="flex justify-between">
              <div>
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-16 rounded" />
              <Skeleton className="h-16 rounded" />
              <Skeleton className="h-16 rounded" />
            </div>

            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default SubjectsGrid;
