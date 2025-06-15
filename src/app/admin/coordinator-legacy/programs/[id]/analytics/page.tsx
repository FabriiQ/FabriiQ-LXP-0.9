'use client';

import React from "react";
import { useParams } from "next/navigation";
import { ProgramAnalyticsDashboard } from "@/components/coordinator/ProgramAnalyticsDashboard";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";

export default function ProgramAnalyticsPage() {
  const params = useParams();
  const programId = params?.id as string;

  // Fetch program details to get the name and campuses
  const { data: programData, isLoading: programLoading } = api.coordinator.getProgramDetails.useQuery({
    programId,
  });

  if (programLoading) {
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
      <ProgramAnalyticsDashboard 
        programId={programId}
        programName={programData?.program?.name || "Program"}
        campuses={campuses}
      />
    </div>
  );
}
