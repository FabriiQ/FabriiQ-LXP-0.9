'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
// Import our fixed HeatMap component instead of the original
import { FixedResponsiveHeatMap } from "@/components/charts/FixedHeatMap";

interface AttendanceOverviewProps {
  attendanceData: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  weeklyData?: any[];
  dailyData?: any[];
}

export function AttendanceOverview({
  attendanceData,
  weeklyData = [],
  dailyData = []
}: AttendanceOverviewProps) {
  const [view, setView] = useState<"summary" | "weekly" | "daily">("summary");

  // Calculate total and attendance rate
  const total = attendanceData.present + attendanceData.absent + attendanceData.late + attendanceData.excused;
  const attendanceRate = total > 0 ? (attendanceData.present / total) * 100 : 0;

  // Prepare data for pie chart
  const pieData = [
    { id: "Present", label: "Present", value: attendanceData.present, color: "#10b981" },
    { id: "Absent", label: "Absent", value: attendanceData.absent, color: "#ef4444" },
    { id: "Late", label: "Late", value: attendanceData.late, color: "#f59e0b" },
    { id: "Excused", label: "Excused", value: attendanceData.excused, color: "#6366f1" }
  ];

  // Default weekly data if none provided
  const defaultWeeklyData = [
    { day: "Monday", present: 85, absent: 10, late: 5 },
    { day: "Tuesday", present: 90, absent: 5, late: 5 },
    { day: "Wednesday", present: 80, absent: 15, late: 5 },
    { day: "Thursday", present: 88, absent: 7, late: 5 },
    { day: "Friday", present: 75, absent: 20, late: 5 }
  ];

  // Default daily data for heatmap if none provided
  const defaultDailyData = [
    { id: "Monday", data: [{ x: "Period 1", y: 0.95 }, { x: "Period 2", y: 0.90 }, { x: "Period 3", y: 0.85 }] },
    { id: "Tuesday", data: [{ x: "Period 1", y: 0.90 }, { x: "Period 2", y: 0.85 }, { x: "Period 3", y: 0.80 }] },
    { id: "Wednesday", data: [{ x: "Period 1", y: 0.85 }, { x: "Period 2", y: 0.80 }, { x: "Period 3", y: 0.75 }] },
    { id: "Thursday", data: [{ x: "Period 1", y: 0.80 }, { x: "Period 2", y: 0.75 }, { x: "Period 3", y: 0.70 }] },
    { id: "Friday", data: [{ x: "Period 1", y: 0.75 }, { x: "Period 2", y: 0.70 }, { x: "Period 3", y: 0.65 }] }
  ];

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Attendance Overview</CardTitle>
        <CardDescription>
          Class attendance statistics and trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col justify-center items-center">
                <div className="text-4xl font-bold text-primary">
                  {attendanceRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Overall attendance rate
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 w-full">
                  <div className="text-center">
                    <div className="text-xl font-semibold">{attendanceData.present}</div>
                    <div className="text-xs text-muted-foreground">Present</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold">{attendanceData.absent}</div>
                    <div className="text-xs text-muted-foreground">Absent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold">{attendanceData.late}</div>
                    <div className="text-xs text-muted-foreground">Late</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold">{attendanceData.excused}</div>
                    <div className="text-xs text-muted-foreground">Excused</div>
                  </div>
                </div>
              </div>

              <div className="h-[250px]">
                <ResponsivePie
                  data={pieData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ scheme: 'set2' }}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor="#333333"
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: 'color' }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                  legends={[
                    {
                      anchor: 'bottom',
                      direction: 'row',
                      justify: false,
                      translateX: 0,
                      translateY: 56,
                      itemsSpacing: 0,
                      itemWidth: 70,
                      itemHeight: 18,
                      itemTextColor: '#999',
                      itemDirection: 'left-to-right',
                      itemOpacity: 1,
                      symbolSize: 12,
                      symbolShape: 'circle',
                    }
                  ]}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="weekly">
            <div className="h-[300px]">
              {(weeklyData && weeklyData.length > 0) || defaultWeeklyData ? (
                <ResponsiveBar
                  data={weeklyData && weeklyData.length > 0 ? weeklyData : defaultWeeklyData}
                  keys={['present', 'absent', 'late']}
                  indexBy="day"
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
                    tickRotation: 0,
                    legend: 'Day',
                    legendPosition: 'middle',
                    legendOffset: 32
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Count',
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
                    }
                  ]}
                  animate={true}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No weekly attendance data available</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="daily">
            <div className="h-[300px]">
              {(() => {
                // Ensure we have valid data for the heatmap
                const heatmapData = Array.isArray(dailyData) && dailyData.length > 0
                  ? dailyData
                  : defaultDailyData;

                // Validate that each item in the data has a valid 'data' array
                const isValidHeatmapData = heatmapData.every(item =>
                  item && typeof item === 'object' &&
                  Array.isArray(item.data) &&
                  item.data.length > 0
                );

                return isValidHeatmapData ? (
                  <FixedResponsiveHeatMap
                    data={heatmapData}
                    margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
                    valueFormat=">-.2%"
                    axisTop={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -90,
                      legend: '',
                      legendOffset: 46
                    }}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Period',
                      legendPosition: 'middle',
                      legendOffset: 36
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Day',
                      legendPosition: 'middle',
                      legendOffset: -72
                    }}
                    colors={{
                      type: 'sequential',
                      scheme: 'blues'
                    }}
                    emptyColor="#555555"
                    legends={[
                      {
                        anchor: 'bottom',
                        translateX: 0,
                        translateY: 30,
                        length: 400,
                        thickness: 8,
                        direction: 'row',
                        tickPosition: 'after',
                        tickSize: 3,
                        tickSpacing: 4,
                        tickOverlap: false,
                        tickFormat: '>-.2%',
                        title: 'Attendance Rate →',
                        titleAlign: 'start',
                        titleOffset: 4
                      }
                    ]}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No attendance data available</p>
                  </div>
                );
              })()}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
