"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  Calendar,
  Clock,
  Download,
  Filter,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users
} from "lucide-react";
import { format } from "date-fns";

interface AttendanceAnalyticsDashboardProps {
  campusId: string;
  className?: string;
  startDate?: Date;
  endDate?: Date;
}

export function AttendanceAnalyticsDashboard({
  campusId,
  className = "",
  startDate,
  endDate,
}: AttendanceAnalyticsDashboardProps) {
  const [period, setPeriod] = useState<"week" | "month" | "term" | "year">("month");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch attendance overview
  const {
    data: overviewData,
    isLoading: isLoadingOverview,
    refetch: refetchOverview,
    error: overviewError
  } = api.campusAttendanceAnalytics.getAttendanceOverview.useQuery(
    startDate && endDate
      ? { campusId, startDate, endDate }
      : { campusId, period },
    {
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching attendance overview:', error);
      }
    }
  );

  // Fetch attendance trends
  const {
    data: trendsData,
    isLoading: isLoadingTrends,
    refetch: refetchTrends,
    error: trendsError
  } = api.campusAttendanceAnalytics.getAttendanceTrends.useQuery(
    { campusId, period },
    {
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching attendance trends:', error);
      }
    }
  );

  // Fetch program comparison
  const {
    data: programData,
    isLoading: isLoadingPrograms,
    refetch: refetchPrograms,
    error: programError
  } = api.campusAttendanceAnalytics.getProgramAttendanceComparison.useQuery(
    { campusId, period },
    {
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching program comparison:', error);
      }
    }
  );

  // Function to refresh all data
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchOverview(),
        refetchTrends(),
        refetchPrograms()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const STATUS_COLORS = {
    present: '#4CAF50',
    absent: '#F44336',
    late: '#FF9800',
    excused: '#2196F3'
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Analytics</h2>
          <p className="text-muted-foreground">Monitor and analyze attendance patterns across your campus</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as "week" | "month" | "term" | "year")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="term">Last term</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Overall Attendance Rate</CardTitle>
            <CardDescription>Average attendance across all classes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOverview ? (
              <Skeleton className="h-16 w-full" />
            ) : overviewError ? (
              <div className="text-center text-muted-foreground py-4">
                Error loading data
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-4xl font-bold">
                  {Math.round(overviewData?.overallAttendanceRate || 0)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Based on {overviewData?.totalRecords || 0} records
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attendance by Status</CardTitle>
            <CardDescription>Distribution of attendance statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOverview ? (
              <Skeleton className="h-16 w-full" />
            ) : overviewError ? (
              <div className="text-center text-muted-foreground py-4">
                Error loading data
              </div>
            ) : (
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Present', value: overviewData?.statistics.present || 0, color: STATUS_COLORS.present },
                        { name: 'Absent', value: overviewData?.statistics.absent || 0, color: STATUS_COLORS.absent },
                        { name: 'Late', value: overviewData?.statistics.late || 0, color: STATUS_COLORS.late },
                        { name: 'Excused', value: overviewData?.statistics.excused || 0, color: STATUS_COLORS.excused },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Present', value: overviewData?.statistics.present || 0, color: STATUS_COLORS.present },
                        { name: 'Absent', value: overviewData?.statistics.absent || 0, color: STATUS_COLORS.absent },
                        { name: 'Late', value: overviewData?.statistics.late || 0, color: STATUS_COLORS.late },
                        { name: 'Excused', value: overviewData?.statistics.excused || 0, color: STATUS_COLORS.excused },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Student Participation</CardTitle>
            <CardDescription>Total students with attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOverview ? (
              <Skeleton className="h-16 w-full" />
            ) : overviewError ? (
              <div className="text-center text-muted-foreground py-4">
                Error loading data
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold">{overviewData?.totalStudents || 0}</div>
                  <div className="text-sm text-muted-foreground">Active students</div>
                </div>
                <Users className="h-12 w-12 text-muted-foreground opacity-50" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
            <CardDescription>
              Attendance patterns over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTrends ? (
              <Skeleton className="h-[300px] w-full" />
            ) : trendsError ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Error loading trends data. Please try again later.
              </div>
            ) : trendsData?.trends && trendsData.trends.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendsData.trends}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [`${Math.round(value)}%`, 'Attendance Rate']}
                      labelFormatter={(date) => format(new Date(date), 'MMMM d, yyyy')}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="attendanceRate"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      name="Attendance Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No attendance data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Classes</CardTitle>
            <CardDescription>Classes with highest attendance rates</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOverview ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : overviewError ? (
              <div className="text-center text-muted-foreground py-4">
                Error loading data
              </div>
            ) : overviewData?.topClasses && overviewData.topClasses.length > 0 ? (
              <div className="space-y-4">
                {overviewData.topClasses.map((classItem, index) => (
                  <div key={classItem.classId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{classItem.className}</div>
                        <div className="text-xs text-muted-foreground">{classItem.classCode}</div>
                      </div>
                    </div>
                    <div className="font-medium">{Math.round(classItem.attendanceRate)}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No class data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classes Needing Attention</CardTitle>
            <CardDescription>Classes with lowest attendance rates</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOverview ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : overviewError ? (
              <div className="text-center text-muted-foreground py-4">
                Error loading data
              </div>
            ) : overviewData?.bottomClasses && overviewData.bottomClasses.length > 0 ? (
              <div className="space-y-4">
                {overviewData.bottomClasses.map((classItem, index) => (
                  <div key={classItem.classId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{classItem.className}</div>
                        <div className="text-xs text-muted-foreground">{classItem.classCode}</div>
                      </div>
                    </div>
                    <div className="font-medium text-destructive">{Math.round(classItem.attendanceRate)}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No class data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Program Attendance Comparison</CardTitle>
          <CardDescription>Compare attendance rates across different programs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPrograms ? (
            <Skeleton className="h-[300px] w-full" />
          ) : programError ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Error loading program data. Please try again later.
            </div>
          ) : programData?.programStats && programData.programStats.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={programData.programStats}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="programName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="attendanceRate" name="Attendance Rate (%)" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No program data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
