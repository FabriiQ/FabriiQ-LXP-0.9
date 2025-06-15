'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-display/data-table';
// Import from existing coordinator offline implementation
import { useOfflineStorage } from '@/features/coordinator/offline/hooks/use-offline-storage';
// Import the storage functions directly from the index file
import { saveOfflineData, getOfflineData } from '@/features/coordinator/offline';
// Import custom icons
import { RefreshCw } from '@/components/ui/icons/custom-icons';
// Import date range picker from shared components
import { DateRangeSelector } from '@/components/teacher/classes/DateRangeSelector';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

// Define types for course analytics data
interface CourseAnalytics {
  courseCampusId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  campusId: string;
  campusName: string;
  programId: string;
  programName: string;
  classCount: number;
  studentCount: number;
  attendanceRate: number;
  averageGrade: number;
  completionRate: number;
  statistics: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  classPerformance: Array<{
    classId: string;
    className: string;
    classCode: string;
    studentCount: number;
    attendanceRate: number;
    averageGrade: number;
  }>;
}

// Define props for the component
interface CoursesAnalyticsDashboardProps {
  programId: string;
  programName: string;
  campusId: string;
  campusName: string;
}

// Define date range type
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Define column type for class performance table
const classPerformanceColumns: ColumnDef<CourseAnalytics['classPerformance'][0]>[] = [
  {
    accessorKey: 'className',
    header: 'Class',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.className}</span>
        <span className="text-xs text-muted-foreground">{row.original.classCode}</span>
      </div>
    ),
  },
  {
    accessorKey: 'studentCount',
    header: 'Students',
    cell: ({ row }) => row.original.studentCount,
  },
  {
    accessorKey: 'attendanceRate',
    header: 'Attendance',
    cell: ({ row }) => (
      <div className="flex flex-col w-full">
        <div className="flex justify-between mb-1">
          <span className="text-xs">{Math.round(row.original.attendanceRate)}%</span>
        </div>
        <Progress value={row.original.attendanceRate} className="h-2" />
      </div>
    ),
  },
  {
    accessorKey: 'averageGrade',
    header: 'Avg. Grade',
    cell: ({ row }) => (
      <div className="flex flex-col w-full">
        <div className="flex justify-between mb-1">
          <span className="text-xs">{Math.round(row.original.averageGrade)}%</span>
        </div>
        <Progress value={row.original.averageGrade} className="h-2" />
      </div>
    ),
  },
];

// Define column type for courses table
const courseColumns: ColumnDef<CourseAnalytics>[] = [
  {
    accessorKey: 'courseName',
    header: 'Course',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.courseName}</span>
        <span className="text-xs text-muted-foreground">{row.original.courseCode}</span>
      </div>
    ),
  },
  {
    accessorKey: 'classCount',
    header: 'Classes',
    cell: ({ row }) => row.original.classCount,
  },
  {
    accessorKey: 'studentCount',
    header: 'Students',
    cell: ({ row }) => row.original.studentCount,
  },
  {
    accessorKey: 'attendanceRate',
    header: 'Attendance',
    cell: ({ row }) => (
      <div className="flex flex-col w-full">
        <div className="flex justify-between mb-1">
          <span className="text-xs">{Math.round(row.original.attendanceRate)}%</span>
        </div>
        <Progress value={row.original.attendanceRate} className="h-2" />
      </div>
    ),
  },
  {
    accessorKey: 'averageGrade',
    header: 'Avg. Grade',
    cell: ({ row }) => (
      <div className="flex flex-col w-full">
        <div className="flex justify-between mb-1">
          <span className="text-xs">{Math.round(row.original.averageGrade)}%</span>
        </div>
        <Progress value={row.original.averageGrade} className="h-2" />
      </div>
    ),
  },
  {
    accessorKey: 'completionRate',
    header: 'Completion',
    cell: ({ row }) => (
      <div className="flex flex-col w-full">
        <div className="flex justify-between mb-1">
          <span className="text-xs">{Math.round(row.original.completionRate)}%</span>
        </div>
        <Progress value={row.original.completionRate} className="h-2" />
      </div>
    ),
  },
];

