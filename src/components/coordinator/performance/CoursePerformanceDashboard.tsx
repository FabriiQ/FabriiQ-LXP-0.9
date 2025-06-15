'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle, Clock, Award, Users, BookOpen, BarChart as BarChartIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CoursePerformanceDashboardProps {
  courseId: string;
}

export const CoursePerformanceDashboard: React.FC<CoursePerformanceDashboardProps> = ({ courseId }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch course data
  const { data: courseData, isLoading: isLoadingCourse } = api.coordinator.getCourseById.useQuery(
    { courseId },
    {
      enabled: !!courseId,
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to load course data: ${error.message}`,
          variant: 'error',
        });
      }
    }
  );

  // Fetch classes for this course
  const { data: classesData, isLoading: isLoadingClasses } = api.coordinator.getCourseClasses.useQuery(
    { courseId },
    {
      enabled: !!courseId,
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to load classes data: ${error.message}`,
          variant: 'error',
        });
      }
    }
  );

  // Fetch performance data for all classes in this course
  const { data: performanceData, isLoading: isLoadingPerformance, refetch } = api.classPerformance.getByCourseId.useQuery(
    { courseId },
    {
      enabled: !!courseId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to load performance data: ${error.message}`,
          variant: 'error',
        });
      }
    }
  );

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: 'Success',
        description: 'Course performance data refreshed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh course performance data',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Navigate to class performance
  const handleClassClick = (classId: string) => {
    router.push(`/admin/coordinator/performance/classes?classId=${classId}`);
  };

  // Loading state
  if (isLoadingCourse || isLoadingClasses || isLoadingPerformance) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  // If no data is available
  if (!performanceData || !courseData || !classesData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>
            There is no performance data available for this course yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This could be because there are no classes in this course, or because the classes haven't recorded any performance data yet.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate average metrics across all classes
  const calculateAverageMetrics = () => {
    if (!performanceData.classPerformances || performanceData.classPerformances.length === 0) {
      return {
        averageGrade: 0,
        attendanceRate: 0,
        participationRate: 0,
        completionRate: 0,
        totalPoints: 0
      };
    }

    const sum = performanceData.classPerformances.reduce((acc, curr) => ({
      averageGrade: acc.averageGrade + curr.averageGrade,
      attendanceRate: acc.attendanceRate + curr.attendanceRate,
      participationRate: acc.participationRate + curr.participationRate,
      completionRate: acc.completionRate + curr.completionRate,
      totalPoints: acc.totalPoints + curr.totalPoints
    }), {
      averageGrade: 0,
      attendanceRate: 0,
      participationRate: 0,
      completionRate: 0,
      totalPoints: 0
    });

    const count = performanceData.classPerformances.length;
    return {
      averageGrade: Math.round((sum.averageGrade / count) * 10) / 10,
      attendanceRate: Math.round(sum.attendanceRate / count),
      participationRate: Math.round(sum.participationRate / count),
      completionRate: Math.round(sum.completionRate / count),
      totalPoints: Math.round(sum.totalPoints / count)
    };
  };

  const averageMetrics = calculateAverageMetrics();

  // Prepare chart data
  const classPerformanceData = performanceData.classPerformances.map(cls => ({
    name: cls.className || 'Unknown Class',
    grade: cls.averageGrade,
    attendance: cls.attendanceRate,
    participation: cls.participationRate,
    completion: cls.completionRate
  }));

  // Prepare attendance data for pie chart
  const attendanceData = [
    { name: 'Present', value: performanceData.totalAttendance.presentCount, color: '#4CAF50' },
    { name: 'Absent', value: performanceData.totalAttendance.absentCount, color: '#F44336' },
    { name: 'Late', value: performanceData.totalAttendance.lateCount, color: '#FFC107' },
    { name: 'Excused', value: performanceData.totalAttendance.excusedCount, color: '#2196F3' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{courseData.course?.name || 'Course Performance'}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageMetrics.averageGrade}%</div>
            <Progress value={averageMetrics.averageGrade} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageMetrics.attendanceRate}%</div>
            <Progress value={averageMetrics.attendanceRate} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageMetrics.participationRate}%</div>
            <Progress value={averageMetrics.participationRate} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Performance Overview</CardTitle>
              <CardDescription>
                Accumulated performance metrics for all classes in this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="grade" name="Average Grade" fill="#8884d8" />
                    <Bar dataKey="attendance" name="Attendance Rate" fill="#82ca9d" />
                    <Bar dataKey="participation" name="Participation Rate" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Performance</CardTitle>
              <CardDescription>
                Performance metrics for individual classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.classPerformances.map((cls) => (
                  <Card key={cls.classId} className="cursor-pointer hover:bg-accent/5" onClick={() => handleClassClick(cls.classId)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{cls.className}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium mb-1">Average Grade</div>
                          <Progress value={cls.averageGrade} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {cls.averageGrade}%
                          </p>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">Attendance Rate</div>
                          <Progress value={cls.attendanceRate} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {cls.attendanceRate}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>
                Attendance statistics across all classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Completion</CardTitle>
              <CardDescription>
                Activity completion rates across all classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completion" name="Completion Rate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
