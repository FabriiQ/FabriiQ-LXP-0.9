'use client';

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { CoordinatorProgramStudents } from "@/components/coordinator/CoordinatorProgramStudents";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";

export default function CoordinatorProgramStudentsPage() {
  const params = useParams();
  const programId = params?.id as string;
  
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [campusId, setCampusId] = useState("");

  // Fetch program details to get the name
  const { data: programData, isLoading: programLoading } = api.coordinator.getProgramDetails.useQuery({
    programId,
  });

  // Fetch program students
  const { data: studentsData, isLoading: studentsLoading } = api.coordinator.getProgramStudents.useQuery({
    programId,
    campusId: campusId || undefined,
    search: search || undefined,
    page,
    pageSize,
  });

  const isLoading = programLoading || studentsLoading;

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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    setPage(1); // Reset to first page on new search
  };

  const handleCampusFilter = (newCampusId: string) => {
    setCampusId(newCampusId);
    setPage(1); // Reset to first page on new filter
  };

  return (
    <div className="container mx-auto py-6">
      <CoordinatorProgramStudents 
        programId={programId}
        programName={programData?.program?.name || "Program"}
        students={studentsData?.students || []}
        total={studentsData?.total || 0}
        page={page}
        pageSize={pageSize}
        campuses={campuses}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onCampusFilter={handleCampusFilter}
      />
    </div>
  );
}
