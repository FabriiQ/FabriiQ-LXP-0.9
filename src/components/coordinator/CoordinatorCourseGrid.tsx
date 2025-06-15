'use client';

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/atoms/badge";
import { BookOpen, Clock, School, Users, FileText, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { SystemStatus } from "@prisma/client";

interface CoordinatorCourseGridProps {
  courses: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    level: number;
    status: SystemStatus;
    program: {
      id: string;
      name: string;
    };
    _count?: {
      subjects: number;
    };
    campusOfferings?: Array<{
      id: string;
      campusId: string;
      _count?: {
        classes: number;
      };
    }>;
  }>;
  basePath?: string;
}

export function CoordinatorCourseGrid({ courses, basePath = "/admin/coordinator/courses" }: CoordinatorCourseGridProps) {
  const router = useRouter();

  const getStatusColor = (status: SystemStatus) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "warning";
      case "ARCHIVED":
      case "ARCHIVED_CURRENT_YEAR":
      case "ARCHIVED_PREVIOUS_YEAR":
      case "ARCHIVED_HISTORICAL":
        return "secondary";
      case "DELETED":
        return "destructive";
      default:
        return "default";
    }
  };

  // Calculate total classes for a course across all campus offerings
  const getTotalClasses = (course: any) => {
    if (!course.campusOfferings) return 0;
    return course.campusOfferings.reduce((total: number, offering: any) => {
      return total + (offering._count?.classes || 0);
    }, 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.length > 0 ? courses.map((course) => (
        <Card
          key={course.id}
          className="flex flex-col h-full hover:shadow-md transition-all cursor-pointer"
          onClick={() => router.push(`${basePath}/${course.id}`)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">{course.name}</CardTitle>
              <Badge variant={getStatusColor(course.status)}>
                {course.code}
              </Badge>
            </div>
            <CardDescription>
              {course.program.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2 flex-grow">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <School className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Level: {course.level}</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Credits: {course.credits}</span>
              </div>
              {course._count && (
                <div className="flex items-center text-sm">
                  <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Subjects: {course._count.subjects}</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Classes: {getTotalClasses(course)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2 border-t flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`${basePath}/${course.id}`);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`${basePath}/${course.id}/subjects`);
              }}
            >
              <FileText className="h-4 w-4 mr-1" />
              Subjects
            </Button>
          </CardFooter>
        </Card>
      )) : (
        <div className="col-span-full text-center py-8">
          <p className="text-muted-foreground">No courses found</p>
        </div>
      )}
    </div>
  );
}
