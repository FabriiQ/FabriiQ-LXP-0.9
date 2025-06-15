'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Clock, BookOpen, BarChart } from 'lucide-react';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface LearningTimeInvestmentProps {
  classId: string;
}

export function LearningTimeInvestment({ classId }: LearningTimeInvestmentProps) {
  // Fetch learning time statistics
  const { data: stats, isLoading } = api.learningTime.getLearningTimeStats.useQuery(
    { classId },
    {
      enabled: !!classId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  // If loading, show skeleton
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no data or no time spent, show empty state
  if (!stats || stats.totalTimeSpentMinutes === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-6">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-medium">Learning Time Tracking</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Time tracking data is not available yet. Complete activities to start tracking your learning time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format total time for display
  const totalHours = Math.floor(stats.totalTimeSpentMinutes / 60);
  const totalMinutes = stats.totalTimeSpentMinutes % 60;
  const formattedTotalTime = `${totalHours}h ${totalMinutes}m`;

  // Get top subject (if any)
  const topSubject = stats.timeSpentBySubject.length > 0
    ? stats.timeSpentBySubject.sort((a, b) => b.timeSpentMinutes - a.timeSpentMinutes)[0]
    : null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <Clock className="h-10 w-10 text-primary mx-auto mb-2" />
          <h3 className="text-xl font-medium">Total Learning Time</h3>
          <p className="text-3xl font-bold mt-1">{formattedTotalTime}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Across {stats.totalActivitiesCompleted} completed activities
          </p>
        </div>

        {topSubject && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Most Time Spent On</h4>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{topSubject.subjectName}</span>
                <span className="text-sm">
                  {Math.floor(topSubject.timeSpentMinutes / 60)}h {topSubject.timeSpentMinutes % 60}m
                </span>
              </div>
              <Progress
                value={(topSubject.timeSpentMinutes / stats.totalTimeSpentMinutes) * 100}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round((topSubject.timeSpentMinutes / stats.totalTimeSpentMinutes) * 100)}% of your total learning time
              </p>
            </div>
          </div>
        )}

        {stats.timeSpentByActivityType.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Activity Types</h4>
            <div className="space-y-3">
              {stats.timeSpentByActivityType
                .sort((a, b) => b.timeSpentMinutes - a.timeSpentMinutes)
                .slice(0, 3)
                .map((type) => (
                  <div key={type.activityType} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {type.activityType.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {Math.floor(type.timeSpentMinutes / 60)}h {type.timeSpentMinutes % 60}m
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
