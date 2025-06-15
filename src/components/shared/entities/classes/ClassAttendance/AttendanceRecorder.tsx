'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  CalendarIcon, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Save,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { UserRole, ClassData } from '../types';

export interface AttendanceStudentData {
  id: string;
  userId: string;
  name: string;
  email: string;
  status?: 'present' | 'absent' | 'excused';
  comment?: string;
}

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
      status: 'present' | 'absent' | 'excused';
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
      status: 'present' | 'absent' | 'excused';
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
  
  // State for attendance data
  const [attendance, setAttendance] = useState<{
    [studentId: string]: {
      status: 'present' | 'absent' | 'excused';
      comment?: string;
    };
  }>(existingAttendance);
  
  // State for search term
  const [searchTerm, setSearchTerm] = useState('');
  
  // Update attendance when existingAttendance changes
  useEffect(() => {
    setAttendance(existingAttendance);
  }, [existingAttendance]);
  
  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };
  
  // Handle status change
  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'excused') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };
  
  // Handle comment change
  const handleCommentChange = (studentId: string, comment: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comment,
      },
    }));
  };
  
  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle mark all present
  const handleMarkAllPresent = () => {
    const newAttendance = { ...attendance };
    
    filteredStudents.forEach(student => {
      newAttendance[student.id] = {
        ...newAttendance[student.id],
        status: 'present',
      };
    });
    
    setAttendance(newAttendance);
  };
  
  // Handle mark all absent
  const handleMarkAllAbsent = () => {
    const newAttendance = { ...attendance };
    
    filteredStudents.forEach(student => {
      newAttendance[student.id] = {
        ...newAttendance[student.id],
        status: 'absent',
      };
    });
    
    setAttendance(newAttendance);
  };
  
  // Handle submit
  const handleSubmit = () => {
    onSubmit(selectedDate, attendance);
  };
  
  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    );
  });
  
  // Check if user can edit attendance
  const canEditAttendance = [
    UserRole.SYSTEM_ADMIN,
    UserRole.CAMPUS_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  ].includes(userRole);
  
  // Get attendance status count
  const getStatusCount = (status: 'present' | 'absent' | 'excused') => {
    return Object.values(attendance).filter(a => a.status === status).length;
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
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <Skeleton className="h-10 w-full sm:w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
            
            <div className="border rounded-md">
              <div className="p-4 border-b">
                <Skeleton className="h-10 w-full" />
              </div>
              
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-48 flex-1" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
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
    <Card className={className}>
      <CardHeader>
        <CardTitle>Record Attendance</CardTitle>
        <CardDescription>
          {classData.name} ({classData.code}) - {format(selectedDate, 'PPPP')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Date selector and bulk actions */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-auto justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  disabled={!canEditAttendance}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {canEditAttendance && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleMarkAllPresent}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark All Present
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleMarkAllAbsent}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark All Absent
                </Button>
              </div>
            )}
          </div>
          
          {/* Attendance summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  <span>Present</span>
                </div>
                <Badge variant="outline">{getStatusCount('present')}</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 mr-2 text-red-500" />
                  <span>Absent</span>
                </div>
                <Badge variant="outline">{getStatusCount('absent')}</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-amber-500" />
                  <span>Excused</span>
                </div>
                <Badge variant="outline">{getStatusCount('excused')}</Badge>
              </CardContent>
            </Card>
          </div>
          
          {/* Student list */}
          <div className="border rounded-md">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-9 w-full"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No students found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Student</TableHead>
                      <TableHead className="w-[20%]">Status</TableHead>
                      <TableHead className="w-[40%]">Comment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{student.name}</div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={attendance[student.id]?.status || 'present'}
                            onValueChange={(value) => handleStatusChange(
                              student.id, 
                              value as 'present' | 'absent' | 'excused'
                            )}
                            disabled={!canEditAttendance}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                  Present
                                </div>
                              </SelectItem>
                              <SelectItem value="absent">
                                <div className="flex items-center">
                                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                  Absent
                                </div>
                              </SelectItem>
                              <SelectItem value="excused">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2 text-amber-500" />
                                  Excused
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Textarea
                            placeholder="Add comment (optional)"
                            value={attendance[student.id]?.comment || ''}
                            onChange={(e) => handleCommentChange(student.id, e.target.value)}
                            disabled={
                              !canEditAttendance || 
                              attendance[student.id]?.status === 'present'
                            }
                            className="min-h-[60px]"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          disabled={!canEditAttendance || isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Attendance
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AttendanceRecorder;
