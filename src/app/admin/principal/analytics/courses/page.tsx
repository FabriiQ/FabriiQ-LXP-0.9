"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { BarChart, Home } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseAnalyticsDashboard } from "@/components/coordinator/analytics/CourseAnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/trpc/react";

/**
 * Course Analytics Page
 *
 * This page displays analytics for courses across the campus.
 * It reuses components from the coordinator portal.
 */
export default function CourseAnalyticsPage() {
  const { toast } = useToast();
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("month");
  const [isExporting, setIsExporting] = useState(false);

  // Fetch programs data from API
  const { data: programs, isLoading: isLoadingPrograms } = api.program.getAllPrograms.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  // Fetch courses data based on selected program
  const { data: coursesData, isLoading: isLoadingCourses } = api.coordinator.getProgramCourses.useQuery(
    { programId: selectedProgram || "" }, // Ensure programId is always a string
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      enabled: !!selectedProgram || selectedProgram === "", // Run if empty string (all programs) or specific program
    }
  );

  // Extract courses array from response or use empty array as fallback
  const courses = coursesData?.courses || [];

  // No need to filter courses as the API already returns filtered data

  // Handle export button click
  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Export successful",
        description: "Course analytics data has been exported to Excel.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

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
            <BreadcrumbLink href="/admin/principal/analytics/courses">
              <BarChart className="h-4 w-4 mr-1" />
              Course Analytics
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Course Analytics
        </h1>

        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="self-start md:self-auto"
        >
          {isExporting ? "Exporting..." : "Export to Excel"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
              <CardDescription>
                Performance metrics for selected courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseAnalyticsDashboard
                courseId={selectedCourse || undefined}
                programId={selectedProgram || undefined}
                timeframe={selectedTimeframe as any}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollment">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Analytics</CardTitle>
              <CardDescription>
                Enrollment trends and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* This would use a specialized enrollment analytics component */}
              <p className="text-muted-foreground">
                Enrollment analytics will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Analytics</CardTitle>
              <CardDescription>
                Attendance patterns and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* This would use a specialized attendance analytics component */}
              <p className="text-muted-foreground">
                Attendance analytics will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Course Comparison</CardTitle>
              <CardDescription>
                Side-by-side comparison of courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* This would use a specialized course comparison component */}
              <p className="text-muted-foreground">
                Course comparison analytics will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}





