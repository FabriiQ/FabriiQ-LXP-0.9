'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  BookOpen,
  Award
} from 'lucide-react';

/**
 * PrincipalDashboardCore Component
 *
 * Core dashboard component for the Principal Portal.
 * Displays key performance indicators and analytics.
 */
export function PrincipalDashboardCore() {
  const [timeframe] = useState('month');

  // Mock API call until the actual API is implemented
  // In production, this would use api.principal.getDashboardData.useQuery
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Simulate API call
  useEffect(() => {
    const fetchData = async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data
      const mockDashboardData = {
        kpis: {
          studentCount: 1250,
          studentCountChange: 5.2,
          teacherCount: 78,
          teacherCountChange: 2.1,
          attendanceRate: 92.5,
          attendanceRateChange: 1.8,
          averageGrade: 78.3,
          averageGradeChange: 3.2
        },
        enrollmentTrend: [
          { month: 'Jan', students: 1150 },
          { month: 'Feb', students: 1180 },
          { month: 'Mar', students: 1210 },
          { month: 'Apr', students: 1230 },
          { month: 'May', students: 1250 }
        ],
        gradeDistribution: [
          { grade: 'A', count: 320 },
          { grade: 'B', count: 480 },
          { grade: 'C', count: 280 },
          { grade: 'D', count: 120 },
          { grade: 'F', count: 50 }
        ],
        coursePerformance: [
          { name: 'Mathematics', performance: 82 },
          { name: 'Science', performance: 78 },
          { name: 'English', performance: 85 },
          { name: 'History', performance: 76 },
          { name: 'Computer Science', performance: 88 }
        ]
      };

      setDashboardData(mockDashboardData);
      setIsLoading(false);
    };

    fetchData();
  }, [timeframe]);

  // Default data structure to use while loading or if API fails
  const data = dashboardData || {
    kpis: {
      studentCount: 0,
      studentCountChange: 0,
      teacherCount: 0,
      teacherCountChange: 0,
      attendanceRate: 0,
      attendanceRateChange: 0,
      averageGrade: 0,
      averageGradeChange: 0
    },
    enrollmentTrend: [],
    gradeDistribution: [],
    coursePerformance: []
  };

  // Custom Minus icon
  const MinusIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );

  // Function to render trend indicator
  const renderTrendIndicator = (value: number) => {
    if (value > 0) {
      return (
        <div className="flex items-center text-green-500">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>+{value}%</span>
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center text-red-500">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span>{value}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500">
          <MinusIcon />
          <span className="ml-1">0%</span>
        </div>
      );
    }
  };



  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              {isLoading ? <Skeleton className="h-4 w-16" /> : renderTrendIndicator(data.kpis.studentCountChange)}
            </div>
            <div className="mt-2">
              <p className="text-sm font-medium text-muted-foreground">Students</p>
              <h3 className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-20" /> : data.kpis.studentCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                <GraduationCap className="h-4 w-4 text-green-600 dark:text-green-300" />
              </div>
              {isLoading ? <Skeleton className="h-4 w-16" /> : renderTrendIndicator(data.kpis.teacherCountChange)}
            </div>
            <div className="mt-2">
              <p className="text-sm font-medium text-muted-foreground">Teachers</p>
              <h3 className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-20" /> : data.kpis.teacherCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900">
                <BookOpen className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
              </div>
              {isLoading ? <Skeleton className="h-4 w-16" /> : renderTrendIndicator(data.kpis.attendanceRateChange)}
            </div>
            <div className="mt-2">
              <p className="text-sm font-medium text-muted-foreground">Attendance</p>
              <h3 className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-20" /> : `${data.kpis.attendanceRate}%`}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                <Award className="h-4 w-4 text-purple-600 dark:text-purple-300" />
              </div>
              {isLoading ? <Skeleton className="h-4 w-16" /> : renderTrendIndicator(data.kpis.averageGradeChange)}
            </div>
            <div className="mt-2">
              <p className="text-sm font-medium text-muted-foreground">Avg. Grade</p>
              <h3 className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-20" /> : data.kpis.averageGrade}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Trend</CardTitle>
            <CardDescription>Student enrollment over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : data.enrollmentTrend.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No enrollment data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.enrollmentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="students"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Distribution of student grades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : data.gradeDistribution.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No grade distribution data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Course Performance</CardTitle>
          <CardDescription>Average performance by course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-full w-full" />
              </div>
            ) : data.coursePerformance.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No course performance data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.coursePerformance}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="performance" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
