'use client';

import React from "react";
import { ProgramForm } from "@/components/program/ProgramForm";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/trpc/react";

export default function NewProgramPage() {
  const { data: institution } = api.institution.getCurrent.useQuery();

  if (!institution) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <PageHeader
        title="Create New Program"
        description="Set up a new academic program"
      />
      <ProgramForm institutionId={institution.id} />
    </div>
  );
}