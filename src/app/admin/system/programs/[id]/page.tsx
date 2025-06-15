'use client';

import React from "react";
import { useParams } from "next/navigation";
import { ProgramDetail } from "@/components/program/ProgramDetail";
import { LoadingSpinner } from "@/components/ui/loading";
import { api } from "@/trpc/react";
import { notFound } from "next/navigation";

export default function ProgramDetailPage() {
  const params = useParams();
  const programId = params?.id;

  if (!programId || typeof programId !== 'string') {
    notFound();
  }

  const { data, isLoading } = api.program.getById.useQuery({
    id: programId,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data?.program) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold">Program not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ProgramDetail program={data.program} />
    </div>
  );
} 