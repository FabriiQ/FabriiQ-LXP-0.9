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
  Calendar,
  Download,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import {
  UserRole,
  AttendanceStatus,
  AttendanceRecord
} from './types';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
// @ts-ignore - Type issues with Nivo Calendar
import { ResponsiveCalendar } from '@nivo/calendar';

export interface StudentData {
  id: string;
  userId: string;
  name: string;
  email: string;
  profileImage?: string;
}

export interface ClassAttendanceData {
  classId: string;
  className: string;
  classCode: string;
  attendanceRate: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

export interface StudentAttendanceProfileProps {
  /**
   * Student data
   */
  student: StudentData;

  /**
   * Attendance records
   */
  attendance: AttendanceRecord[];

  /**
   * Class attendance data
   */
  classAttendance: ClassAttendanceData[];

  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;

  /**
   * Date range to display
   */
  dateRange: {
    start: Date;
    end: Date;
  };

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
 * StudentAttendanceProfile component with mobile-first design
 *
 * Features:
 * - Overall attendance statistics
 * - Attendance calendar heatmap
 * - Attendance by class
 * - Attendance trend
 *
 * @example
 * ```tsx
 * <StudentAttendanceProfile
 *   student={student}
 *   attendance={attendance}
 *   classAttendance={classAttendance}
 *   userRole={UserRole.TEACHER}
 *   dateRange={{ start: new Date(2023, 0, 1), end: new Date(2023, 0, 31) }}
 * />
 * ```
 */
export const StudentAttendanceProfile: React.FC<StudentAttendanceProfileProps> = ({
  student,
  attendance,
  classAttendance,
  userRole,
  dateRange,
  onExport,
  isLoading = false,
  error,
  className,
}) => {
  // Calculate overall attendance statistics
  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === AttendanceStatus.PRESENT).length,
    absent: attendance.filter(a => a.status === AttendanceStatus.ABSENT).length,
    late: attendance.filter(a => a.status === AttendanceStatus.LATE).length,
    excused: attendance.filter(a => a.status === AttendanceStatus.EXCUSED).length,
  };

  const attendanceRate = stats.total > 0
    ? ((stats.present + stats.late) / stats.total) * 100
    : 0;

  // Prepare data for calendar heatmap
  const calendarData = attendance.map(record => {
    const dateStr = record.date instanceof Date
      ? format(record.date, 'yyyy-MM-dd')
      : format(parseISO(String(record.date)), 'yyyy-MM-dd');

    return {
      day: dateStr,
      value: record.status === AttendanceStatus.PRESENT ? 1 :
             record.status === AttendanceStatus.LATE ? 0.5 :
             record.status === AttendanceStatus.EXCUSED ? 0.25 : 0
    };
  });

  // Prepare data for pie chart
  const pieData = [
    {
      id: 'present',
      label: 'Present',
      value: stats.present,
      color: 'hsl(120, 70%, 50%)'
    },
    {
      id: 'absent',
      label: 'Absent',
      value: stats.absent,
      color: 'hsl(0, 70%, 50%)'
    },
    {
      id: 'late',
      label: 'Late',
      value: stats.late,
      color: 'hsl(40, 70%, 50%)'
    },
    {
      id: 'excused',
      label: 'Excused',
      value: stats.excused,
      color: 'hsl(210, 70%, 50%)'
    }
  ];

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
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
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

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
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

  return (
    <div className={cn("space-y-6", className)}>
      {/* Student profile card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Student Attendance Profile</CardTitle>
              <CardDescription>
                {format(new Date(dateRange.start), 'PPP')} to {format(new Date(dateRange.end), 'PPP')}
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
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
              {student.profileImage ? (
                <img
                  src={student.profileImage}
                  alt={student.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{student.name}</h3>
              <p className="text-muted-foreground">{student.email}</p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
                  {attendanceRate.toFixed(1)}% Attendance Rate
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-3">
              <div className="flex items-center mb-1">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Present</span>
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.present}</div>
              <div className="text-xs text-green-600 dark:text-green-400">
                {stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}%
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3">
              <div className="flex items-center mb-1">
                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Absent</span>
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.absent}</div>
              <div className="text-xs text-red-600 dark:text-red-400">
                {stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(1) : 0}%
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
              <div className="flex items-center mb-1">
                <Clock className="h-4 w-4 text-amber-500 mr-1" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Late</span>
              </div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.late}</div>
              <div className="text-xs text-amber-600 dark:text-amber-400">
                {stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(1) : 0}%
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <div className="flex items-center mb-1">
                <AlertCircle className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Excused</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.excused}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                {stats.total > 0 ? ((stats.excused / stats.total) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance distribution pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {stats.total > 0 ? (
                <ResponsivePie
                  data={pieData}
                  margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
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
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No attendance data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance by class */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attendance by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classAttendance.length > 0 ? (
                classAttendance.map(classData => (
                  <div key={classData.classId} className="border rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-medium">{classData.className}</h4>
                        <p className="text-xs text-muted-foreground">{classData.classCode}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{classData.attendanceRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                          {classData.present} / {classData.total} classes
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${classData.attendanceRate}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No class attendance data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance calendar heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attendance Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {calendarData.length > 0 ? (
              <ResponsiveCalendar
                data={calendarData}
                from={dateRange.start.toISOString().split('T')[0]}
                to={dateRange.end.toISOString().split('T')[0]}
                emptyColor="#eeeeee"
                colors={['#ff6b6b', '#f9c74f', '#90be6d']}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                yearSpacing={40}
                monthBorderColor="#ffffff"
                dayBorderWidth={2}
                dayBorderColor="#ffffff"
                legends={[
                  {
                    anchor: 'bottom-right',
                    direction: 'row',
                    translateY: 36,
                    itemCount: 4,
                    itemWidth: 42,
                    itemHeight: 36,
                    itemsSpacing: 14,
                    itemDirection: 'right-to-left'
                  }
                ]}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No attendance data available for the selected date range
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAttendanceProfile;
