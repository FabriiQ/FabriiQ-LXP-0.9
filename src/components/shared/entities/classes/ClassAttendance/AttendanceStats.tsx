'use client';

import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { UserRole, ClassData } from '../types';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';

export interface AttendanceStatsData {
  overall: {
    present: number;
    absent: number;
    excused: number;
    total: number;
    rate: number;
  };
  trend: Array<{
    date: Date;
    present: number;
    absent: number;
    excused: number;
    total: number;
    rate: number;
  }>;
  byStudent: Array<{
    studentId: string;
    studentName: string;
    present: number;
    absent: number;
    excused: number;
    total: number;
    rate: number;
  }>;
  byWeekday: Array<{
    weekday: string;
    rate: number;
  }>;
}

export interface AttendanceStatsProps {
  /**
   * Class data
   */
  classData: ClassData;
  
  /**
   * Attendance statistics data
   */
  stats: AttendanceStatsData;
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Date range for the statistics
   */
  dateRange: {
    start: Date;
    end: Date;
  };
  
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
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * AttendanceStats component with mobile-first design
 * 
 * Features:
 * - Role-specific rendering
 * - Overall attendance statistics
 * - Attendance trend chart
 * - Student attendance breakdown
 * - Weekday attendance patterns
 * 
 * @example
 * ```tsx
 * <AttendanceStats 
 *   classData={classData}
 *   stats={stats}
 *   userRole={UserRole.TEACHER}
 *   dateRange={{ start: new Date(2023, 0, 1), end: new Date(2023, 0, 31) }}
 * />
 * ```
 */
export const AttendanceStats: React.FC<AttendanceStatsProps> = ({
  classData,
  stats,
  userRole,
  dateRange,
  isLoading = false,
  error,
  className,
}) => {
  // Render loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
        
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
  
  // Prepare data for trend chart
  const trendData = [
    {
      id: 'attendance-rate',
      color: 'hsl(210, 70%, 50%)',
      data: stats.trend.map(day => ({
        x: format(new Date(day.date), 'MMM dd'),
        y: day.rate
      }))
    }
  ];
  
  // Prepare data for status pie chart
  const pieData = [
    {
      id: 'present',
      label: 'Present',
      value: stats.overall.present,
      color: 'hsl(120, 70%, 50%)'
    },
    {
      id: 'absent',
      label: 'Absent',
      value: stats.overall.absent,
      color: 'hsl(0, 70%, 50%)'
    },
    {
      id: 'excused',
      label: 'Excused',
      value: stats.overall.excused,
      color: 'hsl(40, 70%, 50%)'
    }
  ];
  
  // Prepare data for weekday bar chart
  const weekdayData = stats.byWeekday.map(day => ({
    weekday: day.weekday,
    rate: day.rate
  }));
  
  // Sort students by attendance rate
  const sortedStudents = [...stats.byStudent].sort((a, b) => b.rate - a.rate);
  
  // Get top 5 and bottom 5 students
  const topStudents = sortedStudents.slice(0, 5);
  const bottomStudents = sortedStudents.slice(-5).reverse();
  
  // Check if user can see student details
  const canSeeStudentDetails = [
    UserRole.SYSTEM_ADMIN,
    UserRole.CAMPUS_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  ].includes(userRole);
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header card */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Statistics</CardTitle>
          <CardDescription>
            {classData.name} ({classData.code}) - {format(new Date(dateRange.start), 'PPP')} to {format(new Date(dateRange.end), 'PPP')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall attendance rate */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl font-bold mb-2">
                    {stats.overall.rate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Overall Attendance Rate
                  </div>
                  <div className="flex items-center text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{stats.overall.total} Records</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Present/Absent/Excused counts */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <span>Present</span>
                    </div>
                    <Badge variant="outline">{stats.overall.present}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 mr-2 text-red-500" />
                      <span>Absent</span>
                    </div>
                    <Badge variant="outline">{stats.overall.absent}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-amber-500" />
                      <span>Excused</span>
                    </div>
                    <Badge variant="outline">{stats.overall.excused}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Date range info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Calendar className="h-8 w-8 mb-2 text-muted-foreground" />
                  <div className="text-sm font-medium mb-1">Date Range</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(dateRange.start), 'MMM d, yyyy')} - {format(new Date(dateRange.end), 'MMM d, yyyy')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.round((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24) + 1)} days
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance trend chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveLine
                data={trendData}
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
                  legendPosition: 'middle'
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Attendance Rate (%)',
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
        
        {/* Attendance status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsivePie
                data={pieData}
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
                    itemWidth: 80,
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
        
        {/* Weekday attendance patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendance by Day of Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveBar
                data={weekdayData}
                keys={['rate']}
                indexBy="weekday"
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
                  tickRotation: 0,
                  legend: 'Day of Week',
                  legendPosition: 'middle',
                  legendOffset: 40
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Attendance Rate (%)',
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
        
        {/* Student attendance rankings */}
        {canSeeStudentDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Attendance Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Top 5 students */}
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                    Highest Attendance
                  </h3>
                  <div className="space-y-2">
                    {topStudents.map((student, index) => (
                      <div key={student.studentId} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-2 w-6 h-6 flex items-center justify-center p-0">
                            {index + 1}
                          </Badge>
                          <span className="font-medium">{student.studentName}</span>
                        </div>
                        <Badge variant={student.rate >= 90 ? 'success' : 'secondary'}>
                          {student.rate.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Bottom 5 students */}
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                    Lowest Attendance
                  </h3>
                  <div className="space-y-2">
                    {bottomStudents.map((student, index) => (
                      <div key={student.studentId} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-2 w-6 h-6 flex items-center justify-center p-0">
                            {stats.byStudent.length - index}
                          </Badge>
                          <span className="font-medium">{student.studentName}</span>
                        </div>
                        <Badge variant={student.rate < 70 ? 'destructive' : 'secondary'}>
                          {student.rate.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AttendanceStats;
