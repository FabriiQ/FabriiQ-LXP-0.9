'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/data-display/card";
import { ArrowLeftIcon, PlusIcon } from "lucide-react";
import { StudentFilters } from "@/components/campus/StudentFilters";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading";
import { Campus, Program, ProgramCampus } from "@prisma/client";

interface CampusStudentsContentProps {
  campus: Campus & {
    institution: {
      id: string;
      name: string;
      code: string;
    };
  };
  programCampuses: (ProgramCampus & { program: Program })[];
  searchParams: {
    search?: string;
    programId?: string;
  };
}

export function CampusStudentsContent({
  campus,
  programCampuses,
  searchParams,
}: CampusStudentsContentProps) {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/admin/system/campuses/${campus.id}`}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Campus
            </Link>
          </Button>
          <PageHeader
            title="Campus Students"
            description={`Manage students for ${campus.name}`}
            action={
              <Button asChild>
                <Link href={`/admin/system/campuses/${campus.id}/students/new`}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Student
                </Link>
              </Button>
            }
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Suspense fallback={<LoadingSpinner />}>
            <StudentFilters
              programCampuses={programCampuses}
              currentProgramId={searchParams.programId}
              campusId={campus.id}
              searchQuery={searchParams.search}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
} 