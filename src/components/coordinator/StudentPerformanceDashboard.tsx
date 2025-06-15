'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft,
  GraduationCap,
  BookOpen,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  User
} from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";
import { LineChart } from "@/components/ui/charts/LineChart";
import { BarChart } from "@/components/ui/charts/BarChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface StudentPerformanceDashboardProps {
  studentId: string;
  programId?: string;
  enrollmentId?: string;
  backUrl?: string;
}

export function StudentPerformanceDashboard({
  studentId,
  programId,
  enrollmentId,
  backUrl = "/admin/coordinator/programs"
}: StudentPerformanceDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch student performance data
  const { data, isLoading, error } = api.studentPerformance.getStudentPerformance.useQuery({
    studentId,
    programId,
    enrollmentId
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-destructive">
            Error: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.success) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No performance data available for this student
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format course performance data for the bar chart
  const coursePerformanceData = data.performance.coursePerformance.map(course => ({
    courseName: course.courseName,
    gradePercentage: parseFloat(course.gradePercentage.toFixed(1))
  }));

  // Format recent activities for display
  const recentActivities = data.performance.recentActivities.map(activity => ({
    ...activity,
    percentage: parseFloat(activity.percentage.toFixed(1))
  }));

  // Helper function to get grade letter
  function getGradeLetter(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  // Helper function to get grade color
  function getGradeColor(percentage: number): string {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 80) return 'text-blue-500';
    if (percentage >= 70) return 'text-yellow-500';
    if (percentage >= 60) return 'text-orange-500';
    return 'text-red-500';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => router.push(backUrl)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Student Performance</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" alt={data.student.name || ""} />
              <AvatarFallback>
                {data.student.name?.charAt(0) || "S"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold">{data.student.name}</h3>
              <p className="text-muted-foreground">{data.student.email}</p>
              <div className="flex items-center mt-1 space-x-2">
                <Badge variant="outline">{data.student.enrollmentNumber}</Badge>
                <Badge variant="outline">{data.enrollment.program}</Badge>
                <Badge variant="outline">{data.enrollment.campus}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Overall Grade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <div className={`text-3xl font-bold ${getGradeColor(data.performance.overallGrade)}`}>
                    {getGradeLetter(data.performance.overallGrade)}
                  </div>
                  <div className="ml-2 text-xl">
                    {data.performance.overallGrade.toFixed(1)}%
                  </div>
                </div>
                <Progress 
                  value={data.performance.overallGrade} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.performance.attendanceRate.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.performance.attendedSessions} of {data.performance.totalSessions} sessions
                </p>
                <Progress 
                  value={data.performance.attendanceRate} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.performance.coursePerformance.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Enrolled courses
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
              <CardDescription>
                Grade performance across courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <BarChart
                  data={coursePerformanceData}
                  xAxisKey="courseName"
                  bars={[
                    { dataKey: "gradePercentage", name: "Grade (%)", color: "#3b82f6" }
                  ]}
                  height={300}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Latest graded activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="font-medium">{activity.activityName}</p>
                        <p className="text-sm text-muted-foreground">{activity.courseName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getGradeColor(activity.percentage)}`}>
                          {activity.points} / {activity.maxPoints}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No recent activities
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4">
            {data.performance.classes.map((classItem) => (
              <Card key={classItem.id}>
                <CardHeader className="pb-2">
                  <CardTitle>{classItem.courseCampus.course.name}</CardTitle>
                  <CardDescription>
                    {classItem.name} • {classItem.code}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Term</p>
                      <p className="font-medium">{classItem.term.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teacher</p>
                      <p className="font-medium">{classItem.classTeacher?.name || "Not assigned"}</p>
                    </div>
                  </div>

                  {data.performance.coursePerformance.find(c => c.courseId === classItem.courseCampus.courseId) && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Performance</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline">
                          <div className={`text-xl font-bold ${
                            getGradeColor(
                              data.performance.coursePerformance.find(
                                c => c.courseId === classItem.courseCampus.courseId
                              )?.gradePercentage || 0
                            )
                          }`}>
                            {getGradeLetter(
                              data.performance.coursePerformance.find(
                                c => c.courseId === classItem.courseCampus.courseId
                              )?.gradePercentage || 0
                            )}
                          </div>
                          <div className="ml-2">
                            {data.performance.coursePerformance.find(
                              c => c.courseId === classItem.courseCampus.courseId
                            )?.gradePercentage.toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {data.performance.coursePerformance.find(
                            c => c.courseId === classItem.courseCampus.courseId
                          )?.totalActivities || 0} activities
                        </div>
                      </div>
                      <Progress 
                        value={data.performance.coursePerformance.find(
                          c => c.courseId === classItem.courseCampus.courseId
                        )?.gradePercentage || 0} 
                        className="mt-2" 
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/admin/coordinator/classes/${classItem.id}/students/${studentId}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Performance</CardTitle>
              <CardDescription>
                All graded activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 bg-muted p-3 text-sm font-medium">
                      <div className="col-span-5">Activity</div>
                      <div className="col-span-3">Course</div>
                      <div className="col-span-2">Date</div>
                      <div className="col-span-2 text-right">Score</div>
                    </div>
                    
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="grid grid-cols-12 p-3 text-sm border-t">
                        <div className="col-span-5">
                          <p className="font-medium">{activity.activityName}</p>
                        </div>
                        <div className="col-span-3">
                          <p>{activity.courseName}</p>
                        </div>
                        <div className="col-span-2">
                          <p>{new Date(activity.date).toLocaleDateString()}</p>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className={`font-bold ${getGradeColor(activity.percentage)}`}>
                            {activity.points} / {activity.maxPoints}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No activities found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
