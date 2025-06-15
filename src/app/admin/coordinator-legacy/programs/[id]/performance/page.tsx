'use client';

import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CohortPerformanceDashboard } from "@/components/coordinator/CohortPerformanceDashboard";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";

export default function CohortPerformancePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const programId = params?.id as string;
  const campusId = searchParams.get('campusId') || undefined;
  const backUrl = searchParams.get('back') || `/admin/coordinator/programs/${programId}`;

  // Fetch program details to get the name
  const { data: programData, isLoading } = api.program.getById.useQuery({
    id: programId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <CohortPerformanceDashboard 
        programId={programId}
        programName={programData?.program?.name || "Program"}
        campusId={campusId}
        backUrl={backUrl}
      />
    </div>
  );
}
