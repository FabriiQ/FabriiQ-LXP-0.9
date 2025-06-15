'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Loader2,
  Users,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  BookOpen
} from 'lucide-react';

interface TeacherPerformanceComparisonProps {
  courseId?: string;
  programId?: string;
  timeframe?: 'month' | 'term' | 'year';
}

interface Teacher {
  id: string;
  name: string;
  avatar?: string;
  metrics: {
    studentPerformance: number;
    attendanceRate: number;
    feedbackTime: number;
    classEngagement: number;
    contentQuality: number;
    overallRating: number;
  };
  classes: {
    id: string;
    name: string;
    studentCount: number;
    averageGrade: number;
  }[];
  trends: {
    month: string;
    studentPerformance: number;
    attendanceRate: number;
  }[];
}

/**
 * TeacherPerformanceComparison Component
 *
 * Compares teacher performance across multiple metrics.
 * Includes detailed analytics, trends, and visual comparisons.
 */
export function TeacherPerformanceComparison({
  courseId,
  // programId is unused but kept for API compatibility
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  programId,
  timeframe = 'term'
}: TeacherPerformanceComparisonProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(timeframe);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(courseId);
  const [selectedMetric, setSelectedMetric] = useState<string>('overallRating');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Offline storage hooks
  const {
    isOnline,
    getData: getPerformanceData,
    saveData: savePerformanceData
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Available courses for selection
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availableCourses, _setAvailableCourses] = useState<any[]>([
    { id: 'course-1', name: 'Mathematics 101' },
    { id: 'course-2', name: 'Physics 101' },
    { id: 'course-3', name: 'Chemistry 101' },
    { id: 'course-4', name: 'Biology 101' },
    { id: 'course-5', name: 'English Literature' }
  ]);

  // Fetch performance data on component mount or when parameters change
  useEffect(() => {
    fetchPerformanceData();
  }, [selectedTimeframe, selectedCourseId]);

  // Function to fetch performance data
  const fetchPerformanceData = async () => {
    setIsRefreshing(true);

    try {
      // Simulate API call with setTimeout
      setTimeout(() => {
        // Mock data for teachers
        const mockTeachers: Teacher[] = [
          {
            id: 'teacher-1',
            name: 'Dr. Sarah Johnson',
            metrics: {
              studentPerformance: 92,
              attendanceRate: 98,
              feedbackTime: 24, // hours
              classEngagement: 90,
              contentQuality: 95,
              overallRating: 94
            },
            classes: [
              { id: 'class-1', name: 'Class A', studentCount: 30, averageGrade: 88 },
              { id: 'class-2', name: 'Class B', studentCount: 28, averageGrade: 92 },
              { id: 'class-3', name: 'Class C', studentCount: 32, averageGrade: 85 },
              { id: 'class-4', name: 'Class D', studentCount: 30, averageGrade: 90 }
            ],
            trends: [
              { month: 'Jan', studentPerformance: 88, attendanceRate: 95 },
              { month: 'Feb', studentPerformance: 90, attendanceRate: 96 },
              { month: 'Mar', studentPerformance: 91, attendanceRate: 97 },
              { month: 'Apr', studentPerformance: 92, attendanceRate: 98 },
              { month: 'May', studentPerformance: 93, attendanceRate: 98 },
              { month: 'Jun', studentPerformance: 94, attendanceRate: 99 }
            ]
          },
          {
            id: 'teacher-2',
            name: 'Prof. David Chen',
            metrics: {
              studentPerformance: 88,
              attendanceRate: 95,
              feedbackTime: 36, // hours
              classEngagement: 85,
              contentQuality: 90,
              overallRating: 88
            },
            classes: [
              { id: 'class-5', name: 'Class E', studentCount: 25, averageGrade: 82 },
              { id: 'class-6', name: 'Class F', studentCount: 30, averageGrade: 85 },
              { id: 'class-7', name: 'Class G', studentCount: 28, averageGrade: 88 }
            ],
            trends: [
              { month: 'Jan', studentPerformance: 82, attendanceRate: 92 },
              { month: 'Feb', studentPerformance: 84, attendanceRate: 93 },
              { month: 'Mar', studentPerformance: 85, attendanceRate: 94 },
              { month: 'Apr', studentPerformance: 86, attendanceRate: 94 },
              { month: 'May', studentPerformance: 87, attendanceRate: 95 },
              { month: 'Jun', studentPerformance: 88, attendanceRate: 95 }
            ]
          },
          {
            id: 'teacher-3',
            name: 'Dr. Maria Rodriguez',
            metrics: {
              studentPerformance: 90,
              attendanceRate: 96,
              feedbackTime: 30, // hours
              classEngagement: 92,
              contentQuality: 88,
              overallRating: 90
            },
            classes: [
              { id: 'class-8', name: 'Class H', studentCount: 28, averageGrade: 86 },
              { id: 'class-9', name: 'Class I', studentCount: 30, averageGrade: 89 },
              { id: 'class-10', name: 'Class J', studentCount: 27, averageGrade: 91 }
            ],
            trends: [
              { month: 'Jan', studentPerformance: 85, attendanceRate: 94 },
              { month: 'Feb', studentPerformance: 86, attendanceRate: 95 },
              { month: 'Mar', studentPerformance: 88, attendanceRate: 95 },
              { month: 'Apr', studentPerformance: 89, attendanceRate: 96 },
              { month: 'May', studentPerformance: 90, attendanceRate: 96 },
              { month: 'Jun', studentPerformance: 90, attendanceRate: 97 }
            ]
          },
          {
            id: 'teacher-4',
            name: 'Prof. James Wilson',
            metrics: {
              studentPerformance: 85,
              attendanceRate: 92,
              feedbackTime: 48, // hours
              classEngagement: 80,
              contentQuality: 85,
              overallRating: 84
            },
            classes: [
              { id: 'class-11', name: 'Class K', studentCount: 30, averageGrade: 80 },
              { id: 'class-12', name: 'Class L', studentCount: 30, averageGrade: 82 }
            ],
            trends: [
              { month: 'Jan', studentPerformance: 78, attendanceRate: 90 },
              { month: 'Feb', studentPerformance: 80, attendanceRate: 91 },
              { month: 'Mar', studentPerformance: 82, attendanceRate: 91 },
              { month: 'Apr', studentPerformance: 83, attendanceRate: 92 },
              { month: 'May', studentPerformance: 84, attendanceRate: 92 },
              { month: 'Jun', studentPerformance: 85, attendanceRate: 93 }
            ]
          },
          {
            id: 'teacher-5',
            name: 'Dr. Olivia Smith',
            metrics: {
              studentPerformance: 87,
              attendanceRate: 94,
              feedbackTime: 36, // hours
              classEngagement: 88,
              contentQuality: 92,
              overallRating: 89
            },
            classes: [
              { id: 'class-13', name: 'Class M', studentCount: 25, averageGrade: 84 },
              { id: 'class-14', name: 'Class N', studentCount: 25, averageGrade: 87 },
              { id: 'class-15', name: 'Class O', studentCount: 25, averageGrade: 89 }
            ],
            trends: [
              { month: 'Jan', studentPerformance: 82, attendanceRate: 92 },
              { month: 'Feb', studentPerformance: 83, attendanceRate: 93 },
              { month: 'Mar', studentPerformance: 85, attendanceRate: 93 },
              { month: 'Apr', studentPerformance: 86, attendanceRate: 94 },
              { month: 'May', studentPerformance: 86, attendanceRate: 94 },
              { month: 'Jun', studentPerformance: 87, attendanceRate: 95 }
            ]
          }
        ];

        setTeachers(mockTeachers);
        // Select first two teachers by default
        setSelectedTeachers([mockTeachers[0].id, mockTeachers[1].id]);
        setIsLoading(false);

        // Save to offline storage
        savePerformanceData('teacherPerformance', `${selectedCourseId || 'all'}-${selectedTimeframe}`, mockTeachers);
      }, 1500);
    } catch (error) {
      console.error('Error fetching performance data:', error);

      // Try to get data from offline storage
      try {
        const offlineData = await getPerformanceData('teacherPerformance', `${selectedCourseId || 'all'}-${selectedTimeframe}`);
        if (offlineData) {
          setTeachers(offlineData);
          // Select first two teachers by default
          setSelectedTeachers([offlineData[0].id, offlineData[1].id]);
        }
      } catch (offlineError) {
        console.error('Error getting offline data:', offlineError);
      } finally {
        setIsLoading(false);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;
    await fetchPerformanceData();
  };

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    setSelectedTimeframe(value);
  };

  // Handle course change
  const handleCourseChange = (value: string) => {
    setSelectedCourseId(value);
  };

  // Handle metric change
  const handleMetricChange = (value: string) => {
    setSelectedMetric(value);
  };

  // Toggle teacher selection
  const toggleTeacherSelection = (teacherId: string) => {
    setSelectedTeachers(prev => {
      if (prev.includes(teacherId)) {
        return prev.filter(id => id !== teacherId);
      } else {
        return [...prev, teacherId];
      }
    });
  };

  // Get selected teachers data
  const selectedTeachersData = teachers.filter(teacher =>
    selectedTeachers.includes(teacher.id)
  );

  // Prepare radar chart data
  const radarData = selectedTeachersData.map(teacher => ({
    subject: 'Student Performance',
    [teacher.name]: teacher.metrics.studentPerformance
  })).concat(
    selectedTeachersData.map(teacher => ({
      subject: 'Attendance Rate',
      [teacher.name]: teacher.metrics.attendanceRate
    }))
  ).concat(
    selectedTeachersData.map(teacher => ({
      subject: 'Class Engagement',
      [teacher.name]: teacher.metrics.classEngagement
    }))
  ).concat(
    selectedTeachersData.map(teacher => ({
      subject: 'Content Quality',
      [teacher.name]: teacher.metrics.contentQuality
    }))
  ).concat(
    selectedTeachersData.map(teacher => ({
      subject: 'Feedback Time',
      [teacher.name]: 100 - (teacher.metrics.feedbackTime / 72 * 100) // Normalize feedback time (lower is better)
    }))
  );

  // Prepare comparison chart data
  const comparisonData = teachers.map(teacher => ({
    name: teacher.name,
    [selectedMetric]: teacher.metrics[selectedMetric as keyof typeof teacher.metrics]
  }));

  // Prepare trend chart data
  const trendData = selectedTeachersData.length > 0
    ? selectedTeachersData[0].trends.map((trend, index) => {
        const data: any = { month: trend.month };
        selectedTeachersData.forEach(teacher => {
          data[teacher.name] = teacher.trends[index].studentPerformance;
        });
        return data;
      })
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl font-semibold">Teacher Performance Comparison</h2>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedCourseId} onValueChange={handleCourseChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Courses</SelectItem>
              {availableCourses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
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
            <Loader2 className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>Compare teacher performance across key metrics</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : selectedTeachersData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No teachers selected</h3>
                    <p className="text-sm text-muted-foreground">
                      Select teachers from the list to compare
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      {selectedTeachersData.map((teacher, index) => (
                        <Radar
                          key={teacher.id}
                          name={teacher.name}
                          dataKey={teacher.name}
                          stroke={`hsl(${index * 60}, 70%, 50%)`}
                          fill={`hsl(${index * 60}, 70%, 50%)`}
                          fillOpacity={0.2}
                        />
                      ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teacher Selection</CardTitle>
                <CardDescription>Select teachers to compare</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border-b">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-40 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-2">
                    {teachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedTeachers.includes(teacher.id) ? 'bg-muted/50' : ''
                        }`}
                        onClick={() => toggleTeacherSelection(teacher.id)}
                      >
                        <div className="flex-shrink-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={teacher.avatar} alt={teacher.name} />
                            <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{teacher.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {teacher.classes.length} Classes, {teacher.classes.reduce((sum, cls) => sum + cls.studentCount, 0)} Students
                          </div>
                        </div>
                        <Badge variant={selectedTeachers.includes(teacher.id) ? "default" : "outline"}>
                          {selectedTeachers.includes(teacher.id) ? "Selected" : "Select"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key performance indicators for all teachers</CardDescription>
                </div>
                <Select value={selectedMetric} onValueChange={handleMetricChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overallRating">Overall Rating</SelectItem>
                    <SelectItem value="studentPerformance">Student Performance</SelectItem>
                    <SelectItem value="attendanceRate">Attendance Rate</SelectItem>
                    <SelectItem value="classEngagement">Class Engagement</SelectItem>
                    <SelectItem value="contentQuality">Content Quality</SelectItem>
                    <SelectItem value="feedbackTime">Feedback Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey={selectedMetric}
                      name={selectedMetric === 'feedbackTime' ? 'Feedback Time (hours)' : selectedMetric.replace(/([A-Z])/g, ' $1').trim()}
                      fill="#8884d8"
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
              <CardDescription>Comprehensive performance metrics for each teacher</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Detailed metrics content will be implemented here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Performance trends over time for selected teachers</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : selectedTeachersData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No teachers selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Select teachers from the overview tab to view trends
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[70, 100]} />
                    <Tooltip />
                    <Legend />
                    {selectedTeachersData.map((teacher, index) => (
                      <Line
                        key={teacher.id}
                        type="monotone"
                        dataKey={teacher.name}
                        stroke={`hsl(${index * 60}, 70%, 50%)`}
                        activeDot={{ r: 8 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>Class Performance</CardTitle>
              <CardDescription>Performance metrics for each class by teacher</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Class performance content will be implemented here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
