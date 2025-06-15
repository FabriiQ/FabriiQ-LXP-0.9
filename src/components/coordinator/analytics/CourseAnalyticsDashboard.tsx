'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { RotateCcw } from 'lucide-react';

interface CourseAnalyticsDashboardProps {
  courseId?: string;
  programId?: string;
  timeframe?: 'week' | 'month' | 'term' | 'year';
}

/**
 * CourseAnalyticsDashboard Component
 *
 * Displays comprehensive analytics for courses with real-time updates.
 * Includes performance metrics, enrollment trends, and class comparisons.
 */
export function CourseAnalyticsDashboard({
  courseId,
  programId,
  timeframe = 'month'
}: CourseAnalyticsDashboardProps) {
  const { isMobile } = useResponsive();
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(timeframe);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(courseId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Offline storage hooks
  const {
    isOnline,
    getData: getAnalyticsData,
    saveData: saveAnalyticsData,
    sync
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // States for analytics data
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [classComparisonData, setClassComparisonData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [isLoadingEnrollment, setIsLoadingEnrollment] = useState(true);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(true);
  const [isLoadingClassComparison, setIsLoadingClassComparison] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);

  // Toast hook
  const { toast } = useToast();

  // Available courses for selection
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);

  // Fetch available courses
  const { data: coursesData, isLoading: isLoadingCourses } = api.coordinator.getProgramCourses.useQuery(
    { programId: programId || "" },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      enabled: isOnline && !!programId,
      onSuccess: (data) => {
        if (data?.courses) {
          setAvailableCourses(data.courses.map((course: any) => ({
            id: course.id,
            name: course.name
          })));

          // If no course is selected and we have courses, select the first one
          if (!selectedCourseId && data.courses.length > 0) {
            setSelectedCourseId(data.courses[0].id);
          }

          // Save to offline storage
          saveAnalyticsData('availableCourses', 'list', data.courses);
        }
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to fetch courses: ${error.message}`,
          variant: 'error',
        });

        // Try to get courses from offline storage
        getAnalyticsData('availableCourses', 'list').then((offlineCourses) => {
          if (offlineCourses) {
            setAvailableCourses(offlineCourses.map((course: any) => ({
              id: course.id,
              name: course.name
            })));
          }
        });
      }
    }
  );

  // Fetch analytics data on component mount or when parameters change
  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeframe, selectedCourseId]);

  // Fetch course analytics data
  const { data: courseAnalyticsData, refetch: refetchCourseAnalytics } = api.courseAnalytics.getCourseAnalytics.useQuery(
    {
      courseCampusId: selectedCourseId || '',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date()
    },
    {
      enabled: !!selectedCourseId && isOnline,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data) {
          // Create enrollment data from the course analytics data
          const formattedEnrollmentData = data ? [
            {
              month: 'Current',
              students: data.studentCount,
              target: Math.round(data.studentCount * 1.1) // 10% higher as target
            }
          ] : [];
          setEnrollmentData(formattedEnrollmentData);
          setIsLoadingEnrollment(false);
          saveAnalyticsData('enrollment', `${selectedCourseId}-${selectedTimeframe}`, formattedEnrollmentData);

          // Create performance data from the course analytics data
          const formattedPerformanceData = data ? [
            { name: 'Grades', completed: data.averageGrade, target: 90 },
            { name: 'Attendance', completed: data.attendanceRate, target: 95 },
            { name: 'Completion', completed: data.completionRate, target: 100 }
          ] : [];

          setPerformanceData(formattedPerformanceData);
          setIsLoadingPerformance(false);
          saveAnalyticsData('performance', `${selectedCourseId}-${selectedTimeframe}`, formattedPerformanceData);

          // Process class comparison data
          setClassComparisonData(data.classPerformance || []);
          setIsLoadingClassComparison(false);
          saveAnalyticsData('classComparison', `${selectedCourseId}-${selectedTimeframe}`, data.classPerformance || []);

          // Create attendance data from the course analytics data
          const formattedAttendanceData = data && data.statistics ? [
            { name: 'Present', value: data.statistics.present },
            { name: 'Absent', value: data.statistics.absent },
            { name: 'Late', value: data.statistics.late },
            { name: 'Excused', value: data.statistics.excused }
          ] : [];

          setAttendanceData(formattedAttendanceData);
          setIsLoadingAttendance(false);
          saveAnalyticsData('attendance', `${selectedCourseId}-${selectedTimeframe}`, formattedAttendanceData);
        }
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to fetch course analytics: ${error.message}`,
          variant: 'error',
        });

        // Try to get data from offline storage
        Promise.all([
          getAnalyticsData('enrollment', `${selectedCourseId}-${selectedTimeframe}`),
          getAnalyticsData('performance', `${selectedCourseId}-${selectedTimeframe}`),
          getAnalyticsData('classComparison', `${selectedCourseId}-${selectedTimeframe}`),
          getAnalyticsData('attendance', `${selectedCourseId}-${selectedTimeframe}`)
        ]).then(([enrollmentData, performanceData, classComparisonData, attendanceData]) => {
          if (enrollmentData) setEnrollmentData(enrollmentData);
          if (performanceData) setPerformanceData(performanceData);
          if (classComparisonData) setClassComparisonData(classComparisonData);
          if (attendanceData) setAttendanceData(attendanceData);

          setIsLoadingEnrollment(false);
          setIsLoadingPerformance(false);
          setIsLoadingClassComparison(false);
          setIsLoadingAttendance(false);
        });
      }
    }
  );

  // Function to fetch analytics data
  const fetchAnalyticsData = async () => {
    setIsRefreshing(true);

    try {
      if (isOnline && selectedCourseId) {
        // Refetch data from API
        await refetchCourseAnalytics();
      } else {
        // Try to get data from offline storage
        const offlineEnrollmentData = await getAnalyticsData('enrollment', `${selectedCourseId}-${selectedTimeframe}`);
        if (offlineEnrollmentData) {
          setEnrollmentData(offlineEnrollmentData);
        } else {
          // Use empty array for enrollment data if not available
          setEnrollmentData([]);
        }

        const offlinePerformanceData = await getAnalyticsData('performance', `${selectedCourseId}-${selectedTimeframe}`);
        if (offlinePerformanceData) {
          setPerformanceData(offlinePerformanceData);
        } else {
          // Use empty array for performance data if not available
          setPerformanceData([]);
        }

        const offlineClassComparisonData = await getAnalyticsData('classComparison', `${selectedCourseId}-${selectedTimeframe}`);
        if (offlineClassComparisonData) {
          setClassComparisonData(offlineClassComparisonData);
        } else {
          // Use empty array for class comparison data if not available
          setClassComparisonData([]);
        }

        const offlineAttendanceData = await getAnalyticsData('attendance', `${selectedCourseId}-${selectedTimeframe}`);
        if (offlineAttendanceData) {
          setAttendanceData(offlineAttendanceData);
        } else {
          // Use empty array for attendance data if not available
          setAttendanceData([]);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);

      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data. Using mock data.',
        variant: 'error',
      });

      // Use empty arrays in case of error
      setEnrollmentData([]);
      setPerformanceData([]);
      setClassComparisonData([]);
      setAttendanceData([]);
    } finally {
      setIsLoadingEnrollment(false);
      setIsLoadingPerformance(false);
      setIsLoadingClassComparison(false);
      setIsLoadingAttendance(false);
      setIsRefreshing(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;
    await fetchAnalyticsData();
  };

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    setSelectedTimeframe(value);
  };

  // Handle course change
  const handleCourseChange = (value: string) => {
    setSelectedCourseId(value);
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl font-semibold">Course Analytics</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedCourseId} onValueChange={handleCourseChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent>
              {availableCourses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="term">Term</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || !isOnline}
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Enrollment Trends */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Enrollment Trends</CardTitle>
                <CardDescription>Student enrollment over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoadingEnrollment ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : enrollmentData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={enrollmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="students" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="target" stroke="#82ca9d" strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No enrollment data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Attendance Distribution</CardTitle>
                <CardDescription>Overall attendance statistics</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoadingAttendance ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : attendanceData ? (
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
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {attendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No attendance data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Class Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Class Comparison</CardTitle>
              <CardDescription>Performance metrics across classes</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoadingClassComparison ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : classComparisonData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgGrade" name="Average Grade" fill="#8884d8" />
                    <Bar dataKey="attendance" name="Attendance %" fill="#82ca9d" />
                    <Bar dataKey="participation" name="Participation %" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No class comparison data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollment">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Analytics</CardTitle>
              <CardDescription>Detailed enrollment metrics and trends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingEnrollment ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : enrollmentData ? (
                <>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={enrollmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="students" name="Current Students" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="target" name="Target" stroke="#82ca9d" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="newEnrollments" name="New Enrollments" stroke="#ffc658" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Students</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {enrollmentData[enrollmentData.length - 1]?.students || 0}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">New Enrollments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {enrollmentData[enrollmentData.length - 1]?.newEnrollments || 0}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Target Completion</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {enrollmentData[enrollmentData.length - 1]?.students && enrollmentData[enrollmentData.length - 1]?.target
                            ? `${Math.round((enrollmentData[enrollmentData.length - 1].students / enrollmentData[enrollmentData.length - 1].target) * 100)}%`
                            : '0%'
                          }
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">No enrollment data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Detailed performance metrics and trends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingPerformance ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : performanceData ? (
                <>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completed" name="Completion Rate (%)" fill="#8884d8" />
                        <Bar dataKey="target" name="Target (%)" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Average Completion Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {performanceData.length > 0
                            ? `${Math.round(performanceData.reduce((acc, item) => acc + item.completed, 0) / performanceData.length)}%`
                            : '0%'
                          }
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Target Achievement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {performanceData.length > 0
                            ? `${Math.round((performanceData.reduce((acc, item) => acc + item.completed, 0) / performanceData.length) /
                                (performanceData.reduce((acc, item) => acc + item.target, 0) / performanceData.length) * 100)}%`
                            : '0%'
                          }
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Performance Breakdown</h3>
                    <div className="space-y-4">
                      {performanceData.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between">
                            <span>{item.name}</span>
                            <span className="font-medium">{item.completed}% / {item.target}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2.5">
                            <div
                              className="bg-primary h-2.5 rounded-full"
                              style={{ width: `${(item.completed / item.target) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">No performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>Class Analytics</CardTitle>
              <CardDescription>Detailed class comparison and metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingClassComparison ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : classComparisonData ? (
                <>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgGrade" name="Average Grade" fill="#8884d8" />
                        <Bar dataKey="attendance" name="Attendance %" fill="#82ca9d" />
                        <Bar dataKey="participation" name="Participation %" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Class Performance Ranking</h3>
                    <div className="space-y-4">
                      {[...classComparisonData]
                        .sort((a, b) => (b.avgGrade + b.attendance + b.participation) - (a.avgGrade + a.attendance + a.participation))
                        .map((item, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="font-bold text-lg">{index + 1}. {item.name}</span>
                                <span className="ml-2 text-sm text-muted-foreground">
                                  Overall Score: {Math.round((item.avgGrade + item.attendance + item.participation) / 3)}%
                                </span>
                              </div>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/coordinator/classes/${item.id || 'unknown'}`}>
                                  View Details
                                </Link>
                              </Button>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <div>
                                <div className="text-sm text-muted-foreground">Avg. Grade</div>
                                <div className="font-medium">{item.avgGrade}%</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Attendance</div>
                                <div className="font-medium">{item.attendance}%</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Participation</div>
                                <div className="font-medium">{item.participation}%</div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">No class comparison data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
