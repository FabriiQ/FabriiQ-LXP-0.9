'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Filter,
  BookOpen,
  Calendar,
  Building,
  UserPlus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SystemStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { LoadingSpinner } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TeacherAssignmentForm } from "./TeacherAssignmentForm";
import { api } from "@/trpc/react";

interface TeacherAssignment {
  id: string;
  name: string;
  code: string;
  courseCampus: {
    course: {
      id: string;
      name: string;
      code: string;
      program: {
        id: string;
        name: string;
        code: string;
      };
    };
    campus: {
      id: string;
      name: string;
      code: string;
    };
  };
  classTeacher: {
    id: string;
    name: string;
    email: string;
  } | null;
  term: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date | null;
  };
  _count: {
    students: number;
  };
}

interface Program {
  id: string;
  name: string;
  code: string;
}

interface Campus {
  id: string;
  name: string;
  code: string;
}

interface TeacherAssignmentListProps {
  assignments: TeacherAssignment[];
  isLoading?: boolean;
  programs?: Program[];
  campuses?: Campus[];
  onFilterChange?: (filters: {
    programId?: string;
    campusId?: string;
    search?: string;
  }) => void;
}

export function TeacherAssignmentList({
  assignments,
  isLoading = false,
  programs = [],
  campuses = [],
  onFilterChange
}: TeacherAssignmentListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("all-programs");
  const [campusFilter, setCampusFilter] = useState<string>("all-campuses");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Refetch assignments after a teacher is assigned or unassigned
  const utils = api.useUtils();
  const handleAssignmentSuccess = () => {
    utils.teacherAssignment.getTeacherAssignments.invalidate();
    setIsAssignDialogOpen(false);
  };

  // Handle search
  const handleSearch = () => {
    if (onFilterChange) {
      onFilterChange({
        programId: programFilter === 'all-programs' ? undefined : programFilter,
        campusId: campusFilter === 'all-campuses' ? undefined : campusFilter,
        search: searchTerm || undefined
      });
    }
  };

  // Handle filter changes
  const handleProgramChange = (value: string) => {
    setProgramFilter(value);
    if (onFilterChange) {
      onFilterChange({
        programId: value === 'all-programs' ? undefined : value,
        campusId: campusFilter === 'all-campuses' ? undefined : campusFilter,
        search: searchTerm || undefined
      });
    }
  };

  const handleCampusChange = (value: string) => {
    setCampusFilter(value);
    if (onFilterChange) {
      onFilterChange({
        programId: programFilter === 'all-programs' ? undefined : programFilter,
        campusId: value === 'all-campuses' ? undefined : value,
        search: searchTerm || undefined
      });
    }
  };

  // Handle opening the assignment dialog
  const handleAssignClick = (classId: string, className: string, teacherId: string | null) => {
    setSelectedClassId(classId);
    setSelectedClassName(className);
    setSelectedTeacherId(teacherId);
    setIsAssignDialogOpen(true);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!assignments || assignments.length === 0) {
    return (
      <EmptyState
        title="No Classes Found"
        description="There are no classes available for teacher assignment."
        icon={<Users className="h-10 w-10" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search classes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>

        {programs.length > 0 && (
          <div className="w-full md:w-40">
            <Select
              value={programFilter}
              onValueChange={handleProgramChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-programs">All Programs</SelectItem>
                {programs.map(program => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {campuses.length > 0 && (
          <div className="w-full md:w-40">
            <Select
              value={campusFilter}
              onValueChange={handleCampusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Campuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-campuses">All Campuses</SelectItem>
                {campuses.map(campus => (
                  <SelectItem key={campus.id} value={campus.id}>
                    {campus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{assignment.name}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Code: {assignment.code} | Term: {assignment.term.name}
                  </CardDescription>
                </div>
                <Button
                  variant="default"
                  onClick={() => handleAssignClick(
                    assignment.id,
                    assignment.name,
                    assignment.classTeacher?.id || null
                  )}
                >
                  {assignment.classTeacher ? (
                    <>Change Teacher</>
                  ) : (
                    <><UserPlus className="mr-2 h-4 w-4" /> Assign Teacher</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {assignment.courseCampus.course.name} ({assignment.courseCampus.course.code})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {assignment.courseCampus.campus.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {assignment._count.students} Students
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Assigned Teacher:</h4>
                {assignment.classTeacher ? (
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={assignment.classTeacher.name} />
                      <AvatarFallback>
                        {assignment.classTeacher.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{assignment.classTeacher.name}</p>
                      <p className="text-xs text-muted-foreground">{assignment.classTeacher.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No teacher assigned</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Teacher Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Assign Teacher</DialogTitle>
            <DialogDescription>
              Assign a teacher to the class
            </DialogDescription>
          </DialogHeader>
          {selectedClassId && (
            <TeacherAssignmentForm
              classId={selectedClassId}
              className={selectedClassName}
              currentTeacherId={selectedTeacherId}
              onSuccess={handleAssignmentSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
