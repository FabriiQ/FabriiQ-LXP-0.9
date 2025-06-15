'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/core/card';
import { Button } from '@/components/ui/core/button';
import { Input } from '@/components/ui/core/input';
import { Label } from '@/components/ui/core/label';
import { Skeleton } from '@/components/ui/core/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Download,
  X,
  ArrowUp
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/core/popover';
import { Calendar as CalendarComponent } from '@/components/ui/core/calendar';
import { cn } from '@/lib/utils';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths
} from 'date-fns';
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';
import {
  UserRole,
  ClassData,
  AttendanceStatus,
  AttendanceRecord,
  ViewMode
} from './types';

export interface AttendanceStudent {
  id: string;
  userId: string;
  name: string;
  email: string;
  profileImage?: string;
}

export interface AttendanceGridProps {
  /**
   * Class data
   */
  classData: ClassData;

  /**
   * Array of student data
   */
  students: AttendanceStudent[];

  /**
   * Array of attendance records
   */
  attendance: AttendanceRecord[];

  /**
   * Date range to display
   * @default current week
   */
  dateRange?: {
    start: Date;
    end: Date;
  };

  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;

  /**
   * View mode
   * @default 'week'
   */
  viewMode?: ViewMode;

  /**
   * Edit callback
   */
  onEdit?: (date: Date) => void;

