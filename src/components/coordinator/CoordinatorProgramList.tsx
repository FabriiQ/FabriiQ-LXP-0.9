'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen,
  Users,
  Building,
  Calendar,
  Search,
  ArrowUpDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SystemStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
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
  _count: {
    courses: number;
  };
}

interface CoordinatorProgramListProps {
  programs: Program[];
  isLoading?: boolean;
}

export function CoordinatorProgramList({ programs, isLoading = false }: CoordinatorProgramListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!programs || programs.length === 0) {
    return (
      <EmptyState
        title="No Programs Assigned"
        description="You don't have any programs assigned to you yet."
        icon={<BookOpen className="h-10 w-10" />}
      />
    );
  }

  // Filter programs based on search term
  const filteredPrograms = programs.filter(program => {
    const searchLower = searchTerm.toLowerCase();
    return (
      program.name.toLowerCase().includes(searchLower) ||
      program.code.toLowerCase().includes(searchLower) ||
      program.type.toLowerCase().includes(searchLower) ||
      program.coordinatorAssignments.some(a => 
        a.campusName.toLowerCase().includes(searchLower)
      )
    );
  });

  // Sort programs
  const sortedPrograms = [...filteredPrograms].sort((a, b) => {
    let valueA, valueB;

    switch (sortField) {
      case "name":
        valueA = a.name;
        valueB = b.name;
        break;
      case "code":
        valueA = a.code;
        valueB = b.code;
        break;
      case "type":
        valueA = a.type;
        valueB = b.type;
        break;
      case "level":
        valueA = a.level;
        valueB = b.level;
        break;
      case "courses":
        valueA = a._count.courses;
        valueB = b._count.courses;
        break;
      default:
        valueA = a.name;
        valueB = b.name;
    }

    if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
    if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search programs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedPrograms.map((program) => (
          <Card key={program.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{program.name}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Code: {program.code} | Type: {program.type} | Level: {program.level}
                  </CardDescription>
                </div>
                <Button
                  variant="default"
                  onClick={() => router.push(`/admin/coordinator/programs/${program.id}`)}
                >
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{program._count.courses} Courses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{program.duration} Months</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {program.coordinatorAssignments.length} {program.coordinatorAssignments.length === 1 ? 'Campus' : 'Campuses'}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Assigned Campuses:</h4>
                <div className="flex flex-wrap gap-2">
                  {program.coordinatorAssignments.map((assignment) => (
                    <Badge key={assignment.campusId} variant="outline" className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {assignment.campusName}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