// Define colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function CoursesAnalyticsDashboard({
  programId,
  programName,
  campusId,
  campusName,
}: CoursesAnalyticsDashboardProps) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const { toast } = useToast();
  const { isOnline } = useOfflineStorage('courseAnalytics');

  // Fetch course analytics data
  const {
    data: courseAnalyticsData,
    isLoading: courseAnalyticsLoading,
    refetch: refetchCourseAnalytics,
  } = api.courseAnalytics.getCoordinatorCourseAnalytics.useQuery(
    {
      programId,
      campusId,
      startDate: dateRange.from || undefined,
      endDate: dateRange.to || undefined,
    },
    {
      enabled: isOnline, // Only fetch when online
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        if (data) {
          // Cache data for offline use
          const cacheKey = `course-analytics-${programId}-${campusId}`;
          saveOfflineData('courseAnalytics', programId, data, cacheKey);
        }
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to fetch course analytics: ${error.message}`,
          variant: 'error',
        });
      },
    }
  );

  // Get offline data if not online
  useEffect(() => {
    if (!isOnline) {
      const cacheKey = `course-analytics-${programId}-${campusId}`;
      const offlineData = getOfflineData('courseAnalytics', programId, cacheKey);
      if (offlineData) {
        // Use offline data
      }
    }
  }, [isOnline, programId, campusId]);

  // Handle refresh
  const handleRefresh = () => {
    refetchCourseAnalytics();
    toast({
      title: 'Refreshing data',
      description: 'Fetching the latest course analytics data.',
    });
  };

  // Get selected course data
  const selectedCourseData = selectedCourse
    ? courseAnalyticsData?.find((course) => course.courseCampusId === selectedCourse)
    : null;

  // Prepare attendance data for pie chart
  const attendanceData = selectedCourseData
    ? [
        { name: 'Present', value: selectedCourseData.statistics.present },
        { name: 'Absent', value: selectedCourseData.statistics.absent },
        { name: 'Late', value: selectedCourseData.statistics.late },
        { name: 'Excused', value: selectedCourseData.statistics.excused },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Course Analytics</h2>
          <p className="text-muted-foreground">
            Analytics for courses in {programName} at {campusName}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <DateRangeSelector
            dateRange={{
              from: dateRange.from,
              to: dateRange.to
            }}
            onDateRangeChange={(range) => {
              if (range) {
                setDateRange({
                  from: range.from,
                  to: range.to
                });
              } else {
                setDateRange({
                  from: undefined,
                  to: undefined
                });
              }
            }}
            className="w-full sm:w-auto"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={courseAnalyticsLoading || !isOnline}
          >
            {courseAnalyticsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {!isOnline && (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Offline Mode - Showing cached data
        </Badge>
      )}

      {courseAnalyticsLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : courseAnalyticsData && courseAnalyticsData.length > 0 ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Course Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courseAnalyticsData.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {courseAnalyticsData.reduce((sum, course) => sum + course.classCount, 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {courseAnalyticsData.reduce((sum, course) => sum + course.studentCount, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
                <CardDescription>
                  Overview of all courses in {programName} at {campusName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable columns={courseColumns} data={courseAnalyticsData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
                <CardDescription>Select a course to view detailed analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedCourse || ''}
                  onValueChange={(value) => setSelectedCourse(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseAnalyticsData.map((course) => (
                      <SelectItem key={course.courseCampusId} value={course.courseCampusId}>
                        {course.courseName} ({course.courseCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedCourseData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Classes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedCourseData.classCount}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedCourseData.studentCount}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.round(selectedCourseData.attendanceRate)}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.round(selectedCourseData.averageGrade)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={attendanceData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {attendanceData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Class Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={selectedCourseData.classPerformance}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="className" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="attendanceRate" name="Attendance %" fill="#8884d8" />
                          <Bar dataKey="averageGrade" name="Average Grade" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Class Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      columns={classPerformanceColumns}
                      data={selectedCourseData.classPerformance}
                    />
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex justify-center items-center h-40">
                  <p className="text-muted-foreground">Select a course to view details</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">No course analytics data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
