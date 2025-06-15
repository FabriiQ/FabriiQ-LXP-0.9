"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Calendar, Clock, AlertCircle } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { startOfMonth } from "date-fns/startOfMonth";
import { endOfMonth } from "date-fns/endOfMonth";
import { AttendanceStats, PieChartData } from "@/types/attendance";
import { Progress } from "@/components/ui/progress";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";

interface AttendanceDashboardProps {
  defaultClassId?: string;
  compact?: boolean;
  className?: string;
}

export function AttendanceDashboard({
  defaultClassId,
  compact = false,
  className = "",
}: AttendanceDashboardProps) {
  const [classId, setClassId] = useState(defaultClassId || "");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "term">("week");
  const [isLoading, setIsLoading] = useState(false);

  // Get date range based on selected time range
  const getDateRange = () => {
    const today = new Date();

    switch (timeRange) {
      case "week":
        return {
          start: startOfWeek(today),
          end: endOfWeek(today),
        };
      case "month":
        return {
          start: startOfMonth(today),
          end: endOfMonth(today),
        };
      case "term":
        // Assuming a term is roughly 3 months
        return {
          start: subDays(today, 90),
          end: today,
        };
      default:
        return {
          start: startOfWeek(today),
          end: endOfWeek(today),
        };
    }
  };

  // Fetch classes for the dropdown
  const { data: classes, isLoading: isLoadingClasses } = api.class.list.useQuery({
    take: 100,
    status: "ACTIVE",
  });

  // Fetch attendance stats for the selected class
  const { data: classStats, isLoading: isLoadingStats } = api.attendance.getClassStats.useQuery(
    { classId },
    { enabled: !!classId }
  );

  // Fetch students in the class
  const { data: students } = api.class.getStudents.useQuery(
    { classId },
    { enabled: !!classId }
  );

  // Calculate attendance rate from stats
  const calculateAttendanceRate = (stats?: any) => {
    if (!stats) return 0;

    const totalPresent = stats.stats?.statusCounts?.PRESENT || 0;
    const totalRecords = stats.stats?.totalDays || 1;

    return (totalPresent / totalRecords) * 100;
  };

  // Prepare data for pie chart
  const getPieChartData = (): PieChartData[] => {
    if (!classStats) return [];

    return [
      {
        id: "Present",
        label: "Present",
        value: classStats.stats?.statusCounts?.PRESENT || 0,
        color: "hsl(142, 76%, 36%)",
      },
      {
        id: "Absent",
        label: "Absent",
        value: classStats.stats?.statusCounts?.ABSENT || 0,
        color: "hsl(346, 84%, 61%)",
      },
      {
        id: "Late",
        label: "Late",
        value: classStats.stats?.statusCounts?.LATE || 0,
        color: "hsl(42, 96%, 59%)",
      },
      {
        id: "Excused",
        label: "Excused",
        value: classStats.stats?.statusCounts?.EXCUSED || 0,
        color: "hsl(210, 22%, 49%)",
      },
    ];
  };

  // Mock data for line chart
  const getLineChartData = () => {
    const days = 7;
    const today = new Date();

    return [
      {
        id: "Attendance Rate",
        data: Array.from({ length: days }).map((_, i) => {
          const date = subDays(today, days - i - 1);
          return {
            x: format(date, "MMM dd"),
            y: 75 + Math.floor(Math.random() * 20), // Random value between 75-95%
          };
        }),
      },
    ];
  };

  // Mock data for student attendance
  const getStudentAttendanceData = () => {
    if (!students) return [];

    // In a real app, you would fetch actual attendance data for each student
    return students.slice(0, 5).map((student: any) => ({
      name: student.name,
      present: 85 + Math.floor(Math.random() * 15),
      absent: Math.floor(Math.random() * 10),
      late: Math.floor(Math.random() * 5),
    }));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Dashboard</h2>
          <p className="text-muted-foreground">
            View attendance statistics and trends
          </p>
        </div>

        <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
          <Select
            value={classId}
            onValueChange={(value: string) => setClassId(value)}
            disabled={isLoadingClasses}
          >
            <SelectTrigger id="class-dashboard">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingClasses ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Loading classes...</span>
                </div>
              ) : (
                classes?.items?.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select
            value={timeRange}
            onValueChange={(value: string) => setTimeRange(value as "week" | "month" | "term")}
          >
            <SelectTrigger id="time-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="term">This Term</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!classId ? (
        <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
          <div className="text-center">
            <h3 className="text-lg font-medium">Select a class to view dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Choose a class from the dropdown above to get started
            </p>
          </div>
        </div>
      ) : isLoading || isLoadingStats ? (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {classStats?.stats?.statusCounts?.PRESENT || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {calculateAttendanceRate(classStats).toFixed(1)}% attendance rate
                </p>
                <p className="text-sm font-medium mt-2">Present</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {classStats?.stats?.statusCounts?.ABSENT || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {classStats?.stats?.statusCounts?.ABSENT
                    ? ((classStats.stats.statusCounts.ABSENT / (classStats.stats.totalDays || 1)) * 100).toFixed(1)
                    : "0"}% absence rate
                </p>
                <p className="text-sm font-medium mt-2">Absent</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-amber-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {classStats?.stats?.statusCounts?.LATE || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {classStats?.stats?.statusCounts?.LATE
                    ? ((classStats.stats.statusCounts.LATE / (classStats.stats.totalDays || 1)) * 100).toFixed(1)
                    : "0"}% tardiness rate
                </p>
                <p className="text-sm font-medium mt-2">Late</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold">
                    {classStats?.stats?.statusCounts?.EXCUSED || 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {classStats?.stats?.statusCounts?.EXCUSED
                    ? ((classStats.stats.statusCounts.EXCUSED / (classStats.stats.totalDays || 1)) * 100).toFixed(1)
                    : "0"}% excused rate
                </p>
                <p className="text-sm font-medium mt-2">Excused</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Distribution</CardTitle>
                <CardDescription>
                  Breakdown of attendance by status
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsivePie
                  data={getPieChartData()}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  colors={{ datum: 'data.color' }}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  enableArcLabels={false}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor="#333333"
                  legends={[
                    {
                      anchor: 'bottom',
                      direction: 'row',
                      justify: false,
                      translateX: 0,
                      translateY: 56,
                      itemsSpacing: 0,
                      itemWidth: 100,
                      itemHeight: 18,
                      itemTextColor: '#999',
                      itemDirection: 'left-to-right',
                      itemOpacity: 1,
                      symbolSize: 18,
                      symbolShape: 'circle'
                    }
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>
                  Attendance rate over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveLine
                  data={getLineChartData()}
                  margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                  xScale={{ type: 'point' }}
                  yScale={{
                    type: 'linear',
                    min: 'auto',
                    max: 'auto',
                    stacked: false,
                    reverse: false
                  }}
                  yFormat=" >-.2f"
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Date',
                    legendOffset: 36,
                    legendPosition: 'middle'
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Rate (%)',
                    legendOffset: -40,
                    legendPosition: 'middle'
                  }}
                  pointSize={10}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  pointLabelYOffset={-12}
                  useMesh={true}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student Attendance</CardTitle>
              <CardDescription>
                Top 5 students by attendance rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getStudentAttendanceData().map((student: any) => (
                  <div key={student.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{student.name}</span>
                      <span className="text-sm">{student.present}%</span>
                    </div>
                    <Progress value={student.present} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}