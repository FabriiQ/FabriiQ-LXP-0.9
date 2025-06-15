'use client';

import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { AssignProgramToCoordinator } from "@/components/admin/AssignProgramToCoordinator";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";
import { UserType, SystemStatus } from "@prisma/client";
import { useRouter } from "next/navigation";

export default function AssignProgramToCoordinatorPage() {
  const router = useRouter();

  // Fetch coordinators
  const { data: coordinatorsData, isLoading: coordinatorsLoading } = api.user.getUsers.useQuery({
    userType: UserType.CAMPUS_COORDINATOR,
    status: SystemStatus.ACTIVE,
  });

  // Fetch programs
  const { data: programsData, isLoading: programsLoading } = api.program.getAll.useQuery({
    status: SystemStatus.ACTIVE,
  });

  // Fetch campuses
  const { data: campusesData, isLoading: campusesLoading } = api.campus.getAll.useQuery({
    status: SystemStatus.ACTIVE,
  });

  const isLoading = coordinatorsLoading || programsLoading || campusesLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader
          title="Assign Program to Coordinator"
          description="Assign a program to a campus coordinator"
        />
        <div className="mt-6">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Transform data for the component
  const coordinators = coordinatorsData?.items.map(user => ({
    id: user.id,
    name: user.name || "Unknown",
    email: user.email || user.username,
  })) || [];

  const programs = programsData?.map(program => ({
    id: program.id,
    name: program.name,
    code: program.code,
  })) || [];

  const campuses = campusesData?.map(campus => ({
    id: campus.id,
    name: campus.name,
    code: campus.code,
  })) || [];

  const handleSuccess = () => {
    router.push("/admin/system/coordinators");
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Assign Program to Coordinator"
        description="Assign a program to a campus coordinator"
      />
      
      <div className="mt-6 max-w-2xl mx-auto">
        <AssignProgramToCoordinator
          coordinators={coordinators}
          programs={programs}
          campuses={campuses}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
