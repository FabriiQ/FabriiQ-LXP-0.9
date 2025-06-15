"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { FixedResponsiveHeatMap } from "@/components/charts/FixedHeatMap";
import { AttendanceTrend, StudentComparison, PieChartData } from "@/types/attendance";

interface Class {
  id: string;
  name: string;
}

interface AttendanceAnalyticsProps {
  defaultClassId?: string;
  compact?: boolean;
  className?: string;
  campusId: string;
}

export function AttendanceAnalytics({
  defaultClassId,
  compact = false,
  className = "",
  campusId,
}: AttendanceAnalyticsProps) {
  const [classId, setClassId] = useState(defaultClassId || "");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "term">("week");
  const [viewType, setViewType] = useState<"overview" | "students" | "trends">("overview");
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

  // Fetch students in the class
  const { data: students } = api.student.getStudentEnrollments.useQuery(
    { classId, campusId },
    { enabled: !!classId }
  );

  // Fetch attendance stats for the selected class
  const { data: classStats, isLoading: isLoadingStats } = api.attendance.getByQuery.useQuery(
    { classId },
    { enabled: !!classId }
  );

  // Mock data for attendance trends over time
  const getTrendData = (): AttendanceTrend[] => {
    const days = 14;
    const today = new Date();

    return Array.from({ length: days }).map((_, i) => {
      const date = subDays(today, days - i - 1);
      return {
        date: format(date, "MMM dd"),
        present: 75 + Math.floor(Math.random() * 15),
        absent: Math.floor(Math.random() * 10),
        late: Math.floor(Math.random() * 8),
        excused: Math.floor(Math.random() * 5),
        rate: 75 + Math.floor(Math.random() * 20),
      };
    });
  };

  // Mock data for student comparison
  const getStudentComparisonData = (): StudentComparison[] => {
    if (!students) return [];

    return students.slice(0, 10).map((student: any) => ({
      studentId: student.id,
      studentName: student.name,
      presentRate: 70 + Math.floor(Math.random() * 30),
      absentRate: Math.floor(Math.random() * 15),
      lateRate: Math.floor(Math.random() * 10),
      excusedRate: Math.floor(Math.random() * 5),
    }));
  };

  // Mock data for attendance heatmap
  const getHeatmapData = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    return days.map(day => ({
      id: day,
      data: [
        { x: "Period 1", y: Math.floor(Math.random() * 100) },
        { x: "Period 2", y: Math.floor(Math.random() * 100) },
        { x: "Period 3", y: Math.floor(Math.random() * 100) },
        { x: "Period 4", y: Math.floor(Math.random() * 100) },
        { x: "Period 5", y: Math.floor(Math.random() * 100) },
      ]
    }));
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

  // Format trend data for line chart
  const getLineData = () => {
    const trendData = getTrendData();

    return [
      {
        id: "Attendance Rate",
        data: trendData.map(d => ({ x: d.date, y: d.rate })),
      },
      {
        id: "Present",
        data: trendData.map(d => ({ x: d.date, y: d.present })),
      },
      {
        id: "Absent",
        data: trendData.map(d => ({ x: d.date, y: d.absent })),
      },
    ];
  };

  // Format student data for bar chart
  const getBarData = () => {
    return getStudentComparisonData().map(student => ({
      student: student.studentName,
      present: student.presentRate,
      absent: student.absentRate,
      late: student.lateRate,
      excused: student.excusedRate,
    }));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Analytics</h2>
          <p className="text-muted-foreground">
            Analyze attendance patterns and trends
          </p>
        </div>

        <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
          <Select
            value={classId}
            onValueChange={(value: string) => setClassId(value)}
            disabled={isLoadingClasses}
          >
            <SelectTrigger id="class-analytics" className="w-[180px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingClasses ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Loading classes...</span>
                </div>
              ) : (
                classes?.items?.map((cls: Class) => (
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
            <SelectTrigger id="time-range" className="w-[150px]">
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
            <h3 className="text-lg font-medium">Select a class to view analytics</h3>
            <p className="text-sm text-muted-foreground">
              Choose a class from the dropdown above to get started
            </p>
          </div>
        </div>
      ) : isLoading || isLoadingStats ? (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading analytics...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <Tabs defaultValue="overview" value={viewType} onValueChange={(v) => setViewType(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="students">By Student</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    <CardTitle>Attendance by Day & Period</CardTitle>
                    <CardDescription>
                      Heatmap showing attendance rates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <FixedResponsiveHeatMap
                      data={getHeatmapData()}
                      margin={{ top: 50, right: 60, bottom: 30, left: 60 }}
                      valueFormat=">-.2%"
                      axisTop={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Period',
                        legendPosition: 'middle',
                        legendOffset: -36
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Day',
                        legendPosition: 'middle',
                        legendOffset: -40
                      }}
                      hoverTarget="cell"
                      cellOpacity={1}
                      colorScaleConfig={{
                        type: 'sequential',
                        scheme: 'blues'
                      }}
                      animate={true}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="students" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Attendance Comparison</CardTitle>
                  <CardDescription>
                    Compare attendance rates across students
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[500px]">
                  <ResponsiveBar
                    data={getBarData()}
                    keys={['present', 'absent', 'late', 'excused']}
                    indexBy="student"
                    margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                    padding={0.3}
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={{ scheme: 'nivo' }}
                    borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 45,
                      legend: 'Student',
                      legendPosition: 'middle',
                      legendOffset: 40
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Rate (%)',
                      legendPosition: 'middle',
                      legendOffset: -40
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    legends={[
                      {
                        dataFrom: 'keys',
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 120,
                        translateY: 0,
                        itemsSpacing: 2,
                        itemWidth: 100,
                        itemHeight: 20,
                        itemDirection: 'left-to-right',
                        itemOpacity: 0.85,
                        symbolSize: 20,
                        effects: [
                          {
                            on: 'hover',
                            style: {
                              itemOpacity: 1
                            }
                          }
                        ]
                      }
                    ]}
                    animate={true}
                    role="application"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends Over Time</CardTitle>
                  <CardDescription>
                    Track attendance patterns over the selected time period
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveLine
                    data={getLineData()}
                    margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
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
                    legends={[
                      {
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle',
                        symbolBorderColor: 'rgba(0, 0, 0, .5)',
                        effects: [
                          {
                            on: 'hover',
                            style: {
                              itemBackground: 'rgba(0, 0, 0, .03)',
                              itemOpacity: 1
                            }
                          }
                        ]
                      }
                    ]}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}