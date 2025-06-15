import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { RotateCcw, AlertCircle, CheckCircle, Clock, Award, Users, BookOpen, BarChart, PieChart, Activity } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PrincipalClassPerformanceViewProps {
  classIds: string[];
}

export const PrincipalClassPerformanceView: React.FC<PrincipalClassPerformanceViewProps> = ({ classIds }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClassId, setSelectedClassId] = useState<string>(classIds[0] || '');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch class performance data for all classes
  const {
    data: allClassesData,
    isLoading: isLoadingAllClasses,
    refetch: refetchAllClasses
  } = api.classPerformance.getByClassIds.useQuery(
    { classIds },
    {
      enabled: classIds.length > 0,
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

  // Fetch class performance data for selected class
  const {
    data: selectedClassData,
    isLoading: isLoadingSelectedClass,
    refetch: refetchSelectedClass
  } = api.classPerformance.getByClassId.useQuery(
    { classId: selectedClassId },
    {
      enabled: !!selectedClassId,
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

  // Fetch class details for display
  const { data: classDetails } = api.class.getById.useQuery(
    { classId: selectedClassId },
    {
      enabled: !!selectedClassId,
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  );

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchAllClasses();
      if (selectedClassId) {
        await refetchSelectedClass();
      }
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
      refetchSelectedClass();
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
    if (selectedClassId) {
      updateMetricsMutation.mutate({ classId: selectedClassId });
    }
  };

  // Calculate average metrics across all classes
  const calculateAverageMetrics = () => {
    if (!allClassesData || allClassesData.length === 0) {
      return {
        averageGrade: 0,
        attendanceRate: 0,
        participationRate: 0,
        completionRate: 0,
        totalPoints: 0,
        gradingTimeliness: 0
      };
    }

    const sum = allClassesData.reduce((acc, curr) => {
      return {
        averageGrade: acc.averageGrade + curr.averageGrade,
        attendanceRate: acc.attendanceRate + curr.attendanceRate,
        participationRate: acc.participationRate + curr.participationRate,
        completionRate: acc.completionRate + curr.completionRate,
        totalPoints: acc.totalPoints + curr.totalPoints,
        gradingTimeliness: acc.gradingTimeliness + curr.gradingTimeliness
      };
    }, {
      averageGrade: 0,
      attendanceRate: 0,
      participationRate: 0,
      completionRate: 0,
      totalPoints: 0,
      gradingTimeliness: 0
    });

    const count = allClassesData.length;
    return {
      averageGrade: Math.round((sum.averageGrade / count) * 10) / 10,
      attendanceRate: Math.round(sum.attendanceRate / count),
      participationRate: Math.round(sum.participationRate / count),
      completionRate: Math.round(sum.completionRate / count),
      totalPoints: Math.round(sum.totalPoints / count),
      gradingTimeliness: Math.round(sum.gradingTimeliness / count)
    };
  };

  const averageMetrics = calculateAverageMetrics();

  // Prepare comparison chart data
  const comparisonChartData = allClassesData?.map(classData => ({
    classId: classData.classId,
    averageGrade: classData.averageGrade,
    attendanceRate: classData.attendanceRate,
    participationRate: classData.participationRate,
    completionRate: classData.completionRate
  })) || [];

  // Prepare selected class chart data
  const academicChartData = [
    { name: 'Average Grade', value: selectedClassData?.averageGrade || 0 },
    { name: 'Passing Rate', value: selectedClassData?.passingRate || 0 },
    { name: 'Highest Grade', value: selectedClassData?.highestGrade || 0 },
    { name: 'Lowest Grade', value: selectedClassData?.lowestGrade || 0 },
  ];

  const attendanceChartData = [
    { name: 'Present', value: selectedClassData?.presentCount || 0 },
    { name: 'Absent', value: selectedClassData?.absentCount || 0 },
    { name: 'Late', value: selectedClassData?.lateCount || 0 },
    { name: 'Excused', value: selectedClassData?.excusedCount || 0 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (isLoadingAllClasses) {
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
        <h2 className="text-2xl font-bold">Class Performance Dashboard</h2>
        <div className="flex space-x-2">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-primary" />
              Average Academic Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageMetrics.averageGrade}%</div>
            <Progress value={averageMetrics.averageGrade} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Across {allClassesData?.length || 0} classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-primary" />
              Average Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageMetrics.attendanceRate}%</div>
            <Progress value={averageMetrics.attendanceRate} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Across {allClassesData?.length || 0} classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart className="h-4 w-4 mr-2 text-primary" />
              Average Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageMetrics.completionRate}%</div>
            <Progress value={averageMetrics.completionRate} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Across {allClassesData?.length || 0} classes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Details</CardTitle>
          <CardDescription>Select a class to view detailed performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {classDetails?.name || `Class ${id.substring(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedClassId && selectedClassData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Academic Performance</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsBarChart data={academicChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Attendance Breakdown</h3>
                  <ResponsiveContainer width="100%" height={200}>
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
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpdateMetrics}
            disabled={updateMetricsMutation.isLoading || !selectedClassId}
          >
            {updateMetricsMutation.isLoading ? 'Updating...' : 'Update Selected Class Metrics'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
