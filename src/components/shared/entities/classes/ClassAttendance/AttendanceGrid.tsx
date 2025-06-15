'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Edit,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { UserRole, ClassData } from '../types';

export interface AttendanceRecord {
  date: Date;
  studentId: string;
  status: 'present' | 'absent' | 'excused';
  comment?: string;
}

export interface AttendanceStudent {
  id: string;
  name: string;
  email?: string;
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
  viewMode?: 'day' | 'week' | 'month';
  
  /**
   * Edit callback
   */
  onEdit?: (date: Date) => void;
  
  /**
   * Date range change callback
   */
  onDateRangeChange?: (range: { start: Date; end: Date }) => void;
  
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
  isLoading = false,
  error,
  className,
}) => {
  // Initialize date range if not provided
  const today = new Date();
  const initialStart = dateRange?.start || startOfWeek(today, { weekStartsOn: 1 });
  const initialEnd = dateRange?.end || endOfWeek(today, { weekStartsOn: 1 });
  
  // State for current date range
  const [currentRange, setCurrentRange] = useState<{ start: Date; end: Date }>({
    start: initialStart,
    end: initialEnd,
  });
  
  // State for search term
  const [searchTerm, setSearchTerm] = useState('');
  
  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle previous period
  const handlePrevious = () => {
    let newStart: Date;
    let newEnd: Date;
    
    switch (viewMode) {
      case 'day':
        newStart = subDays(currentRange.start, 1);
        newEnd = subDays(currentRange.end, 1);
        break;
      case 'week':
        newStart = subDays(currentRange.start, 7);
        newEnd = subDays(currentRange.end, 7);
        break;
      case 'month':
        // Approximate month as 30 days
        newStart = subDays(currentRange.start, 30);
        newEnd = subDays(currentRange.end, 30);
        break;
      default:
        newStart = subDays(currentRange.start, 7);
        newEnd = subDays(currentRange.end, 7);
    }
    
    setCurrentRange({ start: newStart, end: newEnd });
    
    if (onDateRangeChange) {
      onDateRangeChange({ start: newStart, end: newEnd });
    }
  };
  
  // Handle next period
  const handleNext = () => {
    let newStart: Date;
    let newEnd: Date;
    
    switch (viewMode) {
      case 'day':
        newStart = addDays(currentRange.start, 1);
        newEnd = addDays(currentRange.end, 1);
        break;
      case 'week':
        newStart = addDays(currentRange.start, 7);
        newEnd = addDays(currentRange.end, 7);
        break;
      case 'month':
        // Approximate month as 30 days
        newStart = addDays(currentRange.start, 30);
        newEnd = addDays(currentRange.end, 30);
        break;
      default:
        newStart = addDays(currentRange.start, 7);
        newEnd = addDays(currentRange.end, 7);
    }
    
    setCurrentRange({ start: newStart, end: newEnd });
    
    if (onDateRangeChange) {
      onDateRangeChange({ start: newStart, end: newEnd });
    }
  };
  
  // Handle today
  const handleToday = () => {
    let newStart: Date;
    let newEnd: Date;
    
    switch (viewMode) {
      case 'day':
        newStart = today;
        newEnd = today;
        break;
      case 'week':
        newStart = startOfWeek(today, { weekStartsOn: 1 });
        newEnd = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'month':
        // Simplified month view (30 days)
        newStart = subDays(today, 15);
        newEnd = addDays(today, 14);
        break;
      default:
        newStart = startOfWeek(today, { weekStartsOn: 1 });
        newEnd = endOfWeek(today, { weekStartsOn: 1 });
    }
    
    setCurrentRange({ start: newStart, end: newEnd });
    
    if (onDateRangeChange) {
      onDateRangeChange({ start: newStart, end: newEnd });
    }
  };
  
  // Handle edit
  const handleEditClick = (date: Date) => {
    if (onEdit) {
      onEdit(date);
    }
  };
  
  // Get days in current range
  const daysInRange = eachDayOfInterval({
    start: currentRange.start,
    end: currentRange.end,
  });
  
  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      (student.email && student.email.toLowerCase().includes(searchLower))
    );
  });
  
  // Check if user can edit attendance
  const canEditAttendance = [
    UserRole.SYSTEM_ADMIN,
    UserRole.CAMPUS_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  ].includes(userRole);
  
  // Get attendance status for a student on a specific date
  const getAttendanceStatus = (studentId: string, date: Date) => {
    const record = attendance.find(a => 
      a.studentId === studentId && 
      format(new Date(a.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    return record?.status || null;
  };
  
  // Get attendance comment for a student on a specific date
  const getAttendanceComment = (studentId: string, date: Date) => {
    const record = attendance.find(a => 
      a.studentId === studentId && 
      format(new Date(a.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    return record?.comment || '';
  };
  
  // Render status cell
  const renderStatusCell = (status: 'present' | 'absent' | 'excused' | null) => {
    if (status === null) {
      return <span className="text-muted-foreground">-</span>;
    }
    
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'excused':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <span className="text-muted-foreground">-</span>;
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
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
              </div>
              <Skeleton className="h-10 w-48" />
            </div>
            
            <div className="overflow-x-auto">
              <Skeleton className="h-64 w-full" />
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
    <Card className={className}>
      <CardHeader>
        <CardTitle>Attendance Grid</CardTitle>
        <CardDescription>
          {classData.name} ({classData.code}) - {format(currentRange.start, 'PPP')} to {format(currentRange.end, 'PPP')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Navigation controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleToday}>
                <Calendar className="h-4 w-4 mr-2" />
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search students..."
                className="pl-9 w-full sm:w-64"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          
          {/* Attendance legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
              <span>Present</span>
            </div>
            <div className="flex items-center">
              <XCircle className="h-4 w-4 mr-1 text-red-500" />
              <span>Absent</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-amber-500" />
              <span>Excused</span>
            </div>
            <div className="flex items-center">
              <span className="text-muted-foreground mr-1">-</span>
              <span>Not Recorded</span>
            </div>
          </div>
          
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center border rounded-md">
              <p className="text-muted-foreground">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Student</TableHead>
                    {daysInRange.map((day) => (
                      <TableHead key={format(day, 'yyyy-MM-dd')} className="text-center min-w-[100px]">
                        <div className="flex flex-col items-center">
                          <span>{format(day, 'EEE')}</span>
                          <span className="text-xs text-muted-foreground">{format(day, 'MMM d')}</span>
                          {canEditAttendance && onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 mt-1"
                              onClick={() => handleEditClick(day)}
                            >
                              <Edit className="h-3 w-3" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      {daysInRange.map((day) => {
                        const status = getAttendanceStatus(student.id, day);
                        const comment = getAttendanceComment(student.id, day);
                        
                        return (
                          <TableCell 
                            key={format(day, 'yyyy-MM-dd')} 
                            className="text-center"
                            title={comment ? `Comment: ${comment}` : undefined}
                          >
                            {renderStatusCell(status)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceGrid;
