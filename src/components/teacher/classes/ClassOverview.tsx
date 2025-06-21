'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { ClassMetricsGrid } from './ClassMetricsGrid';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  Award,
  TrendingUp,
  Clock,
  ChevronRight,
  BarChart,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ClassOverviewProps {
  classId: string;
}

// Extended interface for class metrics that includes both ClassPerformance and custom properties
interface ExtendedClassMetrics {
  // Standard ClassPerformance properties
  attendanceRate?: number;
  participationRate?: number;
  completionRate?: number;
  averageGrade?: number;
  passingRate?: number;
  activeStudents?: number;
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
  activitiesCreated?: number;

  // Custom properties that may be added by the API
  totalActivities?: number;
  totalAssessments?: number;
  assessmentCompletionRate?: number;
}

/**
 * ClassOverview component for displaying class overview page
 *
 * Features:
 * - Key metrics at the top
 * - Recent activities and upcoming assessments
 * - Student attendance summary
 * - Mobile-first responsive design
 */
export function ClassOverview({ classId }: ClassOverviewProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch class data
  const { data: classData, isLoading: isLoadingClass } = api.teacher.getClassById.useQuery(
    { classId },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Fetch class metrics
  const { data: classMetrics, isLoading: isLoadingMetrics } = api.teacher.getClassMetrics.useQuery(
    { classId },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Fetch recent activities
  const { data: recentActivities, isLoading: isLoadingActivities } = api.teacher.getRecentClassActivities.useQuery(
    { classId, limit: 5 },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Fetch upcoming assessments
  const { data: upcomingAssessments, isLoading: isLoadingAssessments } = api.teacher.getUpcomingClassAssessments.useQuery(
    { classId, limit: 5 },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Cast metrics to extended type for better type safety
  const extendedMetrics = classMetrics as ExtendedClassMetrics;

  // Prepare metrics data
  const metrics = [
    {
      id: 'students',
      label: 'Students',
      value: extendedMetrics?.activeStudents || 0,
      icon: <Users className="h-5 w-5" />,
      color: 'blue'
    },
    {
      id: 'attendance',
      label: 'Attendance Rate',
      value: `${extendedMetrics?.attendanceRate || 0}%`,
      icon: <Calendar className="h-5 w-5" />,
      progress: extendedMetrics?.attendanceRate || 0,
      color: 'green'
    },
    {
      id: 'activities',
      label: 'Activities',
      value: extendedMetrics?.totalActivities || extendedMetrics?.activitiesCreated || 0,
      icon: <BookOpen className="h-5 w-5" />,
      change: {
        value: extendedMetrics?.completionRate || 0,
        isPositive: (extendedMetrics?.completionRate || 0) >= 0
      },
      color: 'orange'
    },
    {
      id: 'assessments',
      label: 'Assessments',
      value: extendedMetrics?.totalAssessments || 0,
      icon: <ClipboardList className="h-5 w-5" />,
      change: {
        value: extendedMetrics?.assessmentCompletionRate || 0,
        isPositive: (extendedMetrics?.assessmentCompletionRate || 0) >= 0
      },
      color: 'purple'
    }
  ];

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Class title and info */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{classData?.name || 'Class Overview'}</h2>
        <p className="text-muted-foreground">
          {classData?.courseCampus?.course?.name && (
            <>
              <span className="font-medium">{classData.courseCampus.course.name}</span>
              {' • '}
            </>
          )}
          {classData?.term?.name && (
            <span>{classData.term.name}</span>
          )}
        </p>
      </div>

      {/* Class metrics */}
      <ClassMetricsGrid
        metrics={metrics}
        isLoading={isLoadingMetrics}
      />



      {/* Tabs for recent content */}
      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
          <TabsTrigger value="assessments">Upcoming Assessments</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        {/* Recent activities tab */}
        <TabsContent value="activities" className="space-y-4">
          {isLoadingActivities ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex justify-between py-2 border-b">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-5 w-1/4" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : recentActivities && recentActivities.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>
                  The latest activities assigned to this class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{activity.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {activity.purpose || 'Activity'}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(activity.createdAt.toISOString())}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/teacher/classes/${classId}/activities`)}
                >
                  View All Activities
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>
                  No activities have been assigned to this class yet
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-6">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="mb-4">Create your first activity for this class</p>
                <Button
                  onClick={() => router.push(`/teacher/content-studio?classId=${classId}`)}
                >
                  Create Activity
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Upcoming assessments tab */}
        <TabsContent value="assessments" className="space-y-4">
          {isLoadingAssessments ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex justify-between py-2 border-b">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-5 w-1/4" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : upcomingAssessments && upcomingAssessments.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Assessments</CardTitle>
                <CardDescription>
                  Assessments scheduled for this class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {upcomingAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <ClipboardList className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{assessment.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {assessment.subject?.name || 'Assessment'}
                          </div>
                        </div>
                      </div>
                      <Badge variant={
                        assessment.dueDate && new Date(assessment.dueDate) < new Date()
                          ? "destructive"
                          : "outline"
                      }>
                        {assessment.dueDate ? formatDate(assessment.dueDate.toISOString()) : 'No due date'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/teacher/classes/${classId}/assessments`)}
                >
                  View All Assessments
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Assessments</CardTitle>
                <CardDescription>
                  No assessments have been scheduled for this class yet
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-6">
                <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="mb-4">Create your first assessment for this class</p>
                <Button
                  onClick={() => router.push(`/teacher/classes/${classId}/assessments/new`)}
                >
                  Create Assessment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attendance tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>
                Recent attendance records for this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Overall Attendance Rate</div>
                    <div className="text-2xl font-bold">{extendedMetrics?.attendanceRate || 0}%</div>
                  </div>
                  <Button
                    variant="default"
                    onClick={() => router.push(`/teacher/classes/${classId}/attendance`)}
                  >
                    Take Attendance
                  </Button>
                </div>

                <div>
                  <div className="mb-2 text-sm font-medium">Last 30 Days</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Present</span>
                      <span className="font-medium">{extendedMetrics?.presentCount || 0} students</span>
                    </div>
                    <Progress value={extendedMetrics?.attendanceRate || 0} className="h-2 bg-muted" />

                    <div className="flex justify-between text-sm">
                      <span>Absent</span>
                      <span className="font-medium">{extendedMetrics?.absentCount || 0} students</span>
                    </div>
                    <Progress value={extendedMetrics?.absentCount ? (extendedMetrics.absentCount / ((extendedMetrics.presentCount || 0) + extendedMetrics.absentCount + (extendedMetrics.lateCount || 0))) * 100 : 0} className="h-2 bg-muted" />

                    <div className="flex justify-between text-sm">
                      <span>Late</span>
                      <span className="font-medium">{extendedMetrics?.lateCount || 0} students</span>
                    </div>
                    <Progress value={extendedMetrics?.lateCount ? (extendedMetrics.lateCount / ((extendedMetrics.presentCount || 0) + (extendedMetrics.absentCount || 0) + extendedMetrics.lateCount)) * 100 : 0} className="h-2 bg-muted" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/teacher/classes/${classId}/attendance/history`)}
              >
                View Attendance History
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Performance summary */}
      <Card>
        <CardHeader>
          <CardTitle>Class Performance</CardTitle>
          <CardDescription>
            Overall performance metrics for this class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Average Grade</div>
                <div className="text-2xl font-bold">{extendedMetrics?.averageGrade || 0}%</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/teacher/classes/${classId}/reports`)}
              >
                <BarChart className="mr-2 h-4 w-4" />
                Detailed Reports
              </Button>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Performance Metrics</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Passing Rate</span>
                  <span className="font-medium">{extendedMetrics?.passingRate || 0}%</span>
                </div>
                <Progress value={extendedMetrics?.passingRate || 0} className="h-2 bg-muted" />

                <div className="flex justify-between text-sm">
                  <span>Completion Rate</span>
                  <span className="font-medium">{extendedMetrics?.completionRate || 0}%</span>
                </div>
                <Progress value={extendedMetrics?.completionRate || 0} className="h-2 bg-muted" />

                <div className="flex justify-between text-sm">
                  <span>Participation Rate</span>
                  <span className="font-medium">{extendedMetrics?.participationRate || 0}%</span>
                </div>
                <Progress value={extendedMetrics?.participationRate || 0} className="h-2 bg-muted" />

                <div className="flex justify-between text-sm">
                  <span>Assessment Completion</span>
                  <span className="font-medium">{extendedMetrics?.assessmentCompletionRate || 0}%</span>
                </div>
                <Progress value={extendedMetrics?.assessmentCompletionRate || 0} className="h-2 bg-muted" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
