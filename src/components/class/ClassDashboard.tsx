'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { ClassSummaryStats } from "./ClassSummaryStats";
import { AttendanceOverview } from "./AttendanceOverview";
import { UpcomingAssessments } from "./UpcomingAssessments";
import { UpcomingActivities } from "./UpcomingActivities";
import { TopStudentsLeaderboard } from "@/app/admin/campus/classes/[id]/components/TopStudentsLeaderboard";
import { api } from "@/utils/api";
// Force refresh

interface ClassDashboardProps {
  classId: string;
  className: string;
  initialData: {
    studentsCount: number;
    assessmentsCount: number;
    activitiesCount: number;
    attendanceRecordsCount: number;
  };
}

export function ClassDashboard({
  classId,
  className,
  initialData
}: ClassDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch class analytics data
  const { data: analyticsData, refetch: refetchAnalytics } = api.classAnalytics.getClassStats.useQuery(
    { classId },
    {
      initialData: {
        averageGrade: 0,
        completionRate: 0,
        attendanceData: {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0
        },
        weeklyAttendance: [],
        dailyAttendance: []
      },
      refetchOnWindowFocus: false
    }
  );

  // Fetch upcoming assessments
  const { data: upcomingAssessments, refetch: refetchAssessments } = api.assessment.getUpcomingForClass.useQuery(
    { classId, limit: 5 },
    {
      initialData: [],
      refetchOnWindowFocus: false
    }
  );

  // Fetch upcoming activities
  const { data: upcomingActivities, refetch: refetchActivities } = api.activity.getUpcomingForClass.useQuery(
    { classId, limit: 5 },
    {
      initialData: [],
      refetchOnWindowFocus: false
    }
  );

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchAnalytics(),
      refetchAssessments(),
      refetchActivities()
    ]);
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">{className} Dashboard</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <ClassSummaryStats
            studentsCount={initialData.studentsCount}
            assessmentsCount={initialData.assessmentsCount}
            activitiesCount={initialData.activitiesCount || 0}
            attendanceRecordsCount={initialData.attendanceRecordsCount}
            averageGrade={analyticsData?.averageGrade || 0}
            completionRate={analyticsData?.completionRate || 0}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AttendanceOverview
              attendanceData={analyticsData?.attendanceData || {
                present: 0,
                absent: 0,
                late: 0,
                excused: 0
              }}
              weeklyData={analyticsData?.weeklyAttendance || []}
              dailyData={analyticsData?.dailyAttendance || []}
            />

            <div className="space-y-6">
              <UpcomingAssessments
                classId={classId}
                assessments={upcomingAssessments as any || []}
              />

              <UpcomingActivities
                classId={classId}
                activities={upcomingActivities || []}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Students</CardTitle>
              <CardDescription>
                Students with the highest academic performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopStudentsLeaderboard classId={classId} className={className} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6 mt-6">
          <AttendanceOverview
            attendanceData={analyticsData?.attendanceData || {
              present: 0,
              absent: 0,
              late: 0,
              excused: 0
            }}
            weeklyData={analyticsData?.weeklyAttendance || []}
            dailyData={analyticsData?.dailyAttendance || []}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Class Performance</CardTitle>
              <CardDescription>
                Academic performance metrics for this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
                  {/* Grade distribution chart would go here */}
                  <div className="h-[300px] bg-muted rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">Grade distribution chart</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Assessment Completion</h3>
                  {/* Assessment completion chart would go here */}
                  <div className="h-[300px] bg-muted rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">Assessment completion chart</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Top Performing Students</h3>
                <TopStudentsLeaderboard classId={classId} className={className} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
