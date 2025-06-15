'use client';

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Users,
  BarChart,
  ClipboardCheck,
  Calendar,
  GraduationCap,
  Book
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface CourseDetailsContentProps {
  courseCampus: any;
  classes: any[];
  analytics: {
    studentCount: number;
    attendanceRate: number;
    assessmentCount: number;
    classCount: number;
  };
}

export function CourseDetailsContent({
  courseCampus,
  classes,
  analytics
}: CourseDetailsContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{courseCampus.course.name}</CardTitle>
                  <CardDescription className="text-base">
                    {courseCampus.course.code} | {courseCampus.course.program.name}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center p-4 bg-muted/50 rounded-md">
                    <Users className="h-5 w-5 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Students</span>
                    <span className="text-xl font-medium">{analytics.studentCount}</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted/50 rounded-md">
                    <BarChart className="h-5 w-5 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Classes</span>
                    <span className="text-xl font-medium">{analytics.classCount}</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted/50 rounded-md">
                    <ClipboardCheck className="h-5 w-5 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Assessments</span>
                    <span className="text-xl font-medium">{analytics.assessmentCount}</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted/50 rounded-md">
                    <Calendar className="h-5 w-5 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Attendance</span>
                    <span className="text-xl font-medium">{analytics.attendanceRate}%</span>
                  </div>
                </div>

                {courseCampus.course.description && (
                  <div className="pt-4">
                    <h3 className="text-lg font-medium mb-2">Description</h3>
                    <p className="text-muted-foreground">{courseCampus.course.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Classes</CardTitle>
              <CardDescription>
                Classes currently running for this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              {classes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead className="text-center">Students</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.code}</TableCell>
                        <TableCell>{cls.term.name}</TableCell>
                        <TableCell>
                          {cls.classTeacher?.user?.name || "Not assigned"}
                        </TableCell>
                        <TableCell className="text-center">{cls._count.students}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/campus/classes/${cls.id}`}>
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No classes found for this course</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href={`/admin/campus/classes/new?courseId=${courseCampus.id}`}>
                      Create Class
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:w-1/3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Credits</span>
                  <span className="font-medium">{courseCampus.course.credits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Level</span>
                  <span className="font-medium">{courseCampus.course.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Program</span>
                  <span className="font-medium">{courseCampus.course.program.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Campus</span>
                  <span className="font-medium">{courseCampus.campus.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium">
                    {new Date(courseCampus.startDate).toLocaleDateString()}
                  </span>
                </div>
                {courseCampus.endDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">End Date</span>
                    <span className="font-medium">
                      {new Date(courseCampus.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
              <CardDescription>
                Subjects covered in this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              {courseCampus.course.subjects.length > 0 ? (
                <div className="space-y-2">
                  {courseCampus.course.subjects.map((subject: any) => (
                    <div
                      key={subject.id}
                      className="flex items-center p-2 border rounded-md"
                    >
                      <Book className="h-4 w-4 text-muted-foreground mr-2" />
                      <span>{subject.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-2">
                  No subjects defined for this course
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" asChild>
                <Link href={`/admin/campus/classes/new?courseId=${courseCampus.id}`}>
                  Create New Class
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/campus/courses/${courseCampus.id}/classes`}>
                  Manage Classes
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
