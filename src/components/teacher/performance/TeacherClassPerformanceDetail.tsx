'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  Users,
  BookOpen,
  BarChart,
  PieChart,
  Activity
} from 'lucide-react';

interface TeacherClassPerformanceDetailProps {
  classId: string;
}

export const TeacherClassPerformanceDetail: React.FC<TeacherClassPerformanceDetailProps> = ({ classId }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch class performance data
  const {
    data: performanceData,
    isLoading,
    refetch
  } = api.classPerformance.getByClassId.useQuery(
    { classId },
    {
      enabled: !!classId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to load class performance data: ${error.message}`,
          variant: 'error',
        });
      }
    }
  );

  // Fetch class details
  const { data: classDetails } = api.class.getById.useQuery(
    { classId },
    {
      enabled: !!classId,
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  );

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: 'Success',
        description: 'Class performance data refreshed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh class performance data',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Update class performance metrics
  const updateMetricsMutation = api.classPerformance.calculateAndUpdateMetrics.useMutation({
    onSuccess: () => {
      refetch();
      toast({
        title: 'Success',
        description: 'Class performance metrics updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update class performance metrics: ${error.message}`,
        variant: 'error',
      });
    }
  });

  const handleUpdateMetrics = () => {
    updateMetricsMutation.mutate({ classId });
  };

  // Prepare chart data
  const academicChartData = [
    { name: 'Average Grade', value: performanceData?.averageGrade || 0 },
    { name: 'Passing Rate', value: performanceData?.passingRate || 0 },
    { name: 'Highest Grade', value: performanceData?.highestGrade || 0 },
    { name: 'Lowest Grade', value: performanceData?.lowestGrade || 0 },
  ];

  const attendanceChartData = [
    { name: 'Present', value: performanceData?.presentCount || 0 },
    { name: 'Absent', value: performanceData?.absentCount || 0 },
    { name: 'Late', value: performanceData?.lateCount || 0 },
    { name: 'Excused', value: performanceData?.excusedCount || 0 },
  ];

  const activityChartData = [
    { name: 'Created', value: performanceData?.activitiesCreated || 0 },
    { name: 'Graded', value: performanceData?.activitiesGraded || 0 },
    { name: 'Completion Rate', value: performanceData?.completionRate || 0 },
    { name: 'Submission Rate', value: performanceData?.submissionRate || 0 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Class Performance</h2>
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {classDetails?.name || 'Class Performance'}
        </h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpdateMetrics}
            disabled={updateMetricsMutation.isLoading}
          >
            {updateMetricsMutation.isLoading ? 'Updating...' : 'Update Metrics'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Academic Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData?.averageGrade.toFixed(1) || 0}%</div>
                <Progress value={performanceData?.averageGrade || 0} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Passing rate: {performanceData?.passingRate.toFixed(1) || 0}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Attendance Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData?.attendanceRate || 0}%</div>
                <Progress value={performanceData?.attendanceRate || 0} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Present: {performanceData?.presentCount || 0}, Absent: {performanceData?.absentCount || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-primary" />
                  Activity Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData?.completionRate || 0}%</div>
                <Progress value={performanceData?.completionRate || 0} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Activities: {performanceData?.activitiesCreated || 0} created, {performanceData?.activitiesGraded || 0} graded
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Points & Participation</CardTitle>
              <CardDescription>Student engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Total Points</div>
                  <div className="text-2xl font-bold">{performanceData?.totalPoints || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Average per student: {performanceData?.averagePoints || 0}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Participation Rate</div>
                  <Progress value={performanceData?.participationRate || 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Active students: {performanceData?.activeStudents || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          <Card>
            <CardHeader>
              <CardTitle>Academic Metrics</CardTitle>
              <CardDescription>Detailed academic performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={academicChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Average Grade</div>
                    <div className="text-2xl font-bold">{performanceData?.averageGrade.toFixed(1) || 0}%</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Passing Rate</div>
                    <div className="text-2xl font-bold">{performanceData?.passingRate.toFixed(1) || 0}%</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Grade Range</div>
                    <div className="text-md">
                      Highest: {performanceData?.highestGrade.toFixed(1) || 0}% |
                      Lowest: {performanceData?.lowestGrade.toFixed(1) || 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Grade Improvement</div>
                    <div className="text-2xl font-bold">{performanceData?.gradeImprovement.toFixed(1) || 0}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Metrics</CardTitle>
              <CardDescription>Detailed attendance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={attendanceChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {attendanceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Attendance Rate</div>
                    <div className="text-2xl font-bold">{performanceData?.attendanceRate || 0}%</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-sm font-medium">Present</div>
                      <div className="text-xl">{performanceData?.presentCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Absent</div>
                      <div className="text-xl">{performanceData?.absentCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Late</div>
                      <div className="text-xl">{performanceData?.lateCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Excused</div>
                      <div className="text-xl">{performanceData?.excusedCount || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity Metrics</CardTitle>
              <CardDescription>Detailed activity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={activityChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill="#ffc658" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Activities Created</div>
                    <div className="text-2xl font-bold">{performanceData?.activitiesCreated || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Activities Graded</div>
                    <div className="text-2xl font-bold">{performanceData?.activitiesGraded || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Completion Rate</div>
                    <div className="text-2xl font-bold">{performanceData?.completionRate || 0}%</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Submission Rate</div>
                    <div className="text-2xl font-bold">{performanceData?.submissionRate || 0}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