  /**
   * Date range change callback
   */
  onDateRangeChange?: (range: { start: Date; end: Date }) => void;

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
 * AttendanceGrid component with mobile-first design
 *
 * Features:
 * - Role-specific rendering
 * - Multiple view modes (day, week, month)
 * - Date range navigation
 * - Student search
 * - Color-coded attendance status
 *
 * @example
 * ```tsx
 * <AttendanceGrid
 *   classData={classData}
 *   students={students}
 *   attendance={attendance}
 *   userRole={UserRole.TEACHER}
 *   onEdit={handleEdit}
 * />
 * ```
 */
export const AttendanceGrid: React.FC<AttendanceGridProps> = ({
  classData,
  students,
  attendance,
  dateRange,
  userRole,
  viewMode = 'week',
  onEdit,
  onDateRangeChange,
  onExport,
  isLoading = false,
  error,
  className,
}) => {
  // Initialize date range if not provided
  const today = new Date();
  const initialStart = dateRange?.start || startOfWeek(today, { weekStartsOn: 1 });
  const initialEnd = dateRange?.end || endOfWeek(today, { weekStartsOn: 1 });

  // State for current view
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(viewMode);
  const [currentDateRange, setCurrentDateRange] = useState<{ start: Date; end: Date }>({
    start: initialStart,
    end: initialEnd,
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Update date range when view mode changes
  useEffect(() => {
    const newRange = getDateRangeForViewMode(today, currentViewMode);
    setCurrentDateRange(newRange);
    if (onDateRangeChange) {
      onDateRangeChange(newRange);
    }
  }, [currentViewMode]);

  // Update parent component when date range changes
  useEffect(() => {
    if (onDateRangeChange) {
      onDateRangeChange(currentDateRange);
    }
  }, [currentDateRange]);

  // Get date range for view mode
  const getDateRangeForViewMode = (date: Date, mode: ViewMode): { start: Date; end: Date } => {
    switch (mode) {
      case 'day':
        return { start: date, end: date };
      case 'week':
        return {
          start: startOfWeek(date, { weekStartsOn: 1 }),
          end: endOfWeek(date, { weekStartsOn: 1 }),
        };
      case 'month':
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
        };
    }
  };

  // Navigate to previous period
  const goToPrevious = () => {
    switch (currentViewMode) {
      case 'day':
        setCurrentDateRange(prev => ({
          start: subDays(prev.start, 1),
          end: subDays(prev.end, 1),
        }));
        break;
      case 'week':
        setCurrentDateRange(prev => ({
          start: subWeeks(prev.start, 1),
          end: subWeeks(prev.end, 1),
        }));
        break;
      case 'month':
        setCurrentDateRange(prev => ({
          start: subMonths(prev.start, 1),
          end: subMonths(prev.end, 1),
        }));
        break;
    }
  };

  // Navigate to next period
  const goToNext = () => {
    switch (currentViewMode) {
      case 'day':
        setCurrentDateRange(prev => ({
          start: addDays(prev.start, 1),
          end: addDays(prev.end, 1),
        }));
        break;
      case 'week':
        setCurrentDateRange(prev => ({
          start: addWeeks(prev.start, 1),
          end: addWeeks(prev.end, 1),
        }));
        break;
      case 'month':
        setCurrentDateRange(prev => ({
          start: addMonths(prev.start, 1),
          end: addMonths(prev.end, 1),
        }));
        break;
    }
  };

  // Go to today
  const goToToday = () => {
    const newRange = getDateRangeForViewMode(today, currentViewMode);
    setCurrentDateRange(newRange);
  };

  // Get days to display
  const daysToDisplay = eachDayOfInterval({
    start: currentDateRange.start,
    end: currentDateRange.end,
  });

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get attendance status for a student on a specific date
  const getAttendanceStatus = (studentId: string, date: Date): AttendanceStatus | undefined => {
    const record = attendance.find(a =>
      a.studentId === studentId && isSameDay(new Date(a.date), date)
    );
    return record?.status;
  };

  // Get color class based on attendance status
  const getStatusColorClass = (status: AttendanceStatus | undefined): string => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case AttendanceStatus.ABSENT:
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case AttendanceStatus.LATE:
        return 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200';
      case AttendanceStatus.EXCUSED:
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: AttendanceStatus | undefined): React.ReactNode => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return <CheckCircle className="h-4 w-4" />;
      case AttendanceStatus.ABSENT:
        return <XCircle className="h-4 w-4" />;
      case AttendanceStatus.LATE:
        return <Clock className="h-4 w-4" />;
      case AttendanceStatus.EXCUSED:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between mb-4">
              <Skeleton className="h-10 w-32" />
              <div className="flex space-x-2">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-max">
                <div className="flex">
                  <Skeleton className="h-10 w-40" />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-20 ml-1" />
                  ))}
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex mt-1">
                    <Skeleton className="h-10 w-40" />
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Skeleton key={j} className="h-10 w-20 ml-1" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Attendance Grid</CardTitle>
        <CardDescription>
          {classData.name} ({classData.code})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex space-x-2">
              <Button
                variant={currentViewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentViewMode('day')}
              >
                Day
              </Button>
              <Button
                variant={currentViewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentViewMode('week')}
              >
                Week
              </Button>
              <Button
                variant={currentViewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentViewMode('month')}
              >
                Month
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex space-x-2">
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
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-8 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Date range display */}
          <div className="text-center font-medium">
            {currentViewMode === 'day' ? (
              format(currentDateRange.start, 'EEEE, MMMM d, yyyy')
            ) : (
              `${format(currentDateRange.start, 'MMM d, yyyy')} - ${format(currentDateRange.end, 'MMM d, yyyy')}`
            )}
          </div>

          {/* Attendance grid */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Header row with dates */}
              <div className="flex">
                <div className="w-40 shrink-0 p-2 font-medium border-b">
                  Student
                </div>
                {daysToDisplay.map(day => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "w-20 shrink-0 p-2 text-center font-medium border-b",
                      isSameDay(day, today) && "bg-primary/10"
                    )}
                  >
                    <div>{format(day, 'EEE')}</div>
                    <div>{format(day, 'MMM d')}</div>
                  </div>
                ))}
              </div>

              {/* Student rows */}
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No students found matching your search.' : 'No students in this class.'}
                </div>
              ) : (
                filteredStudents.map(student => (
                  <div key={student.id} className="flex border-b hover:bg-muted/50">
                    <div className="w-40 shrink-0 p-2">
                      <div className="font-medium truncate">{student.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{student.email}</div>
                    </div>
                    {daysToDisplay.map(day => {
                      const status = getAttendanceStatus(student.id, day);
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "w-20 shrink-0 p-2 flex items-center justify-center",
                            isSameDay(day, today) && "bg-primary/10"
                          )}
                        >
                          <div
                            className={cn(
                              "w-full h-10 rounded-md flex items-center justify-center",
                              getStatusColorClass(status)
                            )}
                          >
                            {getStatusIcon(status)}
                            {onEdit && userRole !== UserRole.STUDENT && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => onEdit(day)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center">
              <div className={cn("w-4 h-4 rounded-sm mr-1", getStatusColorClass(AttendanceStatus.PRESENT))}></div>
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center">
              <div className={cn("w-4 h-4 rounded-sm mr-1", getStatusColorClass(AttendanceStatus.ABSENT))}></div>
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center">
              <div className={cn("w-4 h-4 rounded-sm mr-1", getStatusColorClass(AttendanceStatus.LATE))}></div>
              <span className="text-sm">Late</span>
            </div>
            <div className="flex items-center">
              <div className={cn("w-4 h-4 rounded-sm mr-1", getStatusColorClass(AttendanceStatus.EXCUSED))}></div>
              <span className="text-sm">Excused</span>
            </div>
            <div className="flex items-center">
              <div className={cn("w-4 h-4 rounded-sm mr-1", getStatusColorClass(undefined))}></div>
              <span className="text-sm">Not Marked</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceGrid;
