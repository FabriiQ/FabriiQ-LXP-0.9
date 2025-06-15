"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentLeaderboardView } from "@/components/coordinator/leaderboard/StudentLeaderboardView";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Award, Home } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentLeaderboardAnalytics } from "@/components/coordinator/leaderboard/StudentLeaderboardAnalytics";
import { api } from "@/trpc/react";

/**
 * Student Leaderboard Page
 *
 * This page displays the student leaderboard and related analytics.
 * It reuses components from the coordinator portal.
 */
export default function StudentLeaderboardPage() {
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("term");

  // Fetch programs data from API
  const { data: programs, isLoading: isLoadingPrograms } = api.program.getAllPrograms.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  // Fetch courses data based on selected program
  const { data: courses, isLoading: isLoadingCourses } = api.course.getCoursesByProgram.useQuery(
    { programId: selectedProgram || undefined },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      enabled: !!selectedProgram || selectedProgram === "", // Run if empty string (all programs) or specific program
    }
  );

  // Fetch classes data based on selected course
  const { data: classes, isLoading: isLoadingClasses } = api.class.getClassesByCourse.useQuery(
    { courseId: selectedCourse || undefined },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      enabled: !!selectedCourse || selectedCourse === "", // Run if empty string (all courses) or specific course
    }
  );

  // No need to filter courses and classes as the API already returns filtered data

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/principal">
              <Home className="h-4 w-4 mr-1" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/principal/student-leaderboard">
              <Award className="h-4 w-4 mr-1" />
              Student Leaderboard
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Student Leaderboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger>
              <SelectValue placeholder="Select Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Programs</SelectItem>
              {isLoadingPrograms ? (
                <SelectItem value="" disabled>Loading programs...</SelectItem>
              ) : programs && programs.length > 0 ? (
                programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>No programs found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select
            value={selectedCourse}
            onValueChange={setSelectedCourse}
            disabled={!selectedProgram}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Courses</SelectItem>
              {isLoadingCourses ? (
                <SelectItem value="" disabled>Loading courses...</SelectItem>
              ) : courses && courses.length > 0 ? (
                courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>No courses found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select
            value={selectedClass}
            onValueChange={setSelectedClass}
            disabled={!selectedCourse}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Classes</SelectItem>
              {isLoadingClasses ? (
                <SelectItem value="" disabled>Loading classes...</SelectItem>
              ) : classes && classes.length > 0 ? (
                classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>No classes found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger>
              <SelectValue placeholder="Select Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="term">Term</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Ranking</CardTitle>
              <CardDescription>
                Students ranked by academic performance and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentLeaderboardView
                programId={selectedProgram || undefined}
                courseId={selectedCourse || undefined}
                classId={selectedClass || undefined}
                timeframe={selectedTimeframe as any}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard Analytics</CardTitle>
              <CardDescription>
                Detailed analysis of student performance trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentLeaderboardAnalytics
                programId={selectedProgram || undefined}
                courseId={selectedCourse || undefined}
                classId={selectedClass || undefined}
                timeframe={selectedTimeframe as any}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
