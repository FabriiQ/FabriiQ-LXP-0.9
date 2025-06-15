'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Calendar, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AttendanceStudentView } from './AttendanceStudentView';

// Define types for the data structures
interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface Enrollment {
  id: string;
  classId: string;
  // Add other enrollment properties as needed
}

interface Student {
  id: string;
  user: User;
  enrollmentNumber: string;
  enrollments: Enrollment[];
  attendanceRate?: number;
  // Add other student properties as needed
}

interface ClassItem {
  id: string;
  name: string;
  // Add other class properties as needed
}

interface StudentsData {
  students?: Student[];
}

interface ClassesData {
  items?: ClassItem[];
  classes?: ClassItem[];
  total?: number;
}

interface StudentAttendanceSelectorProps {
  campusId: string;
}

export function StudentAttendanceSelector({ campusId }: StudentAttendanceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Fetch students for this campus
  const { data: studentsData, isLoading: isLoadingStudents } = api.student.getAllStudentsByCampus.useQuery(
    { campusId },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  ) as { data: StudentsData | undefined, isLoading: boolean };

  // Fetch classes for this campus
  const { data: classesData } = api.campus.getClasses.useQuery(
    { campusId, status: 'ACTIVE', page: 1, pageSize: 100 },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  ) as { data: ClassesData | undefined };

  // Filter students based on search term and selected class
  const filteredStudents = studentsData?.students?.filter(
    (student: Student) => {
      const matchesSearch = searchTerm === '' ||
        student.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.enrollmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass = selectedClass === null ||
        student.enrollments.some((enrollment: Enrollment) => enrollment.classId === selectedClass);

      return matchesSearch && matchesClass;
    }
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Student Attendance</h2>
          <p className="text-muted-foreground">View and manage attendance by student</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative w-full md:w-auto md:min-w-[250px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={selectedClass || 'all-classes'} onValueChange={(value) => setSelectedClass(value === 'all-classes' ? null : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-classes">All Classes</SelectItem>
              {classesData?.classes?.map((classItem: ClassItem) => (
                <SelectItem key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd')} - {format(dateRange.to, 'LLL dd')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd')
                  )
                ) : (
                  <span>Date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                // initialFocus is deprecated but we'll keep it for now
                mode="range"
                defaultMonth={dateRange.from || undefined}
                selected={{
                  from: dateRange.from || undefined,
                  to: dateRange.to || undefined,
                }}
                onSelect={(range) => {
                  setDateRange({
                    from: range?.from || null,
                    to: range?.to || null,
                  });
                  if (range?.to) {
                    setIsCalendarOpen(false);
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {(dateRange.from || dateRange.to) && (
            <Button variant="ghost" size="icon" onClick={() => setDateRange({ from: null, to: null })}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          )}
        </div>
      </div>

      {selectedStudent ? (
        <AttendanceStudentView
          studentId={selectedStudent}
          classId={selectedClass}
          dateRange={dateRange}
          onBack={() => setSelectedStudent(null)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoadingStudents ? (
            Array(6).fill(0).map((_, index) => (
              <Skeleton key={index} className="h-[150px] w-full" />
            ))
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student: Student) => (
              <Card
                key={student.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedStudent(student.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {student.user.name?.charAt(0) || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{student.user.name}</CardTitle>
                        <CardDescription>{student.enrollmentNumber}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{student.user.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Classes:</span>
                      <span className="font-medium">{student.enrollments.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Attendance Rate:</span>
                      <span className="font-medium">
                        {student.attendanceRate ? `${Math.round(student.attendanceRate)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="py-10">
                  <div className="text-center text-muted-foreground">
                    <p>No students found matching your criteria</p>
                    <Button variant="outline" className="mt-4" onClick={() => {
                      setSearchTerm('');
                      setSelectedClass(null);
                    }}>
                      Clear filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
