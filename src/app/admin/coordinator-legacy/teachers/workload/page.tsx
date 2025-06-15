'use client';

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";
import { SystemStatus } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { BarChart } from "@/components/ui/charts/BarChart";
import { PieChart } from "@/components/ui/charts/PieChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function TeacherWorkloadPage() {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  // Fetch teachers
  const { data: teachersData, isLoading: teachersLoading } = api.teacher.getAll.useQuery({
    status: SystemStatus.ACTIVE,
  });

  // Fetch teacher workload
  const { data: workloadData, isLoading: workloadLoading } = api.teacherAssignment.getTeacherWorkload.useQuery(
    { teacherId: selectedTeacherId },
    { enabled: !!selectedTeacherId }
  );

  const isLoading = teachersLoading || (selectedTeacherId && workloadLoading);

  // Format data for charts
  const courseDistributionData = workloadData?.workload.courseDistribution.map(course => ({
    name: course.courseName,
    value: course.classes.length,
    color: getRandomColor(course.courseId)
  })) || [];

  const campusDistributionData = workloadData?.workload.campusDistribution.map(campus => ({
    name: campus.campusName,
    value: campus.classes.length,
    color: getRandomColor(campus.campusId)
  })) || [];

  // Helper function to generate a deterministic color
  function getRandomColor(id: string): string {
    const hash = id.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // yellow
      '#ec4899', // pink
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#ef4444', // red
      '#6b7280', // gray
    ];
    
    return colors[Math.abs(hash) % colors.length];
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Teacher Workload"
        description="Monitor and analyze teacher workload across programs and campuses"
      />
      
      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select a Teacher</CardTitle>
            <CardDescription>
              Choose a teacher to view their workload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedTeacherId}
              onValueChange={setSelectedTeacherId}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachersData?.items.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name || teacher.email || teacher.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedTeacherId && (
          <>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                {workloadData ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Teacher Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src="" alt={workloadData.teacher.name || ""} />
                            <AvatarFallback>
                              {workloadData.teacher.name?.charAt(0) || "T"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-xl font-bold">{workloadData.teacher.name}</h3>
                            <p className="text-muted-foreground">{workloadData.teacher.email}</p>
                            {workloadData.teacher.specialization && (
                              <Badge variant="outline" className="mt-1">
                                {workloadData.teacher.specialization}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Classes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {workloadData.workload.totalClasses}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Total assigned classes
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Students</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {workloadData.workload.totalStudents}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Total students taught
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Activities</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {workloadData.workload.totalActivities}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Total learning activities
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Assessments</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {workloadData.workload.totalAssessments}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Total assessments managed
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Course Distribution</CardTitle>
                          <CardDescription>
                            Classes by course
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          <PieChart
                            data={courseDistributionData}
                            height={250}
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Campus Distribution</CardTitle>
                          <CardDescription>
                            Classes by campus
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          <PieChart
                            data={campusDistributionData}
                            height={250}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-muted-foreground">
                        No workload data available for this teacher
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
