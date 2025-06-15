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
  Users,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  User,
  Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";
import { BarChart } from "@/components/ui/charts/BarChart";
import { PieChart } from "@/components/ui/charts/PieChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

interface CohortPerformanceDashboardProps {
  programId: string;
  programName: string;
  campusId?: string;
  backUrl?: string;
}

export function CohortPerformanceDashboard({
  programId,
  programName,
  campusId,
  backUrl = "/admin/coordinator/programs"
}: CohortPerformanceDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch cohort performance data
  const { data, isLoading, error } = api.studentPerformance.getCohortPerformance.useQuery({
    programId,
    campusId
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
            No performance data available for this cohort
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format grade distribution data for the pie chart
  const gradeDistributionData = data.performance.gradeDistribution.map(item => ({
    name: item.range,
    value: item.count,
    color: getGradeRangeColor(item.range)
  }));

  // Format course performance data for the bar chart
  const coursePerformanceData = data.performance.coursePerformance.map(course => ({
    courseName: course.courseName,
    gradePercentage: parseFloat(course.gradePercentage.toFixed(1))
  }));

  // Filter student performance based on search term
  const filteredStudents = data.performance.studentPerformance.filter(student => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return student.studentName.toLowerCase().includes(searchLower);
  });

  // Helper function to get grade range color
  function getGradeRangeColor(range: string): string {
    switch (range) {
      case '90-100': return '#10b981'; // green
      case '80-89': return '#3b82f6'; // blue
      case '70-79': return '#f59e0b'; // yellow
      case '60-69': return '#f97316'; // orange
      case '0-59': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  }

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
        <h1 className="text-2xl font-bold">Cohort Performance</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Cohort Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold">{programName}</h3>
              <div className="flex items-center mt-1 space-x-2">
                <Badge variant="outline">{data.cohort.program.code}</Badge>
                <Badge variant="outline">{data.cohort.campus.name}</Badge>
                <Badge variant="outline">{data.cohort.totalStudents} Students</Badge>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <Button 
                variant="outline"
                onClick={() => router.push(`/admin/coordinator/programs/${programId}/students`)}
              >
                <Users className="mr-2 h-4 w-4" />
                View All Students
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Average Grade
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
                  Average attendance rate
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
                  <Users className="mr-2 h-4 w-4" />
                  Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.cohort.totalStudents}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total enrolled students
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>
                  Distribution of grades across the cohort
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <PieChart
                  data={gradeDistributionData}
                  height={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
                <CardDescription>
                  Average grades by course
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <BarChart
                  data={coursePerformanceData}
                  xAxisKey="courseName"
                  bars={[
                    { dataKey: "gradePercentage", name: "Grade (%)", color: "#3b82f6" }
                  ]}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>
                Students with the highest grades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.performance.topPerformers.map((student, index) => (
                  <div key={student.studentId} className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{student.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.totalActivities} activities completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getGradeColor(student.gradePercentage)}`}>
                        {getGradeLetter(student.gradePercentage)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.gradePercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
              <CardDescription>
                Individual student performance in the cohort
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="rounded-md border">
                <div className="grid grid-cols-12 bg-muted p-3 text-sm font-medium">
                  <div className="col-span-5">Student</div>
                  <div className="col-span-2">Grade</div>
                  <div className="col-span-3">Activities</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <div key={student.studentId} className="grid grid-cols-12 p-3 text-sm border-t">
                      <div className="col-span-5">
                        <p className="font-medium">{student.studentName}</p>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center">
                          <span className={`font-bold ${getGradeColor(student.gradePercentage)}`}>
                            {getGradeLetter(student.gradePercentage)}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            {student.gradePercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <p>{student.totalActivities} completed</p>
                      </div>
                      <div className="col-span-2 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/admin/coordinator/students/${student.studentId}/performance?programId=${programId}`)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No students match your search
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
              <CardDescription>
                Performance across different courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.performance.coursePerformance.map((course) => (
                  <div key={course.courseId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{course.courseName}</h3>
                      <div className="flex items-center">
                        <span className={`font-bold ${getGradeColor(course.gradePercentage)}`}>
                          {getGradeLetter(course.gradePercentage)}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          {course.gradePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={course.gradePercentage} />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{course.totalActivities} activities</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/admin/coordinator/courses/${course.courseId}`)}
                      >
                        View Course
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
