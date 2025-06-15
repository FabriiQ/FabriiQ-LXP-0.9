'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Users,
  School,
  Calendar,
  Clock,
  FileText,
  ChevronLeft,
  Edit,
  Calendar as CalendarIcon,
  GraduationCap,
  Award
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SystemStatus } from "@prisma/client";
import { LoadingSpinner } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { ClassDashboard } from "@/components/class/ClassDashboard";

interface ClassDetailProps {
  id: string;
  classData: any;
  courseCampus: any;
  primaryTeacherName: string;
  assignedTeachers: any[];
  assessmentsCount: number;
  attendanceRecordsCount: number;
  gradebook: any;
  className: string;
  isLoading?: boolean;
}

export function CoordinatorClassDetail({
  id,
  classData,
  courseCampus,
  primaryTeacherName,
  assignedTeachers,
  assessmentsCount,
  attendanceRecordsCount,
  gradebook,
  className,
  isLoading = false
}: ClassDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!classData) {
    return (
      <EmptyState
        title="Class Not Found"
        description="The requested class could not be found or you don't have access to it."
        icon={<GraduationCap className="h-10 w-10" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin/coordinator/classes")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{className}</h1>
            <p className="text-muted-foreground">
              {courseCampus?.course?.name || 'No Course'} • {courseCampus?.campus?.name || 'No Campus'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/coordinator/classes/${id}/leaderboard`)}
          >
            <Award className="mr-2 h-4 w-4" />
            Leaderboard
          </Button>
        </div>
      </div>

      {/* Class Dashboard */}
      <ClassDashboard
        classId={id}
        className={className}
        initialData={{
          studentsCount: classData.students.length,
          assessmentsCount: assessmentsCount,
          activitiesCount: 0, // We'll need to fetch this from the API
          attendanceRecordsCount: attendanceRecordsCount
        }}
      />

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold">Basic Information</h3>
                  <p><span className="font-medium">Class Code:</span> {classData.code}</p>
                  <p><span className="font-medium">Course:</span> {courseCampus?.course?.name || 'Not assigned'}</p>
                  <p><span className="font-medium">Campus:</span> {courseCampus?.campus?.name || 'Not assigned'}</p>
                  <p><span className="font-medium">Current Enrollment:</span> {classData.students.length} students</p>
                  <p><span className="font-medium">Max Capacity:</span> {classData.maxCapacity || 'Unlimited'}</p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Academic Information</h3>
                  <p><span className="font-medium">Term:</span> {classData.term?.name || 'Not assigned'}</p>
                  <p><span className="font-medium">Home Teacher:</span> {primaryTeacherName || 'Not assigned'}</p>
                  <p><span className="font-medium">Total Teachers:</span> {assignedTeachers.length}</p>
                  <p><span className="font-medium">Status:</span>
                    <Badge className="ml-2" variant={classData.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {classData.status}
                    </Badge>
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Quick Links</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="justify-start" onClick={() => router.push(`/admin/coordinator/classes/${id}/schedule`)}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => router.push(`/admin/coordinator/classes/${id}/assessments`)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Assessments
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => router.push(`/admin/coordinator/classes/${id}/attendance`)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Attendance
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => router.push(`/admin/coordinator/classes/${id}/gradebook`)}>
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Gradebook
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Students</CardTitle>
              <CardDescription>Students enrolled in this class</CardDescription>
            </CardHeader>
            <CardContent>
              {classData.students && classData.students.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classData.students.map((enrollment: any) => (
                      <Card key={enrollment.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{enrollment.student.user.name}</CardTitle>
                          <CardDescription>{enrollment.student.enrollmentNumber}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex justify-between items-center">
                            <Badge variant={enrollment.status === 'ACTIVE' ? 'success' : 'secondary'}>
                              {enrollment.status}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/coordinator/students/${enrollment.studentId}`)}
                            >
                              View Profile
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No Students"
                  description="There are no students enrolled in this class."
                  icon={<Users className="h-10 w-10" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Teachers</CardTitle>
              <CardDescription>Teachers assigned to this class</CardDescription>
            </CardHeader>
            <CardContent>
              {assignedTeachers && assignedTeachers.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignedTeachers.map((teacher: any) => (
                      <Card key={teacher.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{teacher.teacher.user.name}</CardTitle>
                          <CardDescription>{teacher.teacher.employeeId}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex justify-between items-center">
                            <Badge variant={teacher.isPrimary ? 'success' : 'secondary'}>
                              {teacher.isPrimary ? 'Home Teacher' : 'Subject Teacher'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/coordinator/teachers/${teacher.teacherId}`)}
                            >
                              View Profile
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No Teachers"
                  description="There are no teachers assigned to this class."
                  icon={<Users className="h-10 w-10" />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Assessments</CardTitle>
              <CardDescription>Assessments for this class</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="Assessment View"
                description="View assessments for this class."
                icon={<FileText className="h-10 w-10" />}
                action={
                  <Button onClick={() => router.push(`/admin/coordinator/classes/${id}/assessments`)}>
                    View Assessments
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
