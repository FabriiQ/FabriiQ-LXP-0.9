'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import {
  ChevronLeft,
  Calendar,
  Download,
  Filter,
  Search,
  AlertTriangle,
  Users,
  BookOpen,
  Home,
  FileDown,
  FileText
} from 'lucide-react';
import { api } from "@/trpc/react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import { AttendanceAnalyticsDashboard } from '@/components/attendance/AttendanceAnalyticsDashboard';
import { CourseAttendanceAnalytics } from '@/components/attendance/CourseAttendanceAnalytics';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Pagination } from '@/components/ui/navigation/pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function CampusAttendancePage() {
  const params = useParams();
  const campusId = params?.id as string;

  // State for date range
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // State for active tab
  const [activeTab, setActiveTab] = useState('overview');

  // State for search queries
  const [courseSearch, setCourseSearch] = useState('');
  const [classSearch, setClassSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch campus details
  const { data: campus, isLoading: isLoadingCampus } = api.campus.getById.useQuery(
    { id: campusId },
    { enabled: !!campusId }
  );

  // Fetch classes for this campus
  const { data: classes, isLoading: isLoadingClasses } = api.campus.getClasses.useQuery(
    {
      campusId,
      status: 'ACTIVE',
      search: classSearch,
      page: 1,
      pageSize: 100
    },
    { enabled: !!campusId }
  );

  // Fetch students with attendance issues
  const { data: studentsWithIssues, isLoading: isLoadingStudentIssues } = api.student.getStudentsWithAttendanceIssues.useQuery(
    {
      campusId,
      threshold: 75, // Students with less than 75% attendance
      startDate: dateRange.from,
      endDate: dateRange.to
    },
    {
      enabled: !!campusId && !!dateRange.from && !!dateRange.to,
      refetchOnWindowFocus: false
    }
  );

  // Create a unique key for each student by combining id and other properties - memoized to prevent re-renders
  const studentsWithUniqueKeys = useMemo(() => {
    return studentsWithIssues?.map((student, index) => ({
      ...student,
      uniqueKey: `${student.id}-${index}`
    })) || [];
  }, [studentsWithIssues]);

  // Filter classes based on search
  const filteredClasses = classes?.data || [];

  // Filter students with issues based on search
  const filteredStudentsWithIssues = studentsWithUniqueKeys.filter(student =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.enrollmentNumber.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Paginate students
  const totalPages = Math.ceil(filteredStudentsWithIssues.length / itemsPerPage);
  const paginatedStudents = filteredStudentsWithIssues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export students data
  const exportStudentsData = (exportFormat: 'CSV' | 'PDF') => {
    if (filteredStudentsWithIssues.length === 0) return;

    // Use the imported format function from date-fns
    const formatDate = (date: Date | null | undefined, formatString: string) => {
      if (!date) return 'Never';
      return format(new Date(date), formatString);
    };

    if (exportFormat === 'CSV') {
      // Create CSV content
      const headers = ['Name', 'Enrollment Number', 'Class', 'Attendance Rate (%)', 'Last Attendance'];
      const rows = filteredStudentsWithIssues.map(student => [
        student.name,
        student.enrollmentNumber,
        student.className,
        student.attendanceRate.toString(),
        student.lastAttendance ? formatDate(student.lastAttendance, 'MMM dd, yyyy') : 'Never'
      ]);

      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.join(',') + '\n';
      });

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `students_attendance_issues_${formatDate(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (exportFormat === 'PDF') {
      // For PDF, we would typically use a library like jsPDF
      // This is a simplified version that opens a new window with printable content
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const html = `
        <html>
          <head>
            <title>Students Needing Attendance Attention</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { margin-bottom: 20px; }
              .footer { margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Students Needing Attendance Attention</h1>
              <p>Campus: ${campus?.name || 'Unknown'}</p>
              <p>Date Range: ${dateRange.from ? formatDate(dateRange.from, 'MMM dd, yyyy') : 'N/A'} - ${dateRange.to ? formatDate(dateRange.to, 'MMM dd, yyyy') : 'N/A'}</p>
              <p>Generated: ${formatDate(new Date(), 'MMM dd, yyyy HH:mm')}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Enrollment Number</th>
                  <th>Class</th>
                  <th>Attendance Rate (%)</th>
                  <th>Last Attendance</th>
                </tr>
              </thead>
              <tbody>
                ${filteredStudentsWithIssues.map(student => `
                  <tr>
                    <td>${student.name}</td>
                    <td>${student.enrollmentNumber}</td>
                    <td>${student.className}</td>
                    <td>${student.attendanceRate}%</td>
                    <td>${student.lastAttendance ? formatDate(student.lastAttendance, 'MMM dd, yyyy') : 'Never'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>Total Students: ${filteredStudentsWithIssues.length}</p>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/admin/system/campuses/${campusId}`}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campus Attendance</h1>
          {isLoadingCampus ? (
            <div className="text-muted-foreground">
              <Skeleton className="h-5 w-40" />
            </div>
          ) : (
            <p className="text-muted-foreground">
              Attendance management for {campus?.name || 'Campus'}
            </p>
          )}
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Date Range:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full md:w-auto">
              <DatePicker
                value={dateRange.from}
                onChange={(date) => setDateRange({ ...dateRange, from: date })}
                placeholder="From date"
                label="From"
                className="w-full"
              />
              <DatePicker
                value={dateRange.to}
                onChange={(date) => setDateRange({ ...dateRange, to: date })}
                placeholder="To date"
                label="To"
                className="w-full"
                fromDate={dateRange.from}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">By Course</TabsTrigger>
          <TabsTrigger value="classes">By Class</TabsTrigger>
          <TabsTrigger value="attention">Needs Attention</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <AttendanceAnalyticsDashboard campusId={campusId} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Students Needing Attention</CardTitle>
                <CardDescription>Students with low attendance rates</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStudentIssues ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">{filteredStudentsWithIssues.length}</div>
                      <div className="text-sm text-muted-foreground">Students below 75%</div>
                    </div>
                    <AlertTriangle className="h-10 w-10 text-amber-500" />
                  </div>
                )}
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('attention')}>
                    View Students
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Course Attendance</CardTitle>
                <CardDescription>Average attendance by course</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingClasses ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">
                        {classes?.total || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Active courses</div>
                    </div>
                    <BookOpen className="h-10 w-10 text-blue-500" />
                  </div>
                )}
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('courses')}>
                    View Courses
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Class Attendance</CardTitle>
                <CardDescription>Attendance records by class</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingClasses ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">
                        {classes?.total || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Active classes</div>
                    </div>
                    <Home className="h-10 w-10 text-green-500" />
                  </div>
                )}
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('classes')}>
                    View Classes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Course Attendance</CardTitle>
              <CardDescription>Attendance statistics by course</CardDescription>
            </CardHeader>
            <CardContent>
              <CourseAttendanceAnalytics
                campusId={campusId}
                period={
                  dateRange.from && dateRange.to
                    ? { startDate: dateRange.from, endDate: dateRange.to }
                    : "month"
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Course Attendance</CardTitle>
                  <CardDescription>Detailed attendance statistics by course</CardDescription>
                </div>
                <div className="relative w-full md:w-auto md:min-w-[300px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search courses..."
                    className="w-full pl-8"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CourseAttendanceAnalytics
                campusId={campusId}
                period={
                  dateRange.from && dateRange.to
                    ? { startDate: dateRange.from, endDate: dateRange.to }
                    : "month"
                }
                searchTerm={courseSearch}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Class Attendance</CardTitle>
                  <CardDescription>Attendance records by class</CardDescription>
                </div>
                <div className="relative w-full md:w-auto md:min-w-[300px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search classes..."
                    className="w-full pl-8"
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingClasses ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No classes found matching your search criteria
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead className="text-center">Students</TableHead>
                        <TableHead className="text-center">Attendance Rate</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClasses.map((classItem) => (
                        <TableRow key={classItem.id}>
                          <TableCell className="font-medium">{classItem.name}</TableCell>
                          <TableCell>{classItem.courseCampus?.course?.name || 'N/A'}</TableCell>
                          <TableCell className="text-center">{classItem.studentCount || 0}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Progress value={85} className="h-2 w-20" />
                              <span className="text-sm">85%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/campus/classes/${classItem.id}/attendance`} target="_blank" rel="noopener noreferrer">
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Needs Attention Tab */}
        <TabsContent value="attention" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Students Needing Attention</CardTitle>
                  <CardDescription>Students with attendance below 75%</CardDescription>
                </div>
                <div className="flex flex-col md:flex-row gap-2 items-center">
                  <div className="relative w-full md:w-auto md:min-w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search students..."
                      className="w-full pl-8"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => exportStudentsData('CSV')}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportStudentsData('PDF')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStudentIssues ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredStudentsWithIssues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students found with attendance issues
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-center">Attendance Rate</TableHead>
                        <TableHead className="text-center">Last Attended</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedStudents.map((student) => (
                        <TableRow key={student.uniqueKey}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {student.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-xs text-muted-foreground">{student.enrollmentNumber}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{student.className}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Progress
                                value={student.attendanceRate}
                                className={`h-2 w-20 ${student.attendanceRate < 50 ? 'bg-red-200' : 'bg-amber-200'}`}
                              />
                              <Badge
                                variant={student.attendanceRate < 50 ? 'destructive' : 'warning'}
                              >
                                {student.attendanceRate}%
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {student.lastAttendance ? format(new Date(student.lastAttendance), 'MMM dd, yyyy') : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/system/students/${student.id}`} target="_blank" rel="noopener noreferrer">
                                View Profile
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {filteredStudentsWithIssues.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    totalItems={filteredStudentsWithIssues.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setItemsPerPage}
                    showPageSizeSelector={true}
                    showTotalItems={true}
                    pageSizeOptions={[5, 10, 25, 50]}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
