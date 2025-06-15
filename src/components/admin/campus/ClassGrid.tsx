'use client';

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/atoms/badge";
import { 
  BookOpen,
  Users,
  Building,
  Calendar,
  School,
  GraduationCap,
  Eye,
  UserPlus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SystemStatus } from "@prisma/client";
import Link from "next/link";

interface ClassGridProps {
  classes: Array<{
    id: string;
    name: string;
    code: string;
    courseCampus?: {
      course?: {
        name: string;
      };
    };
    term?: {
      name: string;
    };
    facility?: {
      name: string;
    };
    currentCount?: number;
    maxCapacity?: number;
    status?: string;
    _count?: {
      students?: number;
      teachers?: number;
    };
    classTeacher?: {
      user?: {
        name: string;
      };
    };
  }>;
}

export function ClassGrid({ classes }: ClassGridProps) {
  const router = useRouter();

  const getStatusColor = (status: string | undefined) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {classes.length > 0 ? classes.map((cls) => (
        <Card 
          key={cls.id} 
          className="flex flex-col h-full hover:shadow-md transition-all cursor-pointer"
          onClick={() => router.push(`/admin/campus/classes/${cls.id}`)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">{cls.name}</CardTitle>
              <Badge variant={getStatusColor(cls.status)}>
                {cls.code}
              </Badge>
            </div>
            <CardDescription>
              {cls.courseCampus?.course?.name || "No course assigned"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2 flex-grow">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Term: {cls.term?.name || "Not assigned"}</span>
              </div>
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Students: {cls.currentCount || cls._count?.students || 0}/{cls.maxCapacity || "∞"}</span>
              </div>
              <div className="flex items-center text-sm">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Facility: {cls.facility?.name || "Not assigned"}</span>
              </div>
              {cls.classTeacher?.user?.name && (
                <div className="flex items-center text-sm">
                  <School className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Teacher: {cls.classTeacher.user.name}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-2 border-t flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/campus/classes/${cls.id}`);
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
                router.push(`/admin/campus/classes/${cls.id}/students`);
              }}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Students
            </Button>
          </CardFooter>
        </Card>
      )) : (
        <div className="col-span-full text-center py-8">
          <p className="text-muted-foreground">No classes found</p>
        </div>
      )}
    </div>
  );
}
