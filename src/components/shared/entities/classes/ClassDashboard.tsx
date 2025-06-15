'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  BarChart, 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileText, 
  Users,
  BookOpen,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClassData, UserRole } from './types';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';

export interface ClassMetric {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
  color?: string;
  roles: UserRole[];
}

export interface ClassChartData {
  id: string;
  label: string;
  data: any[];
  roles: UserRole[];
}

export interface ClassDashboardProps {
  /**
   * Class data
   */
  classData: ClassData;
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Array of metrics to display
   * @default []
   */
  metrics?: ClassMetric[];
  
  /**
   * Array of chart data
   * @default []
   */
  charts?: ClassChartData[];
  
  /**
   * Time range for metrics
   * @default '7d'
   */
  timeRange?: '7d' | '30d' | '90d' | 'all';
  
  /**
   * Loading state
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Error message
   */
  error?: string;
  
  /**
   * Time range change callback
   */
  onTimeRangeChange?: (range: '7d' | '30d' | '90d' | 'all') => void;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * ClassDashboard component with mobile-first design
 * 
 * Features:
 * - Role-specific metric visibility
 * - Time range selector
 * - Loading and error states
 * - Data visualization with charts
 * 
 * @example
 * ```tsx
 * <ClassDashboard 
 *   classData={classData}
 *   userRole={UserRole.TEACHER}
 *   metrics={metrics}
 *   charts={charts}
 *   timeRange="30d"
 *   onTimeRangeChange={handleTimeRangeChange}
 * />
 * ```
 */
export const ClassDashboard: React.FC<ClassDashboardProps> = ({
  classData,
  userRole,
  metrics = [],
  charts = [],
  timeRange = '7d',
  isLoading = false,
  error,
  onTimeRangeChange,
  className,
}) => {
  // State for time range
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>(timeRange);
  
  // Handle time range change
  const handleTimeRangeChange = (range: '7d' | '30d' | '90d' | 'all') => {
    setSelectedTimeRange(range);
    if (onTimeRangeChange) {
      onTimeRangeChange(range);
    }
  };
  
  // Filter metrics based on user role
  const visibleMetrics = metrics.filter(metric => metric.roles.includes(userRole));
  
  // Filter charts based on user role
  const visibleCharts = charts.filter(chart => chart.roles.includes(userRole));
  
  // Default metrics if none provided
  const defaultMetrics: ClassMetric[] = [
    {
      id: 'enrollment',
      label: 'Enrollment',
      value: classData.currentCount,
      previousValue: classData.currentCount - 2,
      icon: <Users className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-700',
      roles: [UserRole.SYSTEM_ADMIN, UserRole.CAMPUS_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER],
    },
    {
      id: 'attendance',
      label: 'Attendance Rate',
      value: 85,
      previousValue: 82,
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'bg-green-100 text-green-700',
      roles: [UserRole.SYSTEM_ADMIN, UserRole.CAMPUS_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER, UserRole.STUDENT],
    },
    {
      id: 'average-grade',
      label: 'Average Grade',
      value: 78,
      previousValue: 75,
      icon: <BarChart className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-700',
      roles: [UserRole.SYSTEM_ADMIN, UserRole.CAMPUS_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER, UserRole.STUDENT],
    },
    {
      id: 'completion-rate',
      label: 'Completion Rate',
      value: 65,
      previousValue: 60,
      icon: <GraduationCap className="h-4 w-4" />,
      color: 'bg-amber-100 text-amber-700',
      roles: [UserRole.SYSTEM_ADMIN, UserRole.CAMPUS_ADMIN, UserRole.COORDINATOR, UserRole.TEACHER],
    },
  ];
  
  // Use provided metrics or default metrics
  const displayMetrics = visibleMetrics.length > 0 ? visibleMetrics : defaultMetrics.filter(metric => metric.roles.includes(userRole));
  
  // Default attendance data
  const defaultAttendanceData = [
    { date: '2023-09-01', present: 18, absent: 2, total: 20 },
    { date: '2023-09-08', present: 17, absent: 3, total: 20 },
    { date: '2023-09-15', present: 19, absent: 1, total: 20 },
    { date: '2023-09-22', present: 16, absent: 4, total: 20 },
    { date: '2023-09-29', present: 18, absent: 2, total: 20 },
    { date: '2023-10-06', present: 17, absent: 3, total: 20 },
    { date: '2023-10-13', present: 19, absent: 1, total: 20 },
  ];
  
  // Default grade distribution data
  const defaultGradeData = [
    { grade: 'A', count: 5, color: 'hsl(120, 70%, 50%)' },
    { grade: 'B', count: 8, color: 'hsl(180, 70%, 50%)' },
    { grade: 'C', count: 4, color: 'hsl(240, 70%, 50%)' },
    { grade: 'D', count: 2, color: 'hsl(300, 70%, 50%)' },
    { grade: 'F', count: 1, color: 'hsl(0, 70%, 50%)' },
  ];
  
  // Default assessment performance data
  const defaultAssessmentData = [
    { assessment: 'Quiz 1', average: 82 },
    { assessment: 'Assignment 1', average: 78 },
    { assessment: 'Quiz 2', average: 75 },
    { assessment: 'Assignment 2', average: 80 },
    { assessment: 'Midterm', average: 72 },
  ];
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Time range selector skeleton */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-64" />
        </div>
        
        {/* Metrics skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`metric-skeleton-${index}`}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // Format percentage change
  const formatPercentageChange = (current: number, previous: number) => {
    if (!previous) return null;
    
    const percentageChange = ((current - previous) / previous) * 100;
    const isPositive = percentageChange >= 0;
    
    return (
      <div className={cn(
        "flex items-center text-xs",
        isPositive ? "text-green-600" : "text-red-600"
      )}>
        {isPositive ? (
          <ArrowUpRight className="h-3 w-3 mr-1" />
        ) : (
          <ArrowDownRight className="h-3 w-3 mr-1" />
        )}
        <span>{Math.abs(percentageChange).toFixed(1)}%</span>
      </div>
    );
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Time range selector */}
      <div className="flex justify-end">
        <Tabs 
          value={selectedTimeRange} 
          onValueChange={(value) => handleTimeRangeChange(value as any)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayMetrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className={cn("pb-2", metric.color)}>
              <CardTitle className="text-sm font-medium flex items-center">
                {metric.icon}
                <span className="ml-2">{metric.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof metric.value === 'number' && metric.value % 1 === 0
                  ? metric.value
                  : metric.value.toFixed(1)}
                {metric.label.toLowerCase().includes('rate') && '%'}
              </div>
              {metric.previousValue && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    vs. previous {selectedTimeRange}
                  </span>
                  {formatPercentageChange(metric.value, metric.previousValue)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
              Attendance Trends
            </CardTitle>
            <CardDescription>
              Class attendance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveLine
                data={[
                  {
                    id: 'attendance',
                    color: 'hsl(120, 70%, 50%)',
                    data: defaultAttendanceData.map(d => ({
                      x: d.date,
                      y: (d.present / d.total) * 100
                    }))
                  }
                ]}
                margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                xScale={{ type: 'point' }}
                yScale={{
                  type: 'linear',
                  min: 0,
                  max: 100,
                  stacked: false,
                }}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Date',
                  legendOffset: 40,
                  legendPosition: 'middle',
                  format: (value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Attendance (%)',
                  legendOffset: -40,
                  legendPosition: 'middle'
                }}
                colors={{ scheme: 'category10' }}
                pointSize={10}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                enableGridX={false}
                enableArea={true}
                areaOpacity={0.1}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Grade Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-muted-foreground" />
              Grade Distribution
            </CardTitle>
            <CardDescription>
              Distribution of grades across students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsivePie
                data={defaultGradeData.map(d => ({
                  id: d.grade,
                  label: d.grade,
                  value: d.count,
                  color: d.color
                }))}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#333333"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 20,
                    itemsSpacing: 0,
                    itemWidth: 50,
                    itemHeight: 18,
                    itemTextColor: '#999',
                    itemDirection: 'left-to-right',
                    itemOpacity: 1,
                    symbolSize: 18,
                    symbolShape: 'circle',
                  }
                ]}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Assessment Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <GraduationCap className="h-5 w-5 mr-2 text-muted-foreground" />
              Assessment Performance
            </CardTitle>
            <CardDescription>
              Average scores across assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveBar
                data={defaultAssessmentData}
                keys={['average']}
                indexBy="assessment"
                margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={{ scheme: 'nivo' }}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Assessment',
                  legendPosition: 'middle',
                  legendOffset: 40
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Score',
                  legendPosition: 'middle',
                  legendOffset: -40
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
              Recent Activities
            </CardTitle>
            <CardDescription>
              Latest activities in the class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="mr-3 mt-0.5">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Assignment 2 was posted</p>
                  <p className="text-sm text-muted-foreground">2 days ago</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="mr-3 mt-0.5">
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Quiz 2 grades were released</p>
                  <p className="text-sm text-muted-foreground">4 days ago</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="mr-3 mt-0.5">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">New lecture materials uploaded</p>
                  <p className="text-sm text-muted-foreground">1 week ago</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="mr-3 mt-0.5">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">2 new students enrolled</p>
                  <p className="text-sm text-muted-foreground">1 week ago</p>
                </div>
              </li>
            </ul>
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm">
                View All Activities
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClassDashboard;
