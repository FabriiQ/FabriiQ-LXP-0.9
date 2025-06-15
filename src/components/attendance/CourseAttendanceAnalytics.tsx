'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Search, BookOpen } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

interface CourseAttendanceAnalyticsProps {
  campusId: string;
  period: 'week' | 'month' | 'term' | 'year' | { startDate: Date; endDate: Date };
  searchTerm?: string;
}

export function CourseAttendanceAnalytics({ campusId, period, searchTerm: externalSearchTerm }: CourseAttendanceAnalyticsProps) {
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm || '');

  // Fetch course attendance data
  const { data: courseAttendanceData, isLoading } = api.campusAttendanceAnalytics.getCourseAttendanceStats.useQuery(
    typeof period === 'object'
      ? {
          campusId,
          startDate: period.startDate,
          endDate: period.endDate
        }
      : { campusId, period },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Filter courses based on search term
  const filteredCourses = courseAttendanceData?.courseStats?.filter(
    (course) =>
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.programName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Prepare data for bar chart
  const chartData = filteredCourses
    .slice(0, 10) // Show top 10 courses
    .map((course) => ({
      name: course.courseCode,
      attendanceRate: Math.round(course.attendanceRate),
      studentCount: course.studentCount,
    }))
    .sort((a, b) => b.attendanceRate - a.attendanceRate);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Course Attendance Analytics</h2>
          <p className="text-muted-foreground">Attendance rates across different courses</p>
        </div>
        <div className="relative w-full md:w-auto md:min-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : courseAttendanceData?.courseStats?.length ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Courses by Attendance</CardTitle>
                <CardDescription>Courses with highest attendance rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (name === 'attendanceRate') return [`${value}%`, 'Attendance Rate'];
                          return [value, 'Student Count'];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="attendanceRate" name="Attendance Rate (%)" fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Attendance Overview</CardTitle>
                <CardDescription>Attendance statistics by course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCourses.slice(0, 5).map((course) => (
                    <div key={course.courseCampusId} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 p-1.5 rounded">
                            <BookOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{course.courseName}</div>
                            <div className="text-xs text-muted-foreground">{course.courseCode}</div>
                          </div>
                        </div>
                        <div className="text-sm font-medium">{Math.round(course.attendanceRate)}%</div>
                      </div>
                      <Progress value={course.attendanceRate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{course.studentCount} students</span>
                        <span>{course.classCount} classes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Course Attendance Details</CardTitle>
              <CardDescription>Detailed attendance statistics for all courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead className="text-center">Classes</TableHead>
                      <TableHead className="text-center">Students</TableHead>
                      <TableHead className="text-center">Attendance Rate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course) => (
                      <TableRow key={course.courseCampusId}>
                        <TableCell className="font-medium">{course.courseName}</TableCell>
                        <TableCell>{course.courseCode}</TableCell>
                        <TableCell>{course.programName}</TableCell>
                        <TableCell className="text-center">{course.classCount}</TableCell>
                        <TableCell className="text-center">{course.studentCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={course.attendanceRate} className="h-2 w-20" />
                            <span className="text-sm">{Math.round(course.attendanceRate)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/campus/courses/${course.courseCampusId}`}>
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredCourses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          No courses found matching your search
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              <p>No course attendance data available</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
