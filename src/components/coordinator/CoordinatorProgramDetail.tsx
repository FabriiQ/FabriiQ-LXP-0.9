'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Users,
  Building,
  Calendar,
  Clock,
  FileText,
  Settings,
  ChevronLeft,
  BarChart
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SystemStatus } from "@prisma/client";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";

interface ProgramAssignment {
  programId: string;
  programName: string;
  programCode: string;
  campusId: string;
  campusName: string;
  role: string;
  responsibilities: string[];
  assignedAt: Date;
}

interface Program {
  id: string;
  name: string;
  code: string;
  type: string;
  level: number;
  duration: number;
  status: SystemStatus;
  settings: any;
  curriculum: any;
  coordinatorAssignments: ProgramAssignment[];
  campusOfferings: {
    id: string;
    campusId: string;
    campus: {
      id: string;
      name: string;
      code: string;
    };
  }[];
  courses: {
    id: string;
    name: string;
    code: string;
    level: number;
    credits: number;
    status: SystemStatus;
  }[];
  studentCounts: Record<string, number>;
}

interface CoordinatorProgramDetailProps {
  program: Program;
  isLoading?: boolean;
}

export function CoordinatorProgramDetail({ program, isLoading = false }: CoordinatorProgramDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!program) {
    return (
      <EmptyState
        title="Program Not Found"
        description="The requested program could not be found or you don't have access to it."
        icon={<BookOpen className="h-10 w-10" />}
      />
    );
  }

  // Calculate total students across all campuses
  const totalStudents = Object.values(program.studentCounts || {}).reduce((sum, count) => sum + count, 0);

  // Get program settings
  const settings = program.settings || {};
  const description = settings.description || "No description available";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin/coordinator/programs")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{program.name}</h1>
          <Badge variant="outline">{program.code}</Badge>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/coordinator/programs/${program.id}/campus-course-analytics`)}
          >
            <BarChart className="mr-2 h-4 w-4" />
            Campus Course Analytics
          </Button>
          <Button
            variant="default"
            onClick={() => router.push(`/admin/coordinator/programs/${program.id}/analytics`)}
          >
            <BarChart className="mr-2 h-4 w-4" />
            Program Analytics
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="campuses">Campuses</TabsTrigger>
          <TabsTrigger value="analytics" onClick={() => router.push(`/admin/coordinator/programs/${program.id}/analytics`)}>Analytics</TabsTrigger>
          <TabsTrigger value="campus-course" onClick={() => router.push(`/admin/coordinator/programs/${program.id}/campus-course-analytics`)}>Course Analytics</TabsTrigger>
          <TabsTrigger value="performance" onClick={() => router.push(`/admin/coordinator/programs/${program.id}/performance`)}>Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Program Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{program.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="font-medium">{program.level}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{program.duration} months</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{description}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Program Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Courses</p>
                    <p className="text-2xl font-bold">{program.courses?.length || 0}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Students</p>
                    <p className="text-2xl font-bold">{totalStudents}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Campuses</p>
                    <p className="text-2xl font-bold">{program.coordinatorAssignments.length}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Your Role</p>
                    <p className="text-lg font-bold">Coordinator</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {program.coordinatorAssignments.flatMap(assignment =>
                  assignment.responsibilities.length > 0
                    ? assignment.responsibilities.map((resp, index) => (
                        <div key={`${assignment.campusId}-${index}`} className="flex items-start space-x-2">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                          <div>
                            <p className="font-medium">{resp}</p>
                            <p className="text-sm text-muted-foreground">Campus: {assignment.campusName}</p>
                          </div>
                        </div>
                      ))
                    : [
                        <div key={`${assignment.campusId}-default`} className="flex items-start space-x-2">
                          <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                          <div>
                            <p className="font-medium">Program coordination and oversight</p>
                            <p className="text-sm text-muted-foreground">Campus: {assignment.campusName}</p>
                          </div>
                        </div>
                      ]
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Program Courses</h2>
            <Button onClick={() => router.push(`/admin/coordinator/programs/${program.id}/courses`)}>
              View All Courses
            </Button>
          </div>

          {program.courses && program.courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {program.courses.slice(0, 4).map((course) => (
                <Card key={course.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription>{course.code}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>Level {course.level}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{course.credits} Credits</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/admin/coordinator/courses/${course.id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Courses"
              description="This program doesn't have any courses yet."
              icon={<BookOpen className="h-10 w-10" />}
            />
          )}

          {program.courses && program.courses.length > 4 && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/coordinator/programs/${program.id}/courses`)}
              >
                View All {program.courses.length} Courses
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="students" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Program Students</h2>
            <Button onClick={() => router.push(`/admin/coordinator/programs/${program.id}/students`)}>
              View All Students
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student Enrollment</CardTitle>
              <CardDescription>Students enrolled in this program across campuses</CardDescription>
            </CardHeader>
            <CardContent>
              {program.campusOfferings && program.campusOfferings.length > 0 ? (
                <div className="space-y-4">
                  {program.campusOfferings.map((offering) => (
                    <div key={offering.id} className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{offering.campus.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{program.studentCounts[offering.id] || 0} Students</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 font-medium">
                    <span>Total Enrollment</span>
                    <span>{totalStudents} Students</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No campus offerings available</p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/admin/coordinator/programs/${program.id}/students`)}
              >
                View Student Details
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="campuses" className="space-y-4 mt-4">
          <h2 className="text-xl font-semibold">Campus Offerings</h2>

          {program.campusOfferings && program.campusOfferings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {program.campusOfferings.map((offering) => {
                const assignment = program.coordinatorAssignments.find(
                  a => a.campusId === offering.campusId
                );

                return (
                  <Card key={offering.id}>
                    <CardHeader>
                      <CardTitle>{offering.campus.name}</CardTitle>
                      <CardDescription>{offering.campus.code}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{program.studentCounts[offering.id] || 0} Students</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Since {assignment ? new Date(assignment.assignedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>

                      {assignment && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Your Role</p>
                          <Badge variant="outline">{assignment.role}</Badge>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`/admin/coordinator/programs/${program.id}?campusId=${offering.campusId}`)}
                      >
                        View Campus Details
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No Campus Offerings"
              description="This program is not offered at any campuses you coordinate."
              icon={<Building className="h-10 w-10" />}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
