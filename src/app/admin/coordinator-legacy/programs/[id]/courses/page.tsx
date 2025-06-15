'use client';

import React from "react";
import { useParams } from "next/navigation";
import { CoordinatorProgramCourses } from "@/components/coordinator/CoordinatorProgramCourses";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";

export default function CoordinatorProgramCoursesPage() {
  const params = useParams();
  const programId = params?.id as string;

  // Fetch program details to get the name
  const { data: programData, isLoading: programLoading } = api.coordinator.getProgramDetails.useQuery({
    programId,
  });

  // Fetch program courses
  const { data: coursesData, isLoading: coursesLoading } = api.coordinator.getProgramCourses.useQuery({
    programId,
  });

  const isLoading = programLoading || coursesLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <LoadingSpinner />
      </div>
    );
  }

  // Extract campuses from program data
  const campuses = programData?.program?.campusOfferings.map(offering => ({
    id: offering.campusId,
    name: offering.campus.name,
    code: offering.campus.code,
  })) || [];

  return (
    <div className="container mx-auto py-6">
      <CoordinatorProgramCourses 
        programId={programId}
        programName={programData?.program?.name || "Program"}
        courses={coursesData?.courses || []}
        campuses={campuses}
      />
    </div>
  );
}
