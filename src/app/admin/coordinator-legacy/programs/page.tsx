'use client';

import React from "react";
import { CoordinatorProgramList } from "@/components/coordinator/CoordinatorProgramList";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";

export default function CoordinatorProgramsPage() {
  // Fetch programs assigned to the coordinator
  const { data, isLoading, error } = api.coordinator.getAssignedPrograms.useQuery();

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader
          title="Program Management"
          description="Manage your assigned academic programs"
        />
        <div className="mt-6 p-4 bg-destructive/10 rounded-md">
          <p className="text-destructive">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Program Management"
        description="Manage your assigned academic programs"
      />
      
      <div className="mt-6">
        <CoordinatorProgramList 
          programs={data?.programs || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
