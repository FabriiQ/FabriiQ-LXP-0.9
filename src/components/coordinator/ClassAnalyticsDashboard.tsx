'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/utils/api';
import { Loader2, RefreshCw, ArrowLeft } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Define props for the component
interface ClassAnalyticsDashboardProps {
  classId: string;
  className: string;
  onNavigateToCourses?: () => void;
}

// Define date range type
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Define colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function ClassAnalyticsDashboard({
  classId,
  className,
  onNavigateToCourses,
}: ClassAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const { toast } = useToast();
  const { isOnline } = useOfflineStatus();

  // Fetch class analytics data
  const {
    data: classAnalyticsData,
    isLoading: classAnalyticsLoading,
    refetch: refetchClassAnalytics,
  } = api.classAnalytics.getClassStats.useQuery(
    {
      classId,
    },
    {
      enabled: isOnline, // Only fetch when online
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to fetch class analytics: ${error.message}`,
          variant: 'destructive',
        });
      },
    }
  );

  // Handle refresh
  const handleRefresh = () => {
    refetchClassAnalytics();
    toast({
      title: 'Refreshing data',
      description: 'Fetching the latest class analytics data.',
    });
  };

  // Prepare attendance data for pie chart
  const attendanceData = classAnalyticsData
    ? [
        { name: 'Present', value: classAnalyticsData.attendanceData.present },
        { name: 'Absent', value: classAnalyticsData.attendanceData.absent },
        { name: 'Late', value: classAnalyticsData.attendanceData.late },
        { name: 'Excused', value: classAnalyticsData.attendanceData.excused },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          {onNavigateToCourses && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateToCourses}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Class Analytics: {className}</h2>
            <p className="text-muted-foreground">
              Detailed analytics for this class
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <DatePickerWithRange
            date={dateRange}
            setDate={setDateRange}
            className="w-full sm:w-auto"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={classAnalyticsLoading || !isOnline}
          >
            {classAnalyticsLoading ? (
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

      {classAnalyticsLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : classAnalyticsData ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(classAnalyticsData.averageGrade)}%</div>
                  <Progress value={classAnalyticsData.averageGrade} className="h-2 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(classAnalyticsData.completionRate)}%</div>
                  <Progress value={classAnalyticsData.completionRate} className="h-2 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(
                      (classAnalyticsData.attendanceData.present /
                        (classAnalyticsData.attendanceData.present +
                          classAnalyticsData.attendanceData.absent +
                          classAnalyticsData.attendanceData.late +
                          classAnalyticsData.attendanceData.excused)) *
                        100
                    )}%
                  </div>
                  <Progress
                    value={
                      (classAnalyticsData.attendanceData.present /
                        (classAnalyticsData.attendanceData.present +
                          classAnalyticsData.attendanceData.absent +
                          classAnalyticsData.attendanceData.late +
                          classAnalyticsData.attendanceData.excused)) *
                      100
                    }
                    className="h-2 mt-2"
                  />
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Attendance</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={classAnalyticsData.weeklyAttendance}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" name="Present" fill="#0088FE" />
                      <Bar dataKey="absent" name="Absent" fill="#FF8042" />
                      <Bar dataKey="late" name="Late" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Attendance Heatmap</CardTitle>
                <CardDescription>Attendance rates by day and period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 border">Day</th>
                        {Object.keys(classAnalyticsData.dailyAttendance[0] || {})
                          .filter((key) => key !== 'day')
                          .map((period) => (
                            <th key={period} className="p-2 border">
                              {period}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {classAnalyticsData.dailyAttendance.map((day, index) => (
                        <tr key={index}>
                          <td className="p-2 border font-medium">{day.day}</td>
                          {Object.entries(day)
                            .filter(([key]) => key !== 'day')
                            .map(([period, value]) => (
                              <td
                                key={period}
                                className="p-2 border"
                                style={{
                                  backgroundColor: `rgba(0, 136, 254, ${value})`,
                                  color: value > 0.5 ? 'white' : 'black',
                                }}
                              >
                                {Math.round(Number(value) * 100)}%
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators for this class</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Average Grade</h3>
                    <div className="text-3xl font-bold">{Math.round(classAnalyticsData.averageGrade)}%</div>
                    <Progress value={classAnalyticsData.averageGrade} className="h-2 mt-2" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Completion Rate</h3>
                    <div className="text-3xl font-bold">{Math.round(classAnalyticsData.completionRate)}%</div>
                    <Progress value={classAnalyticsData.completionRate} className="h-2 mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">No class analytics data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
