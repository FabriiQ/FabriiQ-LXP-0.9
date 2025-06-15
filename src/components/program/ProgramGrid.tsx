import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/atoms/badge";
import {
  Pencil,
  Settings,
  BookOpen,
  Users,
  Building,
  Calendar,
  School
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SystemStatus } from "@prisma/client";

interface ProgramGridProps {
  programs: Array<{
    id: string;
    name: string;
    code: string;
    status: SystemStatus;
    description?: string | null;
    type?: string;
    level?: number;
    duration?: number;
    _count: {
      courses: number;
      campusOfferings: number;
      studentEnrollments: number;
    };
  }>;
}

export function ProgramGrid({ programs }: ProgramGridProps) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {programs.length > 0 ? programs.map((program) => (
        <Card key={program.id} className="flex flex-col h-full hover:shadow-md transition-all cursor-pointer" onClick={() => router.push(`/admin/system/programs/${program.id}/edit`)}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">{program.name}</CardTitle>
              <Badge variant={getStatusColor(program.status)}>
                {program.code}
              </Badge>
            </div>
            <CardDescription>
              {program.description || program.type || "Academic Program"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2 flex-grow">
            <div className="space-y-2">
              {program.level && (
                <div className="flex items-center text-sm">
                  <School className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Level: {program.level}</span>
                </div>
              )}
              {program.duration && (
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Duration: {program.duration} {program.duration === 1 ? 'year' : 'years'}</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Courses: {program._count.courses}</span>
              </div>
              <div className="flex items-center text-sm">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Campuses: {program._count.campusOfferings}</span>
              </div>
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Students: {program._count.studentEnrollments}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2 flex justify-between">
            <Button variant="outline" size="sm" onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/system/programs/${program.id}/edit`);
            }}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="secondary" size="sm" onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/system/programs/${program.id}/config`);
            }}>
              <Settings className="h-4 w-4 mr-1" />
              Configure
            </Button>
          </CardFooter>
        </Card>
      )) : (
        <div className="col-span-full flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No programs found</h3>
          <p className="text-sm text-gray-500 mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}
