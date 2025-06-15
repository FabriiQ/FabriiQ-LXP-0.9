'use client';

import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/core/card';
import { Button } from '@/components/ui/core/button';
import { Skeleton } from '@/components/ui/core/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  Calendar,
  ArrowUp,
  ArrowDown,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  UserRole, 
  ClassData, 
  AttendanceStatsData,
  AnalyticsLevel
} from './types';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';

export interface AttendanceAnalyticsProps {
  /**
   * Title for the analytics dashboard
   */
  title: string;
  
  /**
   * Description for the analytics dashboard
   */
  description?: string;
  
  /**
   * Attendance statistics data
   */
  data: AttendanceStatsData;
  
  /**
   * Level of analytics
   */
  level: AnalyticsLevel;
  
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
   * Array of metrics to display
   * @default ['overall', 'trend', 'byStudent', 'byWeekday']
   */
  metrics?: ('overall' | 'trend' | 'byStudent' | 'byWeekday')[];
  
  /**
   * Export callback
   */
  onExport?: () => void;
  
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
 * AttendanceAnalytics component with mobile-first design
 * 
 * Features:
 * - Role-specific rendering
 * - Multiple analytics levels (campus, program, class, student)
 * - Customizable metrics
 * - Interactive charts
 * 
 * @example
 * ```tsx
 * <AttendanceAnalytics 
 *   title="Class Attendance Analytics"
 *   data={attendanceStats}
 *   level="class"
 *   userRole={UserRole.TEACHER}
 *   dateRange={{ start: new Date(2023, 0, 1), end: new Date(2023, 0, 31) }}
 * />
 * ```
 */
export const AttendanceAnalytics: React.FC<AttendanceAnalyticsProps> = ({
  title,
  description,
  data,
  level,
  userRole,
  dateRange,
  metrics = ['overall', 'trend', 'byStudent', 'byWeekday'],
  onExport,
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
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
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
      data: data.trend.map(day => ({
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
      value: data.overall.present,
      color: 'hsl(120, 70%, 50%)'
    },
    {
      id: 'absent',
      label: 'Absent',
      value: data.overall.absent,
      color: 'hsl(0, 70%, 50%)'
    },
    {
      id: 'late',
      label: 'Late',
      value: data.overall.late,
      color: 'hsl(40, 70%, 50%)'
    },
    {
      id: 'excused',
      label: 'Excused',
      value: data.overall.excused,
      color: 'hsl(210, 70%, 50%)'
    }
  ];
  
  // Prepare data for weekday bar chart
  const weekdayData = data.byWeekday.map(day => ({
    day: day.day,
    rate: day.rate
  }));
  
  // Prepare data for student bar chart
  const studentData = data.byStudent
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 10)
    .map(student => ({
      student: student.studentName,
      rate: student.rate
    }));
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                {description || `${format(new Date(dateRange.start), 'PPP')} to ${format(new Date(dateRange.end), 'PPP')}`}
              </CardDescription>
            </div>
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall attendance rate */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl font-bold mb-2">
                    {data.overall.rate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Overall Attendance Rate
                  </div>
                  <div className="flex items-center text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {data.overall.total} {level === 'student' ? 'Classes' : 'Students'}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Present vs Absent */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium">Present</span>
                    </div>
                    <div className="text-2xl font-bold">{data.overall.present}</div>
                    <div className="text-xs text-muted-foreground">
                      {((data.overall.present / data.overall.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm font-medium">Absent</span>
                    </div>
                    <div className="text-2xl font-bold">{data.overall.absent}</div>
                    <div className="text-xs text-muted-foreground">
                      {((data.overall.absent / data.overall.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-4 w-4 text-amber-500 mr-1" />
                      <span className="text-sm font-medium">Late</span>
                    </div>
                    <div className="text-2xl font-bold">{data.overall.late}</div>
                    <div className="text-xs text-muted-foreground">
                      {((data.overall.late / data.overall.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Trend indicator */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="text-sm font-medium mb-2">Trend</div>
                  
                  {data.trend.length >= 2 && (
                    <>
                      {data.trend[data.trend.length - 1].rate > data.trend[0].rate ? (
                        <div className="flex items-center text-green-500">
                          <ArrowUp className="h-5 w-5 mr-1" />
                          <span className="text-xl font-bold">
                            +{(data.trend[data.trend.length - 1].rate - data.trend[0].rate).toFixed(1)}%
                          </span>
                        </div>
                      ) : data.trend[data.trend.length - 1].rate < data.trend[0].rate ? (
                        <div className="flex items-center text-red-500">
                          <ArrowDown className="h-5 w-5 mr-1" />
                          <span className="text-xl font-bold">
                            {(data.trend[data.trend.length - 1].rate - data.trend[0].rate).toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-muted-foreground">
                          <span className="text-xl font-bold">No Change</span>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        From {format(new Date(data.trend[0].date), 'MMM d')} to {format(new Date(data.trend[data.trend.length - 1].date), 'MMM d')}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      {/* Attendance trend chart */}
      {metrics.includes('trend') && data.trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendance Rate Over Time</CardTitle>
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
                curve="monotoneX"
                axisTop={null}
                axisRight={null}
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
                enableSlices="x"
                theme={{
                  axis: {
                    ticks: {
                      text: {
                        fontSize: 12,
                      },
                    },
                    legend: {
                      text: {
                        fontSize: 12,
                        fontWeight: 'bold',
                      },
                    },
                  },
                  grid: {
                    line: {
                      stroke: '#e2e8f0',
                      strokeWidth: 1,
                    },
                  },
                  crosshair: {
                    line: {
                      stroke: '#64748b',
                      strokeWidth: 1,
                      strokeOpacity: 0.5,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance by status pie chart */}
        {metrics.includes('overall') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance by Status</CardTitle>
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
                  arcLinkLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: 'color' }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                  colors={{ scheme: 'category10' }}
                  legends={[
                    {
                      anchor: 'bottom',
                      direction: 'row',
                      justify: false,
                      translateX: 0,
                      translateY: 20,
                      itemsSpacing: 0,
                      itemWidth: 80,
                      itemHeight: 20,
                      itemTextColor: '#999',
                      itemDirection: 'left-to-right',
                      itemOpacity: 1,
                      symbolSize: 12,
                      symbolShape: 'circle',
                    }
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Attendance by weekday bar chart */}
        {metrics.includes('byWeekday') && data.byWeekday.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance by Day of Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveBar
                  data={weekdayData}
                  keys={['rate']}
                  indexBy="day"
                  margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                  padding={0.3}
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}
                  colors={{ scheme: 'category10' }}
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
                  animate={true}
                  motionStiffness={90}
                  motionDamping={15}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Student attendance bar chart */}
      {metrics.includes('byStudent') && data.byStudent.length > 0 && level !== 'student' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {level === 'class' ? 'Student Attendance Rates' : 'Top 10 Students by Attendance'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveBar
                data={studentData}
                keys={['rate']}
                indexBy="student"
                margin={{ top: 20, right: 20, bottom: 70, left: 60 }}
                padding={0.3}
                layout="horizontal"
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={{ scheme: 'category10' }}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Attendance Rate (%)',
                  legendPosition: 'middle',
                  legendOffset: 40
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Student',
                  legendPosition: 'middle',
                  legendOffset: -50
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                animate={true}
                motionStiffness={90}
                motionDamping={15}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceAnalytics;
