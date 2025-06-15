import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RotateCcw, ExternalLink, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface TeacherClassPerformanceCardProps {
  classId: string;
  className?: string;
}

export const TeacherClassPerformanceCard: React.FC<TeacherClassPerformanceCardProps> = ({ 
  classId,
  className
}) => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

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
          variant: 'destructive',
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
        description: 'Class performance data refreshed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh class performance data',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Prepare chart data
  const chartData = [
    { name: 'Avg. Grade', value: performanceData?.averageGrade || 0 },
    { name: 'Attendance', value: performanceData?.attendanceRate || 0 },
    { name: 'Completion', value: performanceData?.completionRate || 0 },
    { name: 'Participation', value: performanceData?.participationRate || 0 },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-32" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  // If no performance data is available
  if (!performanceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{className || `Class ${classId.substring(0, 8)}`}</CardTitle>
          <CardDescription>Performance metrics</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-center text-muted-foreground">
            No performance data available for this class.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{className || `Class ${classId.substring(0, 8)}`}</CardTitle>
            <CardDescription>Performance metrics</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RotateCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Average Grade</span>
              <span className="text-sm font-medium">{performanceData.averageGrade.toFixed(1)}%</span>
            </div>
            <Progress value={performanceData.averageGrade} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Attendance Rate</span>
              <span className="text-sm font-medium">{performanceData.attendanceRate}%</span>
            </div>
            <Progress value={performanceData.attendanceRate} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Activity Completion</span>
              <span className="text-sm font-medium">{performanceData.completionRate}%</span>
            </div>
            <Progress value={performanceData.completionRate} className="h-2" />
          </div>

          <div className="pt-2">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/teacher/classes/${classId}/performance`} passHref>
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Detailed Performance
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
