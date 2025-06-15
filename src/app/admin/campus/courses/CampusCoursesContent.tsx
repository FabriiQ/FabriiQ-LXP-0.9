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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  BookOpen,
  Users,
  BarChart,
  ClipboardCheck
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

interface CourseAnalytics {
  courseCampusId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  programName: string;
  classCount: number;
  studentCount: number;
  attendanceRate: number;
  assessmentCount: number;
}

interface CampusCoursesContentProps {
  campus: {
    id: string;
    name: string;
    code: string;
  };
  courseCampuses: any[];
  courseAnalytics: CourseAnalytics[];
}

export function CampusCoursesContent({
  campus,
  courseCampuses,
  courseAnalytics
}: CampusCoursesContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  // Get unique programs for filtering
  const programs = [...new Set(courseCampuses.map(cc => cc.course.program.name))];

  // Filter courses based on search term and selected program
  const filteredCourses = courseCampuses.filter(cc => {
    const matchesSearch = searchTerm === "" ||
      cc.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cc.course.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProgram = selectedProgram === null ||
      cc.course.program.name === selectedProgram;

    return matchesSearch && matchesProgram;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
          <p className="text-muted-foreground">Manage courses at {campus.name}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-auto md:min-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedProgram === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedProgram(null)}
          >
            All Programs
          </Button>
          {programs.map(program => (
            <Button
              key={program}
              variant={selectedProgram === program ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedProgram(program)}
            >
              {program}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[200px]">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((cc) => {
              const analytics = courseAnalytics.find(ca => ca.courseCampusId === cc.id);

              return (
                <Card key={cc.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{cc.course.name}</CardTitle>
                          <CardDescription>{cc.course.program.name}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm pt-2">
                          <span className="text-muted-foreground">Code:</span>
                          <span className="font-medium">{cc.course.code}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Credits:</span>
                          <span className="font-medium">{cc.course.credits}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Level:</span>
                          <span className="font-medium">{cc.course.level}</span>
                        </div>
                      </div>

                      {analytics && (
                        <div className="space-y-3 pt-2 border-t">
                          <h4 className="text-sm font-medium">Analytics</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
                              <Users className="h-4 w-4 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground">Students</span>
                              <span className="font-medium">{analytics.studentCount}</span>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
                              <BarChart className="h-4 w-4 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground">Classes</span>
                              <span className="font-medium">{analytics.classCount}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Attendance Rate</span>
                              <span className="font-medium">{analytics.attendanceRate}%</span>
                            </div>
                            <Progress value={analytics.attendanceRate} className="h-2" />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0 flex justify-between">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/campus/courses/${cc.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/campus/courses/${cc.id}/classes`}>
                        Manage Classes
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}

            {filteredCourses.length === 0 && (
              <div className="col-span-3 text-center py-10">
                <p className="text-muted-foreground">No courses found</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead className="text-center">Classes</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-center">Attendance</TableHead>
                    <TableHead className="text-center">Assessments</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((cc) => {
                    const analytics = courseAnalytics.find(ca => ca.courseCampusId === cc.id);

                    return (
                      <TableRow key={cc.id}>
                        <TableCell className="font-medium">{cc.course.name}</TableCell>
                        <TableCell>{cc.course.code}</TableCell>
                        <TableCell>{cc.course.program.name}</TableCell>
                        <TableCell className="text-center">{analytics?.classCount || 0}</TableCell>
                        <TableCell className="text-center">{analytics?.studentCount || 0}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <span className="mr-2">{analytics?.attendanceRate || 0}%</span>
                            <div className="w-16">
                              <Progress value={analytics?.attendanceRate || 0} className="h-2" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{analytics?.assessmentCount || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/campus/courses/${cc.id}`}>
                                View
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/campus/courses/${cc.id}/classes`}>
                                Classes
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {filteredCourses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        No courses found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
