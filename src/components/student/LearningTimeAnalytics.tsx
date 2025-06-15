'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, BookOpen, BarChart, PieChartIcon } from 'lucide-react';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface LearningTimeAnalyticsProps {
  classId: string;
}

/**
 * Component for displaying detailed learning time analytics
 */
export function LearningTimeAnalytics({ classId }: LearningTimeAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');

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
        <CardHeader>
          <CardTitle>Learning Time Analytics</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-40 w-full" />
            <div className="grid grid-cols-2 gap-4">
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
        <CardHeader>
          <CardTitle>Learning Time Analytics</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-6">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-medium">No Learning Time Data</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Complete activities to start tracking your learning time.
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning Time Analytics</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">By Subject</TabsTrigger>
            <TabsTrigger value="activities">By Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="text-center">
              <Clock className="h-10 w-10 text-primary mx-auto mb-2" />
              <h3 className="text-xl font-medium">Total Learning Time</h3>
              <p className="text-3xl font-bold mt-1">{formattedTotalTime}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Across {stats.totalActivitiesCompleted} completed activities
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <h4 className="text-sm font-medium text-muted-foreground">Most Time On</h4>
                <p className="text-lg font-semibold mt-1">
                  {stats.timeSpentBySubject[0]?.subjectName || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(stats.timeSpentBySubject[0]?.timeSpentMinutes / 60 || 0)} hours
                </p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <h4 className="text-sm font-medium text-muted-foreground">Most Common Activity</h4>
                <p className="text-lg font-semibold mt-1">
                  {stats.timeSpentByActivityType[0]?.activityType.replace('_', ' ').toLowerCase() || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.timeSpentByActivityType[0]?.activityCount || 0} activities
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <h3 className="text-lg font-medium mb-4">Time by Subject</h3>
            <div className="space-y-4">
              {stats.timeSpentBySubject
                .sort((a, b) => b.timeSpentMinutes - a.timeSpentMinutes)
                .map((subject) => (
                  <div key={subject.subjectId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{subject.subjectName}</span>
                      <span className="text-sm">
                        {Math.floor(subject.timeSpentMinutes / 60)}h {subject.timeSpentMinutes % 60}m
                      </span>
                    </div>
                    <Progress
                      value={(subject.timeSpentMinutes / stats.totalTimeSpentMinutes) * 100}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{subject.activityCount} activities</span>
                      <span>
                        {Math.round((subject.timeSpentMinutes / stats.totalTimeSpentMinutes) * 100)}% of total
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <h3 className="text-lg font-medium mb-4">Time by Activity Type</h3>
            <div className="space-y-4">
              {stats.timeSpentByActivityType
                .sort((a, b) => b.timeSpentMinutes - a.timeSpentMinutes)
                .map((type) => (
                  <div key={type.activityType} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {type.activityType.replace('_', ' ').toLowerCase()}
                      </span>
                      <span className="text-sm">
                        {Math.floor(type.timeSpentMinutes / 60)}h {type.timeSpentMinutes % 60}m
                      </span>
                    </div>
                    <Progress
                      value={(type.timeSpentMinutes / stats.totalTimeSpentMinutes) * 100}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{type.activityCount} activities</span>
                      <span>
                        {Math.round((type.timeSpentMinutes / stats.totalTimeSpentMinutes) * 100)}% of total
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
