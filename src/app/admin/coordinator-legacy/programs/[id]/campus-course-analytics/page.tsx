'use client';

import React from "react";
import { useParams } from "next/navigation";
import { CoordinatorAnalyticsNavigation } from "@/components/coordinator/CoordinatorAnalyticsNavigation";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Campus Course Analytics Page for Coordinators
 * 
 * This page allows coordinators to view consolidated analytics of classes in courses
 * across single or multiple campuses they coordinate.
 * 
 * It reuses existing class and program analytics implementations rather than creating new ones,
 * and enables navigation between programs, courses, and classes for coordinators.
 */
export default function CampusCourseAnalyticsPage() {
  const params = useParams();
  const programId = params?.id as string;

  // Fetch program details to get the name, code, and campuses
  const { data: programData, isLoading: programLoading } = api.coordinator.getProgramDetails.useQuery({
    programId,
  });

  // Fetch coordinator assignments to determine which campuses they're assigned to
  const { data: assignmentsData, isLoading: assignmentsLoading } = api.coordinator.getCoordinatorAssignments.useQuery();

  // Show loading state while fetching data
  if (programLoading || assignmentsLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle case where program data is not available
  if (!programData?.program) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">Program not found or you don't have access to it</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract campuses from program data
  const campuses = programData.program.campusOfferings.map(offering => ({
    id: offering.campusId,
    name: offering.campus.name,
    code: offering.campus.code,
  }));

  // Extract coordinator assignments for this program
  const coordinatorAssignments = assignmentsData?.programs
    .find(p => p.id === programId)?.coordinatorAssignments || [];

  return (
    <div className="container mx-auto py-6">
      <CoordinatorAnalyticsNavigation 
        programId={programId}
        programName={programData.program.name}
        programCode={programData.program.code}
        campuses={campuses}
        coordinatorAssignments={coordinatorAssignments}
      />
    </div>
  );
}
