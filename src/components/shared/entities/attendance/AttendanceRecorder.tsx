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
import { Textarea } from '@/components/ui/core/textarea';
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
  Save,
  Loader2,
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
import { format } from 'date-fns';
import {
  UserRole,
  ClassData,
  AttendanceStudentData,
  AttendanceStatus
} from './types';

export interface AttendanceRecorderProps {
  /**
   * Class data
   */
  classData: ClassData;

  /**
   * Array of student data
   */
  students: AttendanceStudentData[];

  /**
   * Date to record attendance for
   * @default current date
   */
  date?: Date;

  /**
   * Existing attendance records
   */
  existingAttendance?: {
    [studentId: string]: {
      status: AttendanceStatus;
      comment?: string;
    };
  };

  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;

  /**
   * Submit callback
   */
  onSubmit: (date: Date, attendance: {
    [studentId: string]: {
      status: AttendanceStatus;
      comment?: string;
    };
  }) => void;

  /**
   * Cancel callback
   */
  onCancel?: () => void;

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
 * AttendanceRecorder component with mobile-first design
 *
 * Features:
 * - Role-specific rendering
 * - Date selection
 * - Bulk actions
 * - Student search
 * - Comments for absences
 *
 * @example
 * ```tsx
 * <AttendanceRecorder
 *   classData={classData}
 *   students={students}
 *   date={new Date()}
 *   existingAttendance={existingAttendance}
 *   userRole={UserRole.TEACHER}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export const AttendanceRecorder: React.FC<AttendanceRecorderProps> = ({
  classData,
  students,
  date = new Date(),
  existingAttendance = {},
  userRole,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  className,
}) => {
  // State for selected date
  const [selectedDate, setSelectedDate] = useState<Date>(date);

  // State for attendance records
  const [attendanceRecords, setAttendanceRecords] = useState<{
    [studentId: string]: {
      status: AttendanceStatus;
      comment?: string;
    };
  }>(existingAttendance);

  // State for search term
  const [searchTerm, setSearchTerm] = useState('');

  // State for calendar open
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Update attendance records when existingAttendance changes
  useEffect(() => {
    setAttendanceRecords(existingAttendance);
  }, [existingAttendance]);

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle status change for a student
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  // Handle comment change for a student
  const handleCommentChange = (studentId: string, comment: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comment,
      },
    }));
  };

  // Handle bulk action to mark all students with a status
  const handleBulkAction = (status: AttendanceStatus) => {
    const newRecords = { ...attendanceRecords };

    filteredStudents.forEach(student => {
      newRecords[student.id] = {
        ...newRecords[student.id],
        status,
      };
    });

    setAttendanceRecords(newRecords);
  };

  // Handle form submission
  const handleSubmit = () => {
    onSubmit(selectedDate, attendanceRecords);
  };

  // Calculate attendance statistics
  const stats = {
    total: filteredStudents.length,
    present: filteredStudents.filter(student =>
      attendanceRecords[student.id]?.status === AttendanceStatus.PRESENT
    ).length,
    absent: filteredStudents.filter(student =>
      attendanceRecords[student.id]?.status === AttendanceStatus.ABSENT
    ).length,
    late: filteredStudents.filter(student =>
      attendanceRecords[student.id]?.status === AttendanceStatus.LATE
    ).length,
    excused: filteredStudents.filter(student =>
      attendanceRecords[student.id]?.status === AttendanceStatus.EXCUSED
    ).length,
    notMarked: filteredStudents.filter(student =>
      !attendanceRecords[student.id]?.status
    ).length,
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
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex justify-between w-full">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardFooter>
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
        <CardTitle>Record Attendance</CardTitle>
        <CardDescription>
          {classData.name} ({classData.code}) - {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Date selector and search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={isLoading}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setIsCalendarOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isLoading}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setSearchTerm('')}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Attendance statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
            <div className="bg-background border rounded-md p-2">
              <div className="text-lg font-semibold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-2">
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">{stats.present}</div>
              <div className="text-xs text-green-600 dark:text-green-400">Present</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-2">
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">{stats.absent}</div>
              <div className="text-xs text-red-600 dark:text-red-400">Absent</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-2">
              <div className="text-lg font-semibold text-amber-600 dark:text-amber-400">{stats.late}</div>
              <div className="text-xs text-amber-600 dark:text-amber-400">Late</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-2">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">{stats.excused}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Excused</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-2">
              <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">{stats.notMarked}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Not Marked</div>
            </div>
          </div>

          {/* Bulk actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleBulkAction(AttendanceStatus.PRESENT)}
              disabled={isLoading}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark All Present
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction(AttendanceStatus.ABSENT)}
              disabled={isLoading}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Mark All Absent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction(AttendanceStatus.LATE)}
              disabled={isLoading}
            >
              <Clock className="h-4 w-4 mr-1" />
              Mark All Late
            </Button>
          </div>

          {/* Student list */}
          <div className="space-y-4">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No students found matching your search.' : 'No students in this class.'}
              </div>
            ) : (
              filteredStudents.map(student => (
                <div key={student.id} className="border rounded-md p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">{student.email}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={attendanceRecords[student.id]?.status === AttendanceStatus.PRESENT ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange(student.id, AttendanceStatus.PRESENT)}
                        disabled={isLoading}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Present
                      </Button>
                      <Button
                        variant={attendanceRecords[student.id]?.status === AttendanceStatus.ABSENT ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange(student.id, AttendanceStatus.ABSENT)}
                        disabled={isLoading}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Absent
                      </Button>
                      <Button
                        variant={attendanceRecords[student.id]?.status === AttendanceStatus.LATE ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange(student.id, AttendanceStatus.LATE)}
                        disabled={isLoading}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Late
                      </Button>
                      <Button
                        variant={attendanceRecords[student.id]?.status === AttendanceStatus.EXCUSED ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange(student.id, AttendanceStatus.EXCUSED)}
                        disabled={isLoading}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Excused
                      </Button>
                    </div>
                  </div>

                  {/* Comment field for absent or excused students */}
                  {(attendanceRecords[student.id]?.status === AttendanceStatus.ABSENT ||
                    attendanceRecords[student.id]?.status === AttendanceStatus.EXCUSED) && (
                    <div className="mt-3">
                      <Label htmlFor={`comment-${student.id}`} className="text-sm">
                        Comment
                      </Label>
                      <Textarea
                        id={`comment-${student.id}`}
                        placeholder="Add a comment..."
                        value={attendanceRecords[student.id]?.comment || ''}
                        onChange={(e) => handleCommentChange(student.id, e.target.value)}
                        className="mt-1"
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          onClick={handleSubmit}
          disabled={isLoading || filteredStudents.length === 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Attendance
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AttendanceRecorder;
