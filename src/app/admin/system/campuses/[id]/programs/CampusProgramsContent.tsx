'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeftIcon } from "lucide-react";
import { Campus, Program, ProgramCampus } from "@prisma/client";
import { ProgramAssignmentRevamped } from "@/components/campus/ProgramAssignmentRevamped";

interface CampusProgramsContentProps {
  campus: Campus & {
    institution: {
      id: string;
      name: string;
      code: string;
    };
  };
  programCampuses: (ProgramCampus & {
    program: Program;
    _count: {
      classes: number;
      courseOfferings: number;
    };
  })[];
  availablePrograms: Program[];
}

export function CampusProgramsContent({
  campus,
  programCampuses,
  availablePrograms,
}: CampusProgramsContentProps) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/admin/system/campuses/${campus.id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`Programs - ${campus.name}`}
          description={`Manage programs for ${campus.code} campus`}
        />
      </div>

      <div className="max-w-6xl mx-auto">
        <ProgramAssignmentRevamped
          campusId={campus.id}
          allPrograms={[
            ...programCampuses.map(pc => pc.program),
            ...availablePrograms
          ]}
          assignedPrograms={programCampuses}
          campus={{
            id: campus.id,
            institutionId: campus.institutionId
          }}
        />
      </div>
    </div>
  );
}