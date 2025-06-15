'use client';

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { TeacherAssignmentList } from "@/components/coordinator/TeacherAssignmentList";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";
import { SystemStatus } from "@prisma/client";

export default function TeacherAssignmentsPage() {
  const [filters, setFilters] = useState({
    programId: undefined as string | undefined,
    campusId: undefined as string | undefined,
    search: undefined as string | undefined,
  });

  // Fetch teacher assignments
  const { data: assignmentsData, isLoading: assignmentsLoading } = api.teacherAssignment.getTeacherAssignments.useQuery({
    programId: filters.programId,
    campusId: filters.campusId,
    status: SystemStatus.ACTIVE,
  });

  // Fetch programs for filtering
  const { data: programsData, isLoading: programsLoading } = api.coordinator.getAssignedPrograms.useQuery();

  // Extract unique campuses from assigned programs
  const campuses = programsData?.programs.flatMap(program => 
    program.campusOfferings.map(offering => ({
      id: offering.campusId,
      name: offering.campus.name,
      code: offering.campus.code,
    }))
  ) || [];

  // Remove duplicate campuses
  const uniqueCampuses = campuses.filter((campus, index, self) =>
    index === self.findIndex((c) => c.id === campus.id)
  );

  const isLoading = assignmentsLoading || programsLoading;

  const handleFilterChange = (newFilters: {
    programId?: string;
    campusId?: string;
    search?: string;
  }) => {
    setFilters({
      programId: newFilters.programId,
      campusId: newFilters.campusId,
      search: newFilters.search,
    });
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Teacher Assignments"
        description="Manage teacher assignments for your programs"
      />
      
      <div className="mt-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <TeacherAssignmentList 
            assignments={assignmentsData?.assignments || []}
            programs={programsData?.programs || []}
            campuses={uniqueCampuses}
            onFilterChange={handleFilterChange}
          />
        )}
      </div>
    </div>
  );
}
