'use client';

import React from "react";
import { useParams } from "next/navigation";
import { CoordinatorProgramDetail } from "@/components/coordinator/CoordinatorProgramDetail";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";

export default function CoordinatorProgramDetailPage() {
  const params = useParams();
  const programId = params?.id as string;

  // Fetch program details
  const { data, isLoading, error } = api.coordinator.getProgramDetails.useQuery({
    programId,
  });

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="p-4 bg-destructive/10 rounded-md">
          <p className="text-destructive">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <CoordinatorProgramDetail 
        program={data?.program}
        isLoading={isLoading}
      />
    </div>
  );
}
